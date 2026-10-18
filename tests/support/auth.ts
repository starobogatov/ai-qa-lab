import path from 'path';

export const PASSWORD = 'secret_sauce';

/** Users that get a saved storageState from the setup project. */
export const AUTH_USERS = [
  'standard_user',
  'problem_user',
  'error_user',
  'performance_glitch_user',
] as const;

export type AuthUser = (typeof AUTH_USERS)[number];

export function authFile(user: AuthUser): string {
  return path.join(__dirname, '..', '..', 'playwright', '.auth', `${user}.json`);
}

/** Use in test.use() to start a test logged out. */
export const LOGGED_OUT = { cookies: [], origins: [] };
