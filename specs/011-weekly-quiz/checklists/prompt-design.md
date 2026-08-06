# Specification Quality Checklist: 題庫產線 Prompt 設計（Stage A 面向列舉 → Stage B 出題 → 交叉驗證）

**Purpose**: 驗證 spec.md（FR-013／FR-013a／FR-016）與 contracts/quiz-bank-schema.md §4–§5 對「題庫生成 prompt 設計」這一段需求的完整性、清晰度與一致性，於 `/speckit-tasks` 前先確認需求層本身沒有缺口
**Created**: 2026-08-06
**Feature**: [spec.md](../spec.md)
**Focus**: 題庫產線 Prompt 設計（面向覆蓋、防「達標即停」、防錨定效應、交叉驗證重生規則）
**Depth**: Standard
**Audience**: 作者自查（進 `/speckit-tasks` 前）

## Requirement Completeness

- [x] CHK001 是否定義了「面向」(aspect) 的判定標準，讓 Stage A 的產出可被客觀認定為「已涵蓋 Author Hints 四段每一段」？[Completeness, Spec FR-016]
  → 未定義：FR-016／§5.2 只規定「取材範圍 MUST 涵蓋」四段，但 8 條 Gate 判準（quiz-bank-schema.md §3）無一檢查 Stage A 面向清單是否逐段有覆蓋，僅實測經驗（min=8）佐證，非可執行判準。
- [x] CHK002 是否定義了 Concept 沒有 `prerequisite` 或沒有 `next` 鄰居時，面向來源如何補足以避免跌破覆蓋下界？[Gap, Edge Case, FR-016]
  → 未定義：Q13 僅記載「無鄰居時僅約 6 個面向」為實測觀察，未定義補償機制或是否仍保證合計 ≥3；與 CHK016 同一缺口。
- [x] CHK003 Gate 重生耗盡標記 `needsHumanReview` 後，該 Concept 既有已通過交叉驗證、但總數 <3 題的殘題如何處置（保留供下次續跑沿用，或整批捨棄重來）是否已定義？[Gap, FR-010a]
  → 已定義：quiz-bank-schema.md §5.2「3 次皆不過（含「驗證後仍 <3 題」）→ 標記 needsHumanReview，**不寫入該 Concept**」，即整批捨棄、不留殘題；下次續跑因 `frozen && gatePassed` 為否而從零重來（非沿用殘題）。
- [x] CHK004 SC-010（全庫題數分布 <40% 落在下限、平均 ≥5）的驗證時機與執行者是否有明確定義——是 `checkQuizBank` 自動 Gate 的一部分，還是產線批次結束後另一道獨立檢查？[Completeness, SC-010]
  → 未定義：`checkQuizBank` 的 8 條規則（quiz-bank-schema.md §3）只逐 Concept 檢查（rule 7 `quiz-count-range` 為每 Concept [3,10] 區間），無任何規則做全庫分布統計；spec 僅稱其為「可量測訊號」，未指名執行者與呼叫時機。與 CHK011、CHK020 同一缺口的三個切面。

## Requirement Clarity

- [x] CHK005 「實質等價的題目」（FR-016 品質違規判準）與 `checkQuizBank` 實際的 `quiz-duplicate` 判準「stem 逐字相同」（contracts/quiz-bank-schema.md §3 rule 8）之間的落差，是否已被說明為刻意的分工（Gate 只攔逐字重複，語意重複另靠別的機制）？[Ambiguity/Conflict, FR-016 vs quiz-bank-schema.md §3]
  → 已定義：data-model.md §1 表格明文「結構性判準只查逐字相同；『實質等價』由生成端的面向/角度設計與交叉驗證共同防範，非本檔的機械判準所能偵測，見 research R2」，為刻意分工而非遺漏。
- [x] CHK006 「重生時 MUST 換一個考核角度」（FR-013 重生規則）是否有客觀判準可供 Gate 或程式檢查，或完全仰賴生成 prompt 的敘述性指示（而 spec Q14 已實證敘述性指示不可靠）？[Clarity, FR-013]
  → 未定義：8 條 Gate 規則中無一檢查「考核角度是否真的換了」，只有 `quiz-duplicate` 攔逐字重複；Q14 已證明「敘述性要求無法穩定落實」，此條卻仍完全仰賴敘述性 prompt 指示，屬已知高風險模式的重演。
- [x] CHK007 「鄰居只能作為區辨點，MUST NOT 將其正題整體搬入」是否有可供結構性 Gate 判斷的界線，或僅能靠 prompt 措辭防範且事後不可驗證？[Measurability, FR-016]
  → 未定義：Q14 僅靠移除 prompt 中的數字上限來間接抑制此現象（實測 0/7），無任何結構性 Gate 規則（quiz-bank-schema.md §3 的 8 條皆未涉及）能在題目生成後偵測「是否搬入鄰居正題」，完全不可驗證。
- [ ] CHK008 交叉驗證「MUST NOT 與生成該題的呼叫共用同一次對話上下文」的「獨立」二字，是否已具體到可被程式碼審查客觀核驗（例如：兩次呼叫必須是各自全新的 request，不帶前一輪訊息歷史）？[Clarity, FR-013]
  → 部分定義：research.md R8 定案為獨立新模組 `quiz-cross-check.ts`、單次盲答呼叫、不沿用 self-check 的複審形狀，方向正確；但未明文「呼叫必須是全新 request、不帶歷史訊息陣列」這類可供程式碼審查逐條核對的具體判準，「獨立」仍停留在敘述層級。

## Requirement Consistency

- [x] CHK009 FR-016 條文列出的「面向取材範圍」（`learning_goal` / `exit_criteria` / Author Hints 四段 / 鄰居區辨點）與 contracts/quiz-bank-schema.md §5.2 對 Stage A 的描述，逐項是否完全一致、無遺漏或增添？[Consistency]
  → 一致：§5.2 逐字列出「learning_goal／exit_criteria／Author Hints 核心觀念/Pattern 辨識線索/Thinking/Common Mistakes／prerequisite-next 區辨點（MUST NOT 納入 TypeScript/Python 重點）」，與 FR-016 條文六項來源一一對應，無遺漏或增添。
- [x] CHK010 spec Q11／Q12 記載的實測基準（面向來源數 min=8、中位=11；`learning_goal`/`exit_criteria` 合計恆 ≤3）與 FR-016 條文本身的敘述是否互相印證，未因多輪修訂而出現數字不一致？[Consistency, Spec Clarifications]
  → 一致：FR-016 條文內的「min=8、中位=11」「{2: 80, 3: 85}、無一超過 3」與 Q11／Q12 記載的數字逐字相符，未見漂移。

## Acceptance Criteria Quality

- [x] CHK011 SC-010「佔比 <40%、平均 ≥5」是否可在題庫生成批次完成後被獨立於人工判讀、以程式客觀計算？[Measurability, SC-010]
  → 計算方式本身可行（純統計，對 `byConcept` 逐 key 算長度即可），但無任何檔案指名由誰、何時執行此計算（同 CHK004 缺口），故「已定義為可執行檢查」這件事本身尚未成立。
- [x] CHK012 「生成 prompt 中 MUST NOT 出現任何題數或面向數的數字」是否定義了可執行的驗收方式（例如對 prompt 模板字串做靜態掃描比對數字樣式），使其可被自動測試而非僅靠人工審閱 prompt 原始碼？[Measurability, FR-016]
  → 未定義：FR-016 與 quiz-bank-schema.md §5.5 都重申此 MUST NOT，但兩處都只是規範文字，未見對應的靜態掃描測試（例如對 `quiz-aspects.ts`/`quiz-items.ts` 模板字串做數字樣式比對）；目前仰賴人工審閱 prompt 原始碼。

## Scenario Coverage

- [x] CHK013 Stage A 產出面向數異常偏少（如 1～2 個，低於 spec 實測的 min=8）情境下，Stage B 與後續重生流程的行為是否已定義？[Gap, Edge Case]
  → 未定義：spec 僅陳述「實測 min=8」為現況，quiz-bank-schema.md §5.2 的流程對「面向數本身過少」沒有專門分支——會落入與其他失敗相同的「重試 3 輪後 needsHumanReview」，但這是否為刻意設計或只是未考慮到的落網情境，未見說明。
- [x] CHK014 交叉驗證呼叫本身失敗（LLM API 錯誤、逾時、回傳非結構化內容）時的重試規則是否已定義，且是否計入 per-Concept 3 輪生成上限，或屬於獨立於該上限之外的基礎設施重試？[Gap, FR-013]
  → 未定義：quiz-bank-schema.md §4／§5.2 只定義「盲答結果與標記不一致 ⇒ 丟棄重生」這條內容判準，未觸及 API 錯誤/逾時/非結構化回應等基礎設施層失敗的重試規則，也未說明是否計入 3 輪上限。
- [x] CHK015 同一批重生中若有多題同時被交叉驗證判定不通過，是「逐題個別重出」還是「整批一次重出」，是否已定義？[Ambiguity, quiz-bank-schema.md §5.2]
  → 已定義為逐題個別重出：§5.2 偽代碼以 `for item in draft.items` 逐題判定、不通過者個別「針對該題面向重出一題」，非整批重來。

## Edge Case Coverage

- [x] CHK016 Concept 為 Curriculum 的根節點（無 `prerequisite`）或葉節點（無 `next`）時，鄰居區辨點來源缺席對面向覆蓋下界的影響是否已定義（而非僅以「實測皆有鄰居」帶過）？[Edge Case, FR-016]
  → 未定義：與 CHK002 同一缺口。Q13 僅記載「無鄰居時僅約 6 個面向」的觀察值，未逐一確認 165 個 Concept 中根/葉節點是否仍全數合計 ≥3，也未定義若跌破下限時的處置。
- [x] CHK017 Author Hints 六段結構中「核心觀念／Pattern 辨識線索／Thinking／Common Mistakes」任一段為空白或內容過短時，面向來源的降級行為是否已定義？[Edge Case, Gap]
  → 未定義：Q12 僅稱「165 個 Concept 皆完整具備六段」為現況實測，spec 沒有為「某段為空白或過短」這個假設情境定義降級規則；與 CHK019 的「是否為恆定不變式」缺口相關但問題切面不同（此項關注運行期降級行為，CHK019 關注未來新增 Concept 的流程保證）。
- [x] CHK018 模型在 Stage A 意外列出語意重複的面向（換句話說的同一面向）時，是否已定義 Stage B 是否因此連帶產出 FR-016 所稱的「實質等價題目」，以及是否有對應偵測路徑？[Edge Case, FR-016]
  → 未定義：`quiz-duplicate`（quiz-bank-schema.md §3 rule 8）只查 `stem` 逐字相同，Stage A 語意重複的面向若真的導致 Stage B 出兩道換句話說的題，不會被任何結構性規則攔下，僅能仰賴交叉驗證（且交叉驗證判準是「答案是否一致」，不是「題目是否語意重複」，兩者不對應）。

## Dependencies & Assumptions

- [x] CHK019 「165 個 Concept 皆完整具備六段 Author Hints 結構」是否已明確標註為**現況實測**而非恆定不變式；未來新增 Concept 若缺段時應如何處理是否已定義？[Assumption, Spec Q12]
  → 部分定義：Q12 的措辭本身（「抽樣全部 330 條實測」「165 個 Concept 皆完整具備」）已隱含這是現況觀察而非規則保證，但 spec 沒有明文寫「此為現況、非不變式」這句免責聲明，也沒有為「未來新增 Concept 缺段」定義任何處理路徑（結構性 Gate 或降級規則皆缺）。
- [ ] CHK020 SC-010 門檻不達標時的處置流程（重新調整 prompt 設計後全庫重跑，或針對未達標子集局部處理）是否已定義？[Dependency, SC-010]
  → 部分定義：SC-010 明訂方向「MUST 視為 prompt 設計失敗並重新調整，MUST NOT 以補生成硬湊」，但未指定調整後是全庫重跑還是僅重跑未達標子集（雖然 CLI 的 `--only` 參數技術上可支援後者，spec/contract 並未把它與 SC-010 的處置流程掛勾）。

## Ambiguities & Conflicts

- [ ] CHK021 FR-016「面向數 MUST NOT 成為題數上限」與 FR-005／contracts rule 7「題數上限 10」（code-side 保險絲）之間，若某 Concept 依「覆蓋下界」自然生出 >10 題時的取捨規則（截斷依據為何、保留哪些題）是否已定義？[Conflict, FR-016 vs FR-005]
  → 未定義：Q14 只論證「10 留有 43% 餘裕、正常不會超過」，但真的超過時 `quiz-count-range`（quiz-bank-schema.md §3 rule 7）只會將整個 Concept 判為 Gate 違規（具名失敗），並無「保留哪 10 題、捨棄哪些」的截斷規則——「保險絲」實際語意是「讓產線可見的失敗」，不是「自動截斷」，但 spec 用語（FR-005「上限為保險絲」）容易被誤讀為會自動截斷，值得在 spec 明確排除截斷語意。

## Notes

本檢查表聚焦於**題庫產線的 prompt 設計層**，不重複 `requirements.md` 已驗證過的一般性規格品質項目（NEEDS CLARIFICATION、成功標準可測量性等）。多數項目標記 `[Gap]`／`[Ambiguity]`——這反映此段落是 spec 於本輪 clarify（Q8／Q11～Q14）中經過**兩次 smoke test 才修正過的高風險區域**（satisficing、錨定效應、敘述性指令不可靠），故值得在進入 `/speckit-tasks` 前多一層需求層自查，而非直接視為缺陷。

**2026-08-07 檢核**：對照 `spec.md`（Clarifications Q1～Q14、FR-001～FR-016、SC-001～SC-010）與
`contracts/quiz-bank-schema.md`、`data-model.md` 逐項覆核，**21 項中 5 項已定義（CHK003／005／009／
010／015），16 項為真缺口**，結果已附註於各項目下方（引用具體章節）。缺口可歸為四類：

1. **無結構性 Gate 對應的敘述性 MUST**（CHK006／007／012／018）：「換考核角度」「鄰居不可搬入正題」
   「prompt 不可出現數字」皆只以敘述性 prompt 指示存在，`checkQuizBank` 的 8 條規則一條都不驗證這些
   條件——而 Q14 已用 smoke test 證明「敘述性要求無法穩定落實」正是這批需求自己的結論，等於在已知
   高風險的地方仍只留敘述性防線。**建議**：至少為 CHK012（prompt 靜態掃描數字）補一則可自動化的
   contract-level 檢查；CHK006／007／018 若受限於「語意層面無法結構化偵測」，應在 FR-016 明文承認
   「僅能靠交叉驗證與 Gate 的重複判準做部分兜底，非完整防線」，避免讀者誤以為已有防護。
2. **統計層級的 SC-010 未指名執行者**（CHK004／011／020）：三項問的其實是同一個缺口的三個切面——
   SC-010 的「<40%／平均 ≥5」由誰在何時算、算完不達標時重跑範圍為何，都只停在「MUST 視為 prompt
   設計失敗並重新調整」這句方向性文字。**建議**：於 `quiz-bank-schema.md` 新增一小節指定執行者
   （例如 `scripts/generate-quiz-bank.ts` 批次末自算並印出，或獨立於 `checkQuizBank` 的批次後檢查）。
3. **鄰居缺席／Author Hints 缺段的邊界未定義**（CHK002／013／016／017／019）：目前全部基於「165 個
   Concept 現況實測皆足量」帶過，沒有為「未來新增 Concept 不滿足此現況」定義降級或補償規則。
   **建議**：明文標註為現況觀察（非不變式），並至少定義「合計面向來源 <3 時」的具名失敗規則
   （可能已隱含於 FR-010a 的「<3 題」失敗路徑，但面向數與題數是兩個不同層級，未必等價，值得明說）。
4. **上限衝突的截斷語意未排除**（CHK021）：`quiz-count-range` 判違規、不是自動截斷，但 FR-005「上限
   為保險絲」的措辭容易被誤讀成會截斷；建議加一句「MUST NOT 靜默截斷，超過上限 MUST 視為 Gate
   違規」以消除歧義（呼應 §14.5／§4-15 既有的「MUST NOT 自動截斷」原則，本處只是尚未把同一原則
   複述到題數維度）。

CHK001／008／014 為前三類的延伸，已個別附註，不再重複展開。**建議在 `/speckit-tasks` 前，至少把
第 2 類（SC-010 執行者）與第 4 類（截斷語意）寫回 spec/contract**——這兩項屬於「有明確答案、只是
沒寫下來」，成本低；第 1、3 類涉及是否要新增結構性 Gate 或接受殘留風險，需使用者決策，可留待
`/speckit-clarify` 或直接在 `/speckit-tasks` 的任務描述中註記為已知限制。

---

## 2026-08-07 結案（`/speckit-analyze` 後的 fix-findings）

上述 16 項真缺口中的 **13 項已結案**（勾選已更新），處置如下：

| 項目 | 處置 | 落地位置 |
| --- | --- | --- |
| CHK001／006／007／018 | **使用者定調：接受殘留風險，不新增結構性 Gate**——補 Gate 需將 Stage A 面向清單持久化為中繼產物，與 research R6 已定案的續跑粒度衝突，代價高於收益。改以 **spec 明文承認防線不完整**收斂（誠實勝於假裝有防護） | spec FR-016「防線完整性的已知限制」；`docs/spec.md` F11 段同步 |
| CHK002／013／016／017／019 | **已定義**：「165 個 Concept 皆具六段 Author Hints 且皆有鄰居」明訂為**現況實測而非不變式**；日後不足時，其後果 MUST 落入 **FR-010a 既有的「存活題數 <3 ⇒ 具名失敗、不入庫」路徑**，MUST NOT 另立降級規則 | spec FR-016 第二條新增項；`docs/spec.md` 同步 |
| CHK004／011 | **已定義執行者與時機**：`scripts/generate-quiz-bank.ts` 批次末自算並印出 SC-010 統計；未達標印具名警示但**不**中止 CI（與結構性 Gate 分層回報） | tasks T032 的 CHK 附註、quickstart §1.2 |
| CHK012 | **已升級為可自動測試**：對 prompt 模板字串做數字樣式靜態掃描 | tasks T036 |
| CHK014 | **已定義**：交叉驗證呼叫的基礎設施失敗（API 錯誤／逾時／429／回應無法解析）走 F7 既有節流與退避重試，**MUST NOT 計入 3 輪內容重生上限**；耗盡後才視為本輪未通過 | spec FR-013；contracts/quiz-bank-schema.md §4；tasks T032／T035 |

**仍開放的 3 項**（刻意保留，非遺漏）：

- **CHK008**（「獨立」呼叫的可核驗判準）：research R8 已定案獨立模組與單次盲答，方向明確；
  「不帶歷史訊息」屬程式碼審查可直接目視的實作細節，不再另訂契約文字。
- **CHK020**（SC-010 不達標時的重跑範圍）：方向已定（調 prompt、MUST NOT 補生成硬湊），
  但「全庫重跑 vs `--only` 子集」需視實際不達標的分布決定，留待 T039 實測時判斷。
- **CHK021**（題數 >10 的取捨）：語意已由 tasks T008／T011 釘死為「回報違規、擋下整個 Concept、
  **MUST NOT 自動截斷**」並有測試斷言；spec FR-005 的措辭未改，屬可接受的表述冗餘。
