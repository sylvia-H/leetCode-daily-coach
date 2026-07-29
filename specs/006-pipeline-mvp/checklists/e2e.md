# E2E Verifiability Requirements Quality Checklist: 端到端可驗收性

**Purpose**: 上線前 release gate——驗證「端到端串接、替身邊界、三軌驗證、零 LLM」這一組需求
**寫得夠不夠完整、明確、一致、可量測**（不是驗證測試本身是否通過）
**Created**: 2026-07-24
**Feature**: [spec.md](../spec.md) ｜ **Depth**: Release gate ｜ **Scope**: 含 F5 Compiler / Renderer 消費介面

## 替身邊界需求品質（Test Double Boundary）

- [ ] CHK001 「唯一允許的替身是對外 HTTP 呼叫邊界」是否明確到**可稽核的單一機制**（全域 `fetch`），而非抽象描述？[Clarity, Spec §FR-002 vs Contract e2e-harness §1]
- [x] CHK002 e2e 中對 `writeFileSync` 使用 **spy 佐證「存檔只發生一次」**，是否與 FR-002「唯一允許的替身是 HTTP 邊界」相容——需求是否釐清「觀測用 spy」不算替身？[Conflict, Spec §FR-002 vs Contract e2e-harness §3] — ✅ 2026-07-24 已釐清：新增 FR-002a 定義「替身＝替換行為的實作」，觀測型 spy 不列入但 MUST NOT 改寫回傳值或阻斷真實寫檔；e2e-harness §1 同步補列
- [ ] CHK003 「MAY 注入重試等待與抖動參數」是否明確界定為**非行為替身**（只消除耗時、不改變重試次數與分支）？[Clarity, Spec §FR-002, Contract e2e-harness §1]
- [ ] CHK004 SC-006「替身數僅 1」是否有可機驗的判準——掃描 `pushTrack` 字樣只能擋一個已知名稱，是否足以支撐「無其他替身」的宣稱？[Measurability, Spec §SC-006 vs Contract e2e-harness §1]
- [ ] CHK005 需求是否揭露「以全域 `fetch` 為攔截點」**隱含依賴 WebhookClient 使用 `fetch`**，若日後改用其他 HTTP 手段則攔截失效？[Assumption, Contract e2e-harness §1]
- [ ] CHK006 「MUST NOT 以本機假伺服器取代」的理由是否已在需求層留存（憲章 XVI 無本機 infra），避免日後被當作可協商的實作偏好？[Traceability, Spec §Clarifications, Constitution §XVI]

## 覆蓋範圍需求完整性（Coverage Completeness）

- [ ] CHK007 FR-002 要求覆蓋「三 Track 同時啟用」，SC-006 另要求覆蓋「跳過／成功／完課／失敗四種結局與預覽模式」——兩者的覆蓋定義是否一致且互相涵蓋？[Consistency, Spec §FR-002 vs §SC-006]
- [ ] CHK008 需求是否指明 e2e 應覆蓋**代表性切片而非全量 39 筆 Lesson**，以及全量編譯的責任歸屬（F5 content-gate）？[Traceability, plan.md §Scale/Scope vs Spec §FR-001]
- [ ] CHK009 SC-006「`main` 流程的分支覆蓋無遺漏路徑」是否可客觀判定（是否有覆蓋率門檻或路徑清單），還是主觀宣稱？[Measurability, Spec §SC-006]
- [ ] CHK010 既有 `tests/unit/run-tracks.test.ts` 的定位（MAY 保留、MUST NOT 作為 AC2/AC5/AC10 唯一證據、SHOULD 刪除重疊案例）是否有**判定「重疊且無額外分支價值」的準則**？[Clarity, Contract e2e-harness §4]
- [ ] CHK011 e2e 是否被要求納入 **CI 的阻擋性檢查**（PR 不通過即不可合併），還是僅作為本地驗證？[Gap, Spec §FR-002]

## 素材與資料前提（Fixtures & Assumptions）

- [ ] CHK012 「使用 repo 內真實素材而非 fixture 目錄」是否連帶定義了**素材更新（F7 內容進來）時 e2e 的維護契約**？[Gap, Contract e2e-harness §1, Spec §Assumptions]
- [ ] CHK013 FR-004 的「至少一個橫跨多軌的 Concept」是否有**素材前提失效時的處置**（若日後無任何 Concept 三軌共用，此驗證如何成立）？[Assumption, Spec §FR-004]
- [ ] CHK014 「索引動態查得、不硬編」是否已升格為需求（避免測試綁死 `prefix-sum` / sessionIndex 9），還是僅存在於契約？[Gap, Contract e2e-harness §3 vs Spec §FR-004]
- [x] CHK015 US1-2 的驗收情境使用三軌 `currentSessionIndex` = **3 / 5 / 8**，e2e 契約使用 **3 / 5 / 7**——此差異是否為有意（造出三種版面）且已對齊？[Conflict, Spec §US1-2 vs Contract e2e-harness §3] — ✅ 2026-07-24 已統一為 **3 / 5 / 8**（practice / challenge / concept）：e2e-harness §3、research.md R7 與決策表同步修訂；rest / review 版面覆蓋歸 F5 既有測試與 content-gate 全量編譯
- [ ] CHK016 三軌 seed 課表各 13 課的假設，是否使「`currentSessionIndex` = 8」等測試前提**永遠落在課表範圍內**可被驗證？[Assumption, Spec §Assumptions]

## 零 LLM 需求明確性（Zero-LLM Requirements）

- [ ] CHK017 FR-005「完全沒有任何 LLM API key」中的「任何」是否有**明確的金鑰名稱清單**（僅 `GEMINI_API_KEY`？含未來其他供應商？）？[Clarity, Spec §FR-005, Constitution §VIII]
- [ ] CHK018 SC-005「`daily.yml` 中 LLM 金鑰出現次數為 0」是否定義了掃描的**目標字串集合**，使其可自動化且不會漏判？[Measurability, Spec §SC-005]
- [ ] CHK019 「不存在任何對 LLM 服務的呼叫」（US1-5）是否有可驗證的判準（例如攔截的請求目標主機集合），還是僅為宣稱？[Measurability, Spec §US1-5]
- [ ] CHK020 憲章 VIII 的「`src/` MUST NOT import `@google/genai`」是否在本 Feature 的需求中有對應的驗證要求，或明確歸屬於既有 Gate？[Traceability, Constitution §VIII, Spec §FR-005]

## 斷言與結果可量測性（Assertion Quality）

- [ ] CHK021 FR-003「訊息只送往自己 Track 的頻道」是否定義了斷言依據（被攔截請求的目標 URL 與 Track 的對應關係）？[Measurability, Spec §FR-003]
- [ ] CHK022 SC-001「三個頻道各收到恰好一則（或該課應有的多則）」中的「該課應有的多則」是否可由需求推導出**期望則數**，還是需回頭讀實作？[Ambiguity, Spec §SC-001]
- [ ] CHK023 SC-007「教學正文逐字相同」是否明確定義比對範圍（Digest / Tips / Takeaway / Exit Criteria 四段），且排除了 footer 等含 Track 名稱的欄位？[Clarity, Spec §SC-007 vs §US1-4]
- [ ] CHK024 「題目難度帶依 Track 不同」是否可客觀判定（比對難度欄位值），還是需人工判讀？[Measurability, Spec §FR-004]
- [ ] CHK025 「多則訊息依序送出」的順序性要求是否已在需求層表述，還是僅為 fetch-recorder 的實作能力？[Gap, Contract e2e-harness §2]
- [ ] CHK026 預算超限「MUST NOT 截斷內容送出」的驗證是否有對應的可觀測結果定義（零請求 + 該軌失敗）？[Measurability, Spec §Edge Cases]

## 需求一致性與非功能面（Consistency & NFR）

- [ ] CHK027 FR-001「MUST NOT 保留任何僅存在於測試替身中的路徑」是否可客觀稽核，還是屬無法驗證的絕對式敘述？[Ambiguity, Spec §FR-001]
- [ ] CHK028 憲章 IX「Gate 與 runtime 共用同一顆 Compiler」是否在需求中轉譯為可稽核的約束（e2e 必須 import runtime 使用的同一組函式）？[Traceability, Constitution §IX, plan.md §Constitution Check]
- [ ] CHK029 e2e 的執行時間是否有需求層限制（避免拖慢 CI 而牴觸 SC-009 的精神），或已明確排除？[Gap, Spec §SC-009]
- [ ] CHK030 e2e 使用暫存目錄真實檔案的**清理要求**（不殘留、不污染 repo）是否已定義？[Gap, Contract e2e-harness §1]
- [ ] CHK031 本 Feature「MUST NOT 另建第二套解析或渲染路徑」的 Out of Scope 宣告，是否可透過變更檔案清單客觀稽核？[Measurability, Spec §Out of Scope]

## Notes

- 勾選規則：`[x]` 表示該項需求敘述**已確認完整/明確/一致**；若發現缺口，請直接修訂 [spec.md](../spec.md) 或對應契約後再勾選。
- 高風險優先項：CHK002（spy 是否違反單一替身條款）、CHK015（3/5/8 與 3/5/7 不一致）、CHK017（「任何 LLM 金鑰」未定義清單）、CHK012（素材更新後 e2e 的維護契約）。
