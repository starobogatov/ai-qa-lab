import { defineConfig } from "allure";

export default defineConfig({
  name: "SauceDemo – Playwright",
  output: "./allure-report",
  historyPath: "./allure-history/history.jsonl",
});
