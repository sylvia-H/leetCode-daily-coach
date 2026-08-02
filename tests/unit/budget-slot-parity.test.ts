// slot⇄field 對等不變式（docs/spec.md §14.5，F5 定案 2026-07-24）的**唯一**強制點。
//
// 不變式：Renderer 每放進 embed 的一段**可變長度文字**，MUST 同時於 `RenderedMessage.budgetSlots`
// 登記對應 slot；未登記者等同完全逃過逐區塊預算，只剩 field 1024 與總量 5,500 兜底。
//
// 本檔於 F8（008-review-extras）由 `tests/unit/review-fixes.test.ts` **純搬移**而來，行為未變更：
// 該檔是「某一輪 code review findings 的回歸測試集合」，而本測試是涵蓋**全部版面類型**的全域不變式，
// 住在以 findings 命名的檔案裡會讓後來的人找不到它。搬移後 docs/spec.md §14.5 與
// specs/005-lesson-compiler 的兩份契約同步改指向本檔。
import { describe, expect, it } from "vitest";
import { render } from "../../src/renderer/discord.js";
import { makeLesson } from "../helpers/lesson.js";

describe("slot⇄field 對等不變式（全版面）", () => {
  it("五種版面的每個 embed field 值都能在 budgetSlots 中找到（固定文案除外）", () => {
    // 例外只給「非教材自由文字」：固定標籤，以及由 Compiler 依課表生成的複習清單
    // （長度由 rhythm 週長與 Concept 標題決定，不是作者可寫長的段落）。
    const FIXED_TEXTS = new Set(["Pattern X", "O(n)", "20 分鐘"]);
    const EXEMPT_FIELDS = new Set(["📚 本週涵蓋"]);
    const lessons = [
      makeLesson({
        type: "concept",
        concept: {
          id: "a",
          title: "A",
          digest: "digest",
          tsTip: "ts",
          pyTip: "py",
          takeaway: "take",
          exitCriteria: ["c1"],
          patternLabel: "Pattern X",
          complexityLabel: "O(n)",
          estimatedMinutes: 20,
          articlePath: "x.md",
        },
        path: { current: "A" },
        overlayNotes: "補充",
        problems: [{ id: 1, title: "T", url: "https://x/", difficulty: "Easy", whyThisPattern: "why" }],
      }),
      makeLesson({
        type: "review",
        reviewConcepts: [{ id: "a", title: "A" }],
        reflectionQuestion: "反思問題",
        problems: [{ id: 1, title: "T", url: "https://x/", difficulty: "Easy" }],
      }),
      makeLesson({ type: "rest", encouragement: "加油！" }),
    ];

    for (const lesson of lessons) {
      for (const message of render(lesson)) {
        const slotValues = new Set<string>();
        for (const value of Object.values(message.budgetSlots)) {
          if (typeof value === "string") slotValues.add(value);
          else if (Array.isArray(value)) for (const v of value) slotValues.add(v);
        }
        for (const embed of message.embeds) {
          for (const field of embed.fields ?? []) {
            if (FIXED_TEXTS.has(field.value) || EXEMPT_FIELDS.has(field.name)) continue;
            const covered = [...slotValues].some((slot) => field.value === slot || field.value.includes(slot));
            expect(covered, `${lesson.type} 的 field「${field.name}」未登記 budgetSlot`).toBe(true);
          }
        }
      }
    }
  });
});
