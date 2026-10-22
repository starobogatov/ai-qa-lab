import fs from 'fs';
import path from 'path';
import { test, expect, errors, type Locator } from '@playwright/test';

/**
 * Runtime self-healing for page object locators (lab experiment, Healenium-style).
 *
 *   HEAL_MODE=off (default)  plain Playwright locators, no overhead
 *   HEAL_MODE=warn           every element a locator finds is fingerprinted; when a locator
 *                            later finds nothing, the closest match on the page is used
 *                            instead and the heal is flagged in the report
 *   HEAL_MODE=strict         same as warn, but the test still fails after healing
 *
 * Only actions (click, fill, ...) are healed. Assertions like expect(locator).toBeVisible()
 * use the original locator, so a broken locator in an assertion still fails.
 */
export type HealMode = 'off' | 'warn' | 'strict';
export const HEAL_MODE = (process.env.HEAL_MODE ?? 'off') as HealMode;

/** How long a locator may take to appear before we try to heal it. */
const PROBE_TIMEOUT = Number(process.env.HEAL_TIMEOUT ?? 8000);
/** Minimum similarity (0..1) for a candidate to be accepted. */
const MIN_SCORE = 0.5;

const FINGERPRINT_DIR = path.join(__dirname, '..', '..', 'healing', 'fingerprints');

const ACTIONS = new Set([
  'click', 'dblclick', 'fill', 'press', 'pressSequentially', 'check', 'uncheck',
  'hover', 'selectOption', 'inputValue', 'textContent', 'innerText',
]);

/** How much each attribute counts towards the similarity score. */
const WEIGHTS: Record<string, number> = {
  'data-test': 3, id: 3, name: 2, placeholder: 2, 'aria-label': 2, value: 2,
  text: 2, type: 1, role: 1, class: 1,
};

type Fingerprint = { tag: string; attrs: Record<string, string> };
type Match = { selector: string; score: number; attrs: Record<string, string> };

/** Wraps a locator so its actions heal at runtime. Returns it untouched when HEAL_MODE=off. */
export function healable(locator: Locator, key: string): Locator {
  if (HEAL_MODE === 'off') return locator;

  return new Proxy(locator, {
    get(target, prop) {
      const value = Reflect.get(target, prop, target);
      if (typeof value !== 'function') return value;
      if (typeof prop !== 'string' || !ACTIONS.has(prop)) return value.bind(target);

      return async (...args: unknown[]) => {
        const resolved = await resolve(target, key);
        return (resolved as any)[prop](...args);
      };
    },
  });
}

async function resolve(locator: Locator, key: string): Promise<Locator> {
  try {
    await locator.waitFor({ state: 'attached', timeout: PROBE_TIMEOUT });
  } catch (e) {
    // Only "found nothing" is healable; strict-mode violations and closed pages are real errors.
    if (!(e instanceof errors.TimeoutError)) throw e;
    return heal(locator, key);
  }
  await saveFingerprint(locator, key);
  return locator;
}

async function heal(broken: Locator, key: string): Promise<Locator> {
  const fingerprint = readFingerprint(key);
  if (!fingerprint) {
    throw new Error(
      `[self-heal] ${key}: ${broken} found nothing and there is no fingerprint to heal from. ` +
        'Run the suite once with HEAL_MODE=warn while the locator still works.',
    );
  }

  const page = broken.page();
  const match = await page.evaluate(findBestMatch, { fingerprint, weights: WEIGHTS });
  if (!match || match.score < MIN_SCORE) {
    throw new Error(
      `[self-heal] ${key}: ${broken} found nothing, and no element on the page is similar enough ` +
        `(best score ${match ? match.score.toFixed(2) : 'n/a'}, need ${MIN_SCORE}).`,
    );
  }

  const summary = `${key}: ${broken} → ${match.selector} (score ${match.score.toFixed(2)})`;
  console.warn(`[self-heal] ${summary}`);

  const info = test.info();
  info.annotations.push({ type: 'self-healed', description: summary });
  await info.attach(`self-heal ${key}`, {
    body: JSON.stringify({ key, broken: String(broken), healedTo: match.selector, ...match, fingerprint }, null, 2),
    contentType: 'application/json',
  });
  if (HEAL_MODE === 'strict') {
    expect.soft(false, `[self-heal strict] ${summary}. Fix the locator.`).toBe(true);
  }

  return page.locator(match.selector);
}


function fingerprintFile(key: string): string {
  return path.join(FINGERPRINT_DIR, `${key}.json`);
}

function readFingerprint(key: string): Fingerprint | undefined {
  try {
    return JSON.parse(fs.readFileSync(fingerprintFile(key), 'utf8'));
  } catch {
    return undefined;
  }
}

async function saveFingerprint(locator: Locator, key: string) {
  try {
    const fingerprint = await locator.evaluate(takeFingerprint, { timeout: 1000 });
    const json = JSON.stringify(fingerprint, null, 2);
    const file = fingerprintFile(key);
    if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === json) return;
    fs.mkdirSync(FINGERPRINT_DIR, { recursive: true });
    // Write then rename, so parallel workers never read a half-written file.
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, json);
    fs.renameSync(tmp, file);
  } catch {
    // Fingerprints are best effort: a failure to save one must never fail the test.
  }
}


// Runs inside the browser via evaluate(), so it must be self-contained.
function takeFingerprint(el: Element): Fingerprint {
  const attrs: Record<string, string> = {};
  for (const name of ['data-test', 'id', 'name', 'placeholder', 'aria-label', 'value', 'type', 'role', 'class']) {
    const v = el.getAttribute(name);
    if (v) attrs[name] = v;
  }
  const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ');
  if (text && text.length <= 80) attrs.text = text;
  return { tag: el.tagName.toLowerCase(), attrs };
}

// Runs inside the browser via evaluate(), so it must be self-contained.
function findBestMatch(args: { fingerprint: Fingerprint; weights: Record<string, number> }): Match | null {
  const { fingerprint, weights } = args;

  const attrsOf = (el: Element) => {
    const attrs: Record<string, string> = {};
    for (const name of Object.keys(weights)) {
      const v = name === 'text' ? (el.textContent ?? '').trim().replace(/\s+/g, ' ') : el.getAttribute(name);
      if (v) attrs[name] = v;
    }
    return attrs;
  };

  const similarity = (attrs: Record<string, string>) => {
    let total = 0;
    let matched = 0;
    for (const [name, expected] of Object.entries(fingerprint.attrs)) {
      const weight = weights[name] ?? 0;
      total += weight;
      const actual = attrs[name];
      if (!actual) continue;
      if (name === 'class') {
        const a = new Set(expected.split(/\s+/));
        const b = new Set(actual.split(/\s+/));
        const common = [...a].filter((c) => b.has(c)).length;
        matched += weight * (common / new Set([...a, ...b]).size);
      } else if (actual.toLowerCase() === expected.toLowerCase()) {
        matched += weight;
      }
    }
    return total ? matched / total : 0;
  };

  const unique = (selector: string) => (document.querySelectorAll(selector).length === 1 ? selector : null);

  const cssFor = (el: Element): string => {
    const dataTest = el.getAttribute('data-test');
    const byDataTest = dataTest && unique(`[data-test="${CSS.escape(dataTest)}"]`);
    if (byDataTest) return byDataTest;
    const byId = el.id && unique(`#${CSS.escape(el.id)}`);
    if (byId) return byId;
    const parts: string[] = [];
    for (let e: Element | null = el; e && e !== document.body; e = e.parentElement) {
      const siblings = [...(e.parentElement?.children ?? [])].filter((c) => c.tagName === e!.tagName);
      parts.unshift(`${e.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(e) + 1})`);
    }
    return `body > ${parts.join(' > ')}`;
  };

  let best: Match | null = null;
  for (const el of document.querySelectorAll(fingerprint.tag)) {
    if (el.getClientRects().length === 0) continue;
    const attrs = attrsOf(el);
    const score = similarity(attrs);
    if (!best || score > best.score) best = { selector: cssFor(el), score, attrs };
  }
  return best;
}
