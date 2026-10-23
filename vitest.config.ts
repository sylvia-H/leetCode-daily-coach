import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // tests/e2e/isolation.test.ts 以 process.chdir() 製造全域性失敗；worker_threads 下 chdir 不可用，
    // MUST 跑在 child_process（forks）。vitest 2～5 的預設都是 forks，明寫以免日後預設改變而靜默失效。
    pool: "forks",
    // 本專案全為 ESM（package.json "type": "module"）；關掉 vitest 預設注入的 CommonJS 變數
    // （require、__dirname…），讓測試期與 Node 實際執行一致，誤用 CJS 變數會在測試就失敗。
    injectCjsGlobals: false,
  },
});
