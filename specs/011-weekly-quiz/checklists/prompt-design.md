# Specification Quality Checklist: 題庫產線 Prompt 設計（Stage A 面向列舉 → Stage B 出題 → 交叉驗證）

**Purpose**: 驗證 spec.md（FR-013／FR-013a／FR-016）與 contracts/quiz-bank-schema.md §4–§5 對「題庫生成 prompt 設計」這一段需求的完整性、清晰度與一致性，於 `/speckit-tasks` 前先確認需求層本身沒有缺口
**Created**: 2026-08-06
**Feature**: [spec.md](../spec.md)
**Focus**: 題庫產線 Prompt 設計（面向覆蓋、防「達標即停」、防錨定效應、交叉驗證重生規則）
**Depth**: Standard
**Audience**: 作者自查（進 `/speckit-tasks` 前）

## Requirement Completeness

- [ ] CHK001 是否定義了「面向」(aspect) 的判定標準，讓 Stage A 的產出可被客觀認定為「已涵蓋 Author Hints 四段每一段」？[Completeness, Spec FR-016]
- [ ] CHK002 是否定義了 Concept 沒有 `prerequisite` 或沒有 `next` 鄰居時，面向來源如何補足以避免跌破覆蓋下界？[Gap, Edge Case, FR-016]
- [ ] CHK003 Gate 重生耗盡標記 `needsHumanReview` 後，該 Concept 既有已通過交叉驗證、但總數 <3 題的殘題如何處置（保留供下次續跑沿用，或整批捨棄重來）是否已定義？[Gap, FR-010a]
- [ ] CHK004 SC-010（全庫題數分布 <40% 落在下限、平均 ≥5）的驗證時機與執行者是否有明確定義——是 `checkQuizBank` 自動 Gate 的一部分，還是產線批次結束後另一道獨立檢查？[Completeness, SC-010]

## Requirement Clarity

- [ ] CHK005 「實質等價的題目」（FR-016 品質違規判準）與 `checkQuizBank` 實際的 `quiz-duplicate` 判準「stem 逐字相同」（contracts/quiz-bank-schema.md §3 rule 8）之間的落差，是否已被說明為刻意的分工（Gate 只攔逐字重複，語意重複另靠別的機制）？[Ambiguity/Conflict, FR-016 vs quiz-bank-schema.md §3]
- [ ] CHK006 「重生時 MUST 換一個考核角度」（FR-013 重生規則）是否有客觀判準可供 Gate 或程式檢查，或完全仰賴生成 prompt 的敘述性指示（而 spec Q14 已實證敘述性指示不可靠）？[Clarity, FR-013]
- [ ] CHK007 「鄰居只能作為區辨點，MUST NOT 將其正題整體搬入」是否有可供結構性 Gate 判斷的界線，或僅能靠 prompt 措辭防範且事後不可驗證？[Measurability, FR-016]
- [ ] CHK008 交叉驗證「MUST NOT 與生成該題的呼叫共用同一次對話上下文」的「獨立」二字，是否已具體到可被程式碼審查客觀核驗（例如：兩次呼叫必須是各自全新的 request，不帶前一輪訊息歷史）？[Clarity, FR-013]

## Requirement Consistency

- [ ] CHK009 FR-016 條文列出的「面向取材範圍」（`learning_goal` / `exit_criteria` / Author Hints 四段 / 鄰居區辨點）與 contracts/quiz-bank-schema.md §5.2 對 Stage A 的描述，逐項是否完全一致、無遺漏或增添？[Consistency]
- [ ] CHK010 spec Q11／Q12 記載的實測基準（面向來源數 min=8、中位=11；`learning_goal`/`exit_criteria` 合計恆 ≤3）與 FR-016 條文本身的敘述是否互相印證，未因多輪修訂而出現數字不一致？[Consistency, Spec Clarifications]

## Acceptance Criteria Quality

- [ ] CHK011 SC-010「佔比 <40%、平均 ≥5」是否可在題庫生成批次完成後被獨立於人工判讀、以程式客觀計算？[Measurability, SC-010]
- [ ] CHK012 「生成 prompt 中 MUST NOT 出現任何題數或面向數的數字」是否定義了可執行的驗收方式（例如對 prompt 模板字串做靜態掃描比對數字樣式），使其可被自動測試而非僅靠人工審閱 prompt 原始碼？[Measurability, FR-016]

## Scenario Coverage

- [ ] CHK013 Stage A 產出面向數異常偏少（如 1～2 個，低於 spec 實測的 min=8）情境下，Stage B 與後續重生流程的行為是否已定義？[Gap, Edge Case]
- [ ] CHK014 交叉驗證呼叫本身失敗（LLM API 錯誤、逾時、回傳非結構化內容）時的重試規則是否已定義，且是否計入 per-Concept 3 輪生成上限，或屬於獨立於該上限之外的基礎設施重試？[Gap, FR-013]
- [ ] CHK015 同一批重生中若有多題同時被交叉驗證判定不通過，是「逐題個別重出」還是「整批一次重出」，是否已定義？[Ambiguity, quiz-bank-schema.md §5.2]

## Edge Case Coverage

- [ ] CHK016 Concept 為 Curriculum 的根節點（無 `prerequisite`）或葉節點（無 `next`）時，鄰居區辨點來源缺席對面向覆蓋下界的影響是否已定義（而非僅以「實測皆有鄰居」帶過）？[Edge Case, FR-016]
- [ ] CHK017 Author Hints 六段結構中「核心觀念／Pattern 辨識線索／Thinking／Common Mistakes」任一段為空白或內容過短時，面向來源的降級行為是否已定義？[Edge Case, Gap]
- [ ] CHK018 模型在 Stage A 意外列出語意重複的面向（換句話說的同一面向）時，是否已定義 Stage B 是否因此連帶產出 FR-016 所稱的「實質等價題目」，以及是否有對應偵測路徑？[Edge Case, FR-016]

## Dependencies & Assumptions

- [ ] CHK019 「165 個 Concept 皆完整具備六段 Author Hints 結構」是否已明確標註為**現況實測**而非恆定不變式；未來新增 Concept 若缺段時應如何處理是否已定義？[Assumption, Spec Q12]
- [ ] CHK020 SC-010 門檻不達標時的處置流程（重新調整 prompt 設計後全庫重跑，或針對未達標子集局部處理）是否已定義？[Dependency, SC-010]

## Ambiguities & Conflicts

- [ ] CHK021 FR-016「面向數 MUST NOT 成為題數上限」與 FR-005／contracts rule 7「題數上限 10」（code-side 保險絲）之間，若某 Concept 依「覆蓋下界」自然生出 >10 題時的取捨規則（截斷依據為何、保留哪些題）是否已定義？[Conflict, FR-016 vs FR-005]

## Notes

本檢查表聚焦於**題庫產線的 prompt 設計層**，不重複 `requirements.md` 已驗證過的一般性規格品質項目（NEEDS CLARIFICATION、成功標準可測量性等）。多數項目標記 `[Gap]`／`[Ambiguity]`——這反映此段落是 spec 於本輪 clarify（Q8／Q11～Q14）中經過**兩次 smoke test 才修正過的高風險區域**（satisficing、錨定效應、敘述性指令不可靠），故值得在進入 `/speckit-tasks` 前多一層需求層自查，而非直接視為缺陷。
