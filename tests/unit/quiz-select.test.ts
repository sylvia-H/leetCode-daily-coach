// F11 小測選題公式的不變式（FR-003、contracts/quiz-selection.md §2）：I1（同一 (track, conceptId)
// 恆選同一題）、I2（三軌 trackOffset 互異取到相異題目）；bank 缺 Concept 或陣列為空 ⇒ undefined（FR-007）。
import { describe, expect, it } from "vitest";
import { selectQuizItem, type QuizBank, type QuizItem } from "../../src/compiler/quiz.js";
import { makeGraph } from "../helpers/compiler.js";
import type { Track } from "../../src/types/lesson.js";

const TRACKS: readonly Track[] = ["foundation", "interviewReady", "interviewMastery"];

function makeItem(stem: string): QuizItem {
  return {
    stem,
    options: ["A", "B", "C", "D"],
    answerIndex: 0,
    explanation: ["結論", "正解", "選項2", "選項3", "選項4"],
  };
}

describe("selectQuizItem（FR-003、quiz-selection.md §2）", () => {
  const graph = makeGraph([{ id: "two-pointer", localOrder: 3 }]);
  const bank: QuizBank = {
    version: 1,
    byConcept: {
      "two-pointer": [makeItem("q0"), makeItem("q1"), makeItem("q2"), makeItem("q3")],
    },
  };

  it("I1：同一 (track, conceptId) 永遠選到同一題", () => {
    const first = selectQuizItem({ bank, graph, track: "foundation", conceptId: "two-pointer" });
    const second = selectQuizItem({ bank, graph, track: "foundation", conceptId: "two-pointer" });
    expect(first).toEqual(second);
  });

  it("I2：三軌在同一 Concept 取得相異題目（trackOffset 互異）", () => {
    const perTrack = TRACKS.map(
      (track) => selectQuizItem({ bank, graph, track, conceptId: "two-pointer" })!.stem,
    );
    expect(new Set(perTrack).size).toBe(3);
  });

  it("索引公式為 (localOrder + trackOffset) mod items.length", () => {
    // localOrder=3，items.length=4：foundation(offset0)→index3、interviewReady(offset1)→index0、
    // interviewMastery(offset2)→index1
    expect(selectQuizItem({ bank, graph, track: "foundation", conceptId: "two-pointer" })?.stem).toBe("q3");
    expect(selectQuizItem({ bank, graph, track: "interviewReady", conceptId: "two-pointer" })?.stem).toBe("q0");
    expect(selectQuizItem({ bank, graph, track: "interviewMastery", conceptId: "two-pointer" })?.stem).toBe("q1");
  });

  it("bank 缺該 Concept ⇒ undefined（FR-007）", () => {
    const result = selectQuizItem({ bank, graph, track: "foundation", conceptId: "unknown-concept" });
    expect(result).toBeUndefined();
  });

  it("該 Concept 陣列為空 ⇒ undefined（FR-007）", () => {
    const emptyBank: QuizBank = { version: 1, byConcept: { "two-pointer": [] } };
    const result = selectQuizItem({ bank: emptyBank, graph, track: "foundation", conceptId: "two-pointer" });
    expect(result).toBeUndefined();
  });
});
