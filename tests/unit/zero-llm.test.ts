import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function listTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listTsFiles(full));
    } else if (entry.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

describe("零 LLM 憲章驗證（憲章 VIII、SC-008）", () => {
  it("src/** 的原始碼不含 @google/genai import", () => {
    const srcDir = join(process.cwd(), "src");
    const files = listTsFiles(srcDir);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      expect(content, `${file} MUST NOT import @google/genai`).not.toMatch(/@google\/genai/);
    }
  });

  it("全樹掃描含 src/compiler/problem.ts（F3 FR-012 回歸守衛：防未來重構漏掉此模組）", () => {
    const files = listTsFiles(join(process.cwd(), "src"));
    const normalized = files.map((f) => f.replace(/\\/g, "/"));
    expect(normalized.some((f) => f.endsWith("src/compiler/problem.ts"))).toBe(true);
  });

  it("全樹掃描含 src/compiler/schedule-generator.ts 與 schedule-schema.ts（F4 憲章 VIII 回歸守衛）", () => {
    const files = listTsFiles(join(process.cwd(), "src"));
    const normalized = files.map((f) => f.replace(/\\/g, "/"));
    expect(normalized.some((f) => f.endsWith("src/compiler/schedule-generator.ts"))).toBe(true);
    expect(normalized.some((f) => f.endsWith("src/compiler/schedule-schema.ts"))).toBe(true);
  });

  it("全樹掃描含 src/compiler/gate.ts 與 src/compiler/overlay.ts（F5 憲章 VIII 回歸守衛）", () => {
    const files = listTsFiles(join(process.cwd(), "src"));
    const normalized = files.map((f) => f.replace(/\\/g, "/"));
    expect(normalized.some((f) => f.endsWith("src/compiler/gate.ts"))).toBe(true);
    expect(normalized.some((f) => f.endsWith("src/compiler/overlay.ts"))).toBe(true);
  });

  it("scripts/validate.ts 不含 @google/genai import（F5 內容 Gate 入口零 LLM）", () => {
    const content = readFileSync(join(process.cwd(), "scripts", "validate.ts"), "utf-8");
    expect(content).not.toMatch(/@google\/genai/);
  });

  it(".github/workflows/daily.yml 不含 GEMINI_API_KEY 字串", () => {
    const workflowPath = join(process.cwd(), ".github", "workflows", "daily.yml");
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).not.toMatch(/GEMINI_API_KEY/);
  });

  // F6 SC-005：擴充為金鑰名稱清單掃描，而非單一字串比對。清單至少含現行唯一金鑰
  // GEMINI_API_KEY，並預留未來其他供應商金鑰名稱（FR-005）。
  const LLM_KEY_NAMES = ["GEMINI_API_KEY", "GOOGLE_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"];

  it("F6 SC-005：daily.yml 中金鑰名稱清單的出現次數皆為 0", () => {
    const workflowPath = join(process.cwd(), ".github", "workflows", "daily.yml");
    const content = readFileSync(workflowPath, "utf-8");
    for (const keyName of LLM_KEY_NAMES) {
      const occurrences = content.split(keyName).length - 1;
      expect(occurrences, `daily.yml 不應出現 ${keyName}`).toBe(0);
    }
  });

  // F6 FR-006 回歸守衛：多 Track MUST NOT 平行分派（會競爭 state 分支）。
  it("F6 FR-006：daily.yml 不含 strategy: / matrix:（單一 job 單一執行序）", () => {
    const workflowPath = join(process.cwd(), ".github", "workflows", "daily.yml");
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).not.toMatch(/strategy:/);
    expect(content).not.toMatch(/matrix:/);
  });
});

// F6 T029a【驗證既有】：daily.yml 已實作 FR-015 / FR-016 / FR-019 的 workflow 層行為，本描述區塊
// 只補回歸斷言，MUST NOT 改 workflow。
describe("daily.yml workflow 層回歸斷言（F6 FR-015 / FR-016 / FR-019）", () => {
  const workflowPath = join(process.cwd(), ".github", "workflows", "daily.yml");
  const content = readFileSync(workflowPath, "utf-8");

  it("FR-015：提交 step 含無變更偵測（git diff --cached --quiet 命中時 exit 0，不產生空 commit）", () => {
    expect(content).toMatch(/git diff --cached --quiet/);
    expect(content).toMatch(/state\.json 無變更，略過提交[\s\S]*?exit 0/);
  });

  it("FR-016：推送重試上限為 3（max_attempts=3）且以 git pull --rebase --autostash 重新同步", () => {
    expect(content).toMatch(/max_attempts=3/);
    expect(content).toMatch(/git pull --rebase --autostash origin state/);
    // MUST NOT 使用強制覆寫的推送方式。
    expect(content).not.toMatch(/git push --force/);
    expect(content).not.toMatch(/\+HEAD:/);
  });

  it("FR-019：最後防線通知 step 的 payload 為極簡純文字（只含 content 鍵，不含 embeds）", () => {
    const noticeStepMatch = content.match(/最後防線通知[\s\S]*$/);
    expect(noticeStepMatch).not.toBeNull();
    const noticeStep = noticeStepMatch![0];
    expect(noticeStep).toMatch(/\\?"content\\?":/);
    expect(noticeStep).not.toMatch(/embeds/);
  });
});

describe("內容 Gate 可在無任何環境變數與 API key 下執行（SC-007 自動化把關）", () => {
  it("scripts/validate.ts 完全不讀取 process.env（無 webhook、無 GEMINI_API_KEY 依賴）", () => {
    const content = readFileSync(join(process.cwd(), "scripts", "validate.ts"), "utf-8");
    expect(content).not.toMatch(/process\.env/);
  });

  it("src/compiler/gate.ts 完全不讀取 process.env", () => {
    const content = readFileSync(join(process.cwd(), "src", "compiler", "gate.ts"), "utf-8");
    expect(content).not.toMatch(/process\.env/);
  });

  it("src/compiler/lesson.ts（loadCompilerDeps 所在檔）不讀取任何 webhook／API key 環境變數", () => {
    const content = readFileSync(join(process.cwd(), "src", "compiler", "lesson.ts"), "utf-8");
    expect(content).not.toMatch(/DISCORD_WEBHOOK_URL|GEMINI_API_KEY/);
  });
});
