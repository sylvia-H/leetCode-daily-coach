# Specification Quality Checklist: Weekly Quiz — 每週自評測驗

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-06
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

本 Feature 相比原 F10 互動化規格明顯精簡——它 MUST NOT 引入新服務商或互動端點，只在既有 Discord spoiler 上掛題組。決策均已落地：

- 題數：預設 3 題，plan 階段用 Gate 實測調整。
- 序數輪替：直接沿用 F8 既有規則，MUST NOT 發明新機制。
- 緩失敗：題庫缺席或損毀時省略小測段，MUST NOT 使 review 推播失敗。
- 零新 infra：spoiler 語法 Discord 原生支援，無需 bot 互動。

所有待釘死項都已標記為 plan/implement 階段（主要是字元預算實測、題庫規模推估）。

**2026-08-06 複驗**：重跑品質驗證，13 項全數通過。補齊與 F8/F9 spec 一致的版型（`*(mandatory)*` 標記、
`### Measurable Outcomes` 子標題）。FR-001／FR-009 出現 `data/quiz-bank.json` 與 Renderer 等名稱，
屬本專案 spec 既有的**資料契約用語**（對照 F8 spec 的 `data/reflection-bank.json`），非實作細節外洩。

**2026-08-06 `/speckit-clarify` 後複驗**：13 項維持全數通過（13/13 → 13/13，無新增未勾選、無回歸）。
本輪 5 問全數獲答並整合，規格經歷一次**設計轉向**——由「每週挑 3 題全放 Discord」改為
「Discord 每 Concept 1 題 + Pages 完整題庫頁」。連帶改寫：

- 解掉一組**規格內部矛盾**：原 FR-003（序數輪替）與 FR-005（恆取前 3 題）數學上互斥，且 FR-005 借用的
  「難度 + 題號」排序鍵在自製選擇題上不存在（quiz 題無題號）。兩者皆已重寫。
- 糾正一項**違憲提案**：使用者原提「隨機挑 1 題」，違反憲章 XI（Renderer 純函式）與 SC-002
  （byte-identical）；已改為 `(localOrder + trackOffset) mod 該 Concept 題數`。
- **追加兩項（Q8 / Q9）**：FR-016 防制產線「達標即停」（生成 prompt MUST NOT 陳述下限 3，改採
  「先列舉面向、每面向出 1 題」兩階段），配 SC-010 為可量測訊號；FR-003a 釐清索引由 Compiler runtime
  現算、不固化進課表，並說明其與 §15「MUST NOT 於 runtime 即時選題」分屬素材與 LeetCode 題兩條路徑。
- **追加（Q10）**：補上兩道 Gate 的**執行順序**（FR-013a）——題數檢查 MUST 是最後一道、作用於交叉驗證
  後的存活集合。原規格未定順序，會讓「生成恰 3 題 → 題數合格 → 驗證棄 1 題 → 入庫 2 題」靜默通過並使
  SC-003 失效。同時定案重生上限（3 輪）、重生題須再驗、以及耗盡後仍 <3 題的處置（FR-010a：具名失敗 +
  非零 exit，不以不足量入庫）。
- **追加（Q11）**：修正 FR-016 的致命缺陷。實測全 165 個 Concept，`learning_goal` 恆為 1 條、
  `exit_criteria` 為 1～2 條，合計分布 `{2: 80, 3: 85}` 且無一超過 3——原文「每面向 1 題」且取材僅限
  這兩欄，會使 48% 的 Concept 只生 2 題而當場觸發 FR-010a、其餘 52% 零餘裕。已改為 (a) 取材 MUST 涵蓋
  Author Hints 每一條與 prerequisite/next 鄰居區辨點（納入後合計 <3 者為 0 個）、(b) 面向為覆蓋下界
  而非題數上限，同面向可從不同考核角度出多題。Gate 重複判準改為「實質等價的題目」。
- **追加（Q12）**：面向來源排除 Author Hints 的 `TypeScript 重點` / `Python 重點`，並禁止出考核語言
  API 用法的題目。抽樣全部 330 條，絕大多數為寫法建議而非觀念（且相當比例為英文，違反 §11）。
  排除代價為零：面向來源數僅由 min=10 降為 min=8，無 Concept 因此跌破下限。同時發現 Author Hints
  為固定六段結構，故取材來源改為點名四段（核心觀念 / Pattern 辨識線索 / Thinking / Common Mistakes）
  而非泛稱「每一條」。
- **追加（Q13，smoke test 實證）**：以真實 Gemini 呼叫跑通 Stage A → Stage B → 盲答驗證。三項修正：
  (1) 確認 Q11 的鄰居區辨修法有效——最低配 Concept 產出 10 個面向且鄰居題教學價值最高；
  (2) `quizItem` 由 350 放寬為 450、`quiz` 由 2,500 放寬為 3,000（真實產出最長 399、平均 342，
  原上限使 6/10 超標）；(3) 新增 `options` MUST NOT 內含代號前綴（模型自帶前綴，與 Renderer 疊加後
  輸出 `A. A. …`）。全庫規模預估上修為 1,300～1,650 題、產線約 3,500 次呼叫。
  盲答一致率 10/10 **未**被採認為正確性證據（同模型家族的相關性限制，FR-013 已載明）。
- **追加（Q14，第二次 smoke test）**：實測推翻本 spec 自己寫的條文——原 FR-016 允許上限以「截斷點」
  形式進 prompt，而對照實驗顯示 **prompt 中出現上限即被當成目標**（寫「最多 10 個」→ 恰好 10 個且
  第 10 個越界；移除後自然 6 個面向 / 7 題）。另**獨立**觀察到：以逐字相同的敘述性指令跑兩次，
  `explanation` 一次全部 2 段、一次全部 5 段——敘述性要求無法穩定落實（此差異**未**歸因於題數配額，
  兩次多個變因同動且各僅一個樣本）。三處修正：FR-016 禁止 prompt 出現任何數量、新增「鄰居只能作為
  區辨點」、FR-006 改為明訂 `explanation` 恰 5 段並由 Gate 檢查。數值更正為單題最長 362、全庫 1,000～1,300 題、
  產線約 2,500 次呼叫；題數上限維持 10（自然值 7，留 43% 餘裕）。
- **追加（2026-08-07，`/speckit-analyze` 後的修訂）**：上列 Q13／Q14 的預算數字**已再次更正**——
  該批量測未含 spoiler 內的 Pages 連結（最壞 111 字元），故 `quizItem` 由 450 提為 **570**
  （內容 450 + 連結保留 120）、`QUIZ_URL_RESERVE_CHARS` 由 90 提為 **120**；沿用舊值會使素材層 Gate
  **寬鬆於** runtime（違反憲章 IX）。同時回寫 FR-011 漏落地的「僅 `unlockedIds`」範圍（research R7），
  並更正 `localOrder` 的定義（實為 Skeleton 檔名 `NNN-` 前綴，1-based，非「Topic 內 0-based 序位」）。
  **本節其餘數字為當時的歷史記錄，以 spec 現行條文為準。**
- FR 由 10 條擴為 19 條（含 FR-003a / FR-010a / FR-013a）、SC 由 6 條擴為 10 條；新增 F9 依賴（單向可降級）。
- 全部數字均為**實測**而非估算（三軌 111 個 review Session 編譯 + render + `checkBudget`）。

跨 Feature 決策已依 CLAUDE.md 落回 `docs/spec.md`：§22.5 表格列與 F11 明細段、§14.5 預算表新增
`quizItem` / `quiz` 兩格、§15 新增 Quiz 段規則。

仍留給 `/speckit-plan` 的項目（皆為實作層，非規格空缺）：題庫生成腳本的歸屬（新 script 或併入
`generate-materials.ts`）、Pages quiz 頁的導覽入口設計、二次作答交叉驗證的 prompt 與重試上限。
