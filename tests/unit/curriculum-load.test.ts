import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadCurriculum, validateCurriculum } from "../../src/compiler/curriculum.js";

const FIX = join(process.cwd(), "tests", "fixtures", "curriculum");

function load(dir: string, conceptsSub = "concepts") {
  return loadCurriculum({
    modulesPath: join(FIX, dir, "modules.json"),
    conceptsDir: join(FIX, dir, conceptsSub),
  });
}

describe("loadCurriculum（載入 + 建圖，R5 / FR-013）", () => {
  it("讀取合法課程：建出節點、擷取 NNN 為 localOrder、記錄 skeletonPath 與 dirName", () => {
    const { graph, loadViolations } = load("valid");
    expect(loadViolations).toHaveLength(0);
    expect(graph.modules).toHaveLength(16);

    const alpha = graph.concepts.get("alpha");
    expect(alpha).toBeDefined();
    expect(alpha?.localOrder).toBe(1);
    expect(alpha?.dirName).toBe("programming-mindset");
    expect(alpha?.skeletonPath.replace(/\\/g, "/")).toMatch(/programming-mindset\/001-alpha\.md$/);
    expect(alpha?.next).toEqual(["beta"]);

    const beta = graph.concepts.get("beta");
    expect(beta?.localOrder).toBe(2);
    expect(beta?.prerequisite).toEqual(["alpha"]);
  });

  it("確定性：重複載入兩次，concept id 走訪順序與 ordinal 逐次一致（R5 / FR-025）", () => {
    const a = load("valid");
    const b = load("valid");
    expect([...a.graph.concepts.keys()]).toEqual([...b.graph.concepts.keys()]);
    expect([...a.graph.ordinalOf.entries()]).toEqual([...b.graph.ordinalOf.entries()]);
  });

  it("重複的 Concept id → loadViolations 含 duplicate-id（load 層偵測，FR-020）", () => {
    const { loadViolations } = load("dup-id");
    const dup = loadViolations.find((v) => v.rule === "duplicate-id");
    expect(dup).toBeDefined();
    expect(dup?.subject).toBe("dup-concept");
  });

  it("職責邊界：即使 concept 有懸空 prerequisite，loadCurriculum 也不產生任何 dangling-ref（SC-007 / FR-013）", () => {
    const { loadViolations } = load("dangling-ref");
    expect(loadViolations.filter((v) => v.rule === "dangling-ref")).toHaveLength(0);
  });

  it("concepts 目錄為空 → 標記非缺目錄；validateCurriculum 報 empty-curriculum 且訊息指「無任何 Concept」", () => {
    const { graph } = load("empty");
    expect(graph.concepts.size).toBe(0);
    expect(graph.conceptsDirMissing).toBeFalsy();
    const result = validateCurriculum(graph);
    const empty = result.violations.find((v) => v.rule === "empty-curriculum");
    expect(empty).toBeDefined();
    expect(empty?.message).toMatch(/無任何 Concept|目錄為空/);
  });

  it("concepts 目錄不存在 → 標記缺目錄；validateCurriculum 報 empty-curriculum 且訊息指「目錄不存在」（U2）", () => {
    const { graph } = load("empty", "no-such-dir");
    expect(graph.concepts.size).toBe(0);
    expect(graph.conceptsDirMissing).toBe(true);
    const result = validateCurriculum(graph);
    const empty = result.violations.find((v) => v.rule === "empty-curriculum");
    expect(empty?.message).toMatch(/目錄不存在/);
  });
});
