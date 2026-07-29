# E2E Verifiability Requirements Quality Checklist: 端到端可驗收性

**Purpose**: 上線前 release gate——驗證「端到端串接、替身邊界、三軌驗證、零 LLM」這一組需求
**寫得夠不夠完整、明確、一致、可量測**（不是驗證測試本身是否通過）
**Created**: 2026-07-24
**Feature**: [spec.md](../spec.md) ｜ **Depth**: Release gate ｜ **Scope**: 含 F5 Compiler / Renderer 消費介面

## 替身邊界需求品質（Test Double Boundary）

- [x] CHK001 「唯一允許的替身是對外 HTTP 呼叫邊界」是否明確到**可稽核的單一機制**（全域 `fetch`），而非抽象描述？[Clarity, Spec §FR-002 vs Contract e2e-harness §1] — ✅ 2026-07-29 已補：新增 FR-002b——攔截點 MUST 為單一且可稽核的機制（攔截執行環境的全域 HTTP 送出函式），使「替身數為 1」可由「僅此一處被替換」直接判定
- [x] CHK002 e2e 中對 `writeFileSync` 使用 **spy 佐證「存檔只發生一次」**，是否與 FR-002「唯一允許的替身是 HTTP 邊界」相容——需求是否釐清「觀測用 spy」不算替身？[Conflict, Spec §FR-002 vs Contract e2e-harness §3] — ✅ 2026-07-24 已釐清：新增 FR-002a 定義「替身＝替換行為的實作」，觀測型 spy 不列入但 MUST NOT 改寫回傳值或阻斷真實寫檔；e2e-harness §1 同步補列
- [x] CHK003 「MAY 注入重試等待與抖動參數」是否明確界定為**非行為替身**（只消除耗時、不改變重試次數與分支）？[Clarity, Spec §FR-002, Contract e2e-harness §1] — ✅ 2026-07-29 已補：FR-002a 新增子項——注入不列入替身，但 MUST 嚴格限於消除測試耗時，MUST NOT 改變重試次數、錯誤分類或任何分支判斷
- [x] CHK004 SC-006「替身數僅 1」是否有可機驗的判準——掃描 `pushTrack` 字樣只能擋一個已知名稱，是否足以支撐「無其他替身」的宣稱？[Measurability, Spec §SC-006 vs Contract e2e-harness §1] — ✅ 2026-07-29 已補：SC-006 明訂判準為「掃描端到端原始碼不含推播注入點名稱」作為**機驗下限**，並以人工 review 確認無其他替換；**明確承認**字樣掃描只能擋已知名稱的侷限
- [x] CHK005 需求是否揭露「以全域 `fetch` 為攔截點」**隱含依賴 WebhookClient 使用 `fetch`**，若日後改用其他 HTTP 手段則攔截失效？[Assumption, Contract e2e-harness §1] — ✅ 2026-07-29 已補：FR-002b 明列「已知的隱含依賴 MUST 揭露」，Assumptions 亦新增對應條目——日後變更 HTTP 送出方式時 MUST 一併檢視驗證是否仍有效
- [x] CHK006 「MUST NOT 以本機假伺服器取代」的理由是否已在需求層留存（憲章 XVI 無本機 infra），避免日後被當作可協商的實作偏好？[Traceability, Spec §Clarifications, Constitution §XVI] — ✅ 2026-07-29 已補：FR-002b 明載理由為憲章第 XVI 條的「無本機 infra」（開 port 帶來 CI 不穩定與環境相依），屬原則性約束而非可協商的實作偏好

## 覆蓋範圍需求完整性（Coverage Completeness）

- [x] CHK007 FR-002 要求覆蓋「三 Track 同時啟用」，SC-006 另要求覆蓋「跳過／成功／完課／失敗四種結局與預覽模式」——兩者的覆蓋定義是否一致且互相涵蓋？[Consistency, Spec §FR-002 vs §SC-006] — ✅ 2026-07-29 已釐清：SC-006 標題補上「覆蓋定義與 FR-002 一致」——FR-002 規定**最小情境**（三軌同時啟用），SC-006 規定**完整度**（結局路徑逐條覆蓋），兩者互補不重疊
- [x] CHK008 需求是否指明 e2e 應覆蓋**代表性切片而非全量 39 筆 Lesson**，以及全量編譯的責任歸屬（F5 content-gate）？[Traceability, plan.md §Scale/Scope vs Spec §FR-001] — ✅ 2026-07-29 已補：SC-006 新增「覆蓋的責任邊界」——端到端覆蓋代表性切片（三軌各一課 + 各結局路徑），全量課表逐課編譯屬 F5 內容 Gate，MUST NOT 在本 Feature 重複執行
- [x] CHK009 SC-006「`main` 流程的分支覆蓋無遺漏路徑」是否可客觀判定（是否有覆蓋率門檻或路徑清單），還是主觀宣稱？[Measurability, Spec §SC-006] — ✅ 2026-07-29 已修：SC-006 改為**明列 8 條結局路徑逐條對照**（未覆蓋數為 0），清單與對應檔案見 e2e-harness §3.1，並附「新增結局路徑時 MUST 同步擴充該表」的維護契約
- [x] CHK010 既有 `tests/unit/run-tracks.test.ts` 的定位（MAY 保留、MUST NOT 作為 AC2/AC5/AC10 唯一證據、SHOULD 刪除重疊案例）是否有**判定「重疊且無額外分支價值」的準則**？[Clarity, Contract e2e-harness §4] — ✅ 2026-07-29 已明確：判準即 FR-001 ②「保留的每個替身案例 MUST 註明其『無法由對外 HTTP 攔截觸發』的分支理由」——**無法註明理由者即為重疊且無額外價值，MUST 刪除**（e2e-harness §4 同列）
- [x] CHK011 e2e 是否被要求納入 **CI 的阻擋性檢查**（PR 不通過即不可合併），還是僅作為本地驗證？[Gap, Spec §FR-002] — ✅ 2026-07-29 已補：新增 FR-002c——端到端驗證 MUST 納入 CI 的阻擋性檢查（與既有測試同一道指令執行，未通過即不得合併）

## 素材與資料前提（Fixtures & Assumptions）

- [x] CHK012 「使用 repo 內真實素材而非 fixture 目錄」是否連帶定義了**素材更新（F7 內容進來）時 e2e 的維護契約**？[Gap, Contract e2e-harness §1, Spec §Assumptions] — ✅ 2026-07-29 已補：Assumptions 新增「素材更新後的驗證維護契約」——一切與素材有關的取值 MUST 動態查得，故素材更新不應造成失敗；若仍失敗 MUST 視為真實問題並修正，MUST NOT 放寬斷言或刪除案例
- [x] CHK013 FR-004 的「至少一個橫跨多軌的 Concept」是否有**素材前提失效時的處置**（若日後無任何 Concept 三軌共用，此驗證如何成立）？[Assumption, Spec §FR-004] — ✅ 2026-07-29 已補：FR-004 新增「素材前提失效時的處置」——MUST 改為修正素材或調整選取條件，MUST NOT 放寬或刪除斷言
- [x] CHK014 「索引動態查得、不硬編」是否已升格為需求（避免測試綁死 `prefix-sum` / sessionIndex 9），還是僅存在於契約？[Gap, Contract e2e-harness §3 vs Spec §FR-004] — ✅ 2026-07-29 已升格：FR-004 明訂「Session 索引 MUST 由素材動態查得，MUST NOT 硬編進驗證」，並註明此為需求層要求而非實作偏好（素材由 F7 重生成後索引必然改變）
- [x] CHK015 US1-2 的驗收情境使用三軌 `currentSessionIndex` = **3 / 5 / 8**，e2e 契約使用 **3 / 5 / 7**——此差異是否為有意（造出三種版面）且已對齊？[Conflict, Spec §US1-2 vs Contract e2e-harness §3] — ✅ 2026-07-24 已統一為 **3 / 5 / 8**（practice / challenge / concept）：e2e-harness §3、research.md R7 與決策表同步修訂；rest / review 版面覆蓋歸 F5 既有測試與 content-gate 全量編譯
- [x] CHK016 三軌 seed 課表各 13 課的假設，是否使「`currentSessionIndex` = 8」等測試前提**永遠落在課表範圍內**可被驗證？[Assumption, Spec §Assumptions] — ✅ 2026-07-29 已補：Assumptions 該條新增「此假設同時使 3 / 5 / 8 必然落在課表範圍內；素材縮短至 8 課以下時本前提即失效，屆時 MUST 調整前提值而非放寬斷言」

## 零 LLM 需求明確性（Zero-LLM Requirements）

- [x] CHK017 FR-005「完全沒有任何 LLM API key」中的「任何」是否有**明確的金鑰名稱清單**（僅 `GEMINI_API_KEY`？含未來其他供應商？）？[Clarity, Spec §FR-005, Constitution §VIII] — ✅ 2026-07-29 已補：FR-005 明列現行唯一金鑰 `GEMINI_API_KEY`，並要求掃描涵蓋供應商識別字樣（`GEMINI` / `GOOGLE_API_KEY` / `OPENAI` / `ANTHROPIC` / `API_KEY` 形態），日後新增供應商時 MUST 同步擴充
- [x] CHK018 SC-005「`daily.yml` 中 LLM 金鑰出現次數為 0」是否定義了掃描的**目標字串集合**，使其可自動化且不會漏判？[Measurability, Spec §SC-005] — ✅ 2026-07-29 已補：SC-005 明確引用 FR-005 的字串集合作為掃描目標，使本項可自動化且不致漏判
- [x] CHK019 「不存在任何對 LLM 服務的呼叫」（US1-5）是否有可驗證的判準（例如攔截的請求目標主機集合），還是僅為宣稱？[Measurability, Spec §US1-5] — ✅ 2026-07-29 已補：FR-005 新增機驗判準——端到端驗證中**被攔截請求的目標主機集合 MUST 只含 Discord 的 webhook 網域**，出現其他主機即為違反
- [x] CHK020 憲章 VIII 的「`src/` MUST NOT import `@google/genai`」是否在本 Feature 的需求中有對應的驗證要求，或明確歸屬於既有 Gate？[Traceability, Constitution §VIII, Spec §FR-005] — ✅ 2026-07-29 已明確歸屬：FR-005 明訂該項由**既有的 CI Gate** 負責，本 Feature MUST NOT 重複實作，但 MUST 於驗收時確認該 Gate 仍在 CI 中生效

## 斷言與結果可量測性（Assertion Quality）

- [x] CHK021 FR-003「訊息只送往自己 Track 的頻道」是否定義了斷言依據（被攔截請求的目標 URL 與 Track 的對應關係）？[Measurability, Spec §FR-003] — ✅ 2026-07-29 已補：FR-003 明訂斷言依據為「被攔截請求的目標位址」與「該 Track 的 webhook 設定值」的對應關係（逐請求比對，非抽樣）
- [x] CHK022 SC-001「三個頻道各收到恰好一則（或該課應有的多則）」中的「該課應有的多則」是否可由需求推導出**期望則數**，還是需回頭讀實作？[Ambiguity, Spec §SC-001] — ✅ 2026-07-29 已補：SC-001 明訂判準為「渲染該課所產出的訊息則數」（每則渲染產物恰對應一次送出，比值 1:1），MUST NOT 需要回讀實作才能推導期望值
- [x] CHK023 SC-007「教學正文逐字相同」是否明確定義比對範圍（Digest / Tips / Takeaway / Exit Criteria 四段），且排除了 footer 等含 Track 名稱的欄位？[Clarity, Spec §SC-007 vs §US1-4] — ✅ 2026-07-29 已補：SC-007 與 FR-004 同步明列比對範圍為 **Digest / TypeScript Tip / Python Tip / Takeaway / Exit Criteria**，並**明確排除**含 Track 名稱或進度資訊的頁尾與標題（否則斷言恆偽）
- [x] CHK024 「題目難度帶依 Track 不同」是否可客觀判定（比對難度欄位值），還是需人工判讀？[Measurability, Spec §FR-004] — ✅ 2026-07-29 已補：FR-004 / SC-007 明訂以**題目難度欄位的值**客觀比對，MUST NOT 依賴人工判讀
- [x] CHK025 「多則訊息依序送出」的順序性要求是否已在需求層表述，還是僅為 fetch-recorder 的實作能力？[Gap, Contract e2e-harness §2] — ✅ 2026-07-29 已升格：FR-003 新增子項——送出順序 MUST 與渲染產出順序一致，且此順序性 MUST 為需求層要求（攔截機制 MUST 依呼叫順序記錄），MUST NOT 只是攔截工具剛好具備的能力
- [x] CHK026 預算超限「MUST NOT 截斷內容送出」的驗證是否有對應的可觀測結果定義（零請求 + 該軌失敗）？[Measurability, Spec §Edge Cases] — ✅ 2026-07-29 已補：Edge Cases 該條新增可觀測結果——該軌**課程訊息送出次數為 0**（只有紅色告警一則）、該軌計為失敗、進度不變

## 需求一致性與非功能面（Consistency & NFR）

- [x] CHK027 FR-001「MUST NOT 保留任何僅存在於測試替身中的路徑」是否可客觀稽核，還是屬無法驗證的絕對式敘述？[Ambiguity, Spec §FR-001] — ✅ 2026-07-29 已修：FR-001 補上兩項可稽核條件——①端到端原始碼 MUST NOT 出現推播替身（以掃描測試守住）；②既有替身測試的每個保留案例 MUST 註明「無法由對外 HTTP 攔截觸發」的分支理由，無理由者 MUST 刪除
- [x] CHK028 憲章 IX「Gate 與 runtime 共用同一顆 Compiler」是否在需求中轉譯為可稽核的約束（e2e 必須 import runtime 使用的同一組函式）？[Traceability, Constitution §IX, plan.md §Constitution Check] — ✅ 2026-07-29 已補：新增 FR-002d——端到端驗證 MUST 直接使用每日 runtime 所用的同一組編譯／渲染／預算檢查實作，MUST NOT 為測試另建平行路徑
- [x] CHK029 e2e 的執行時間是否有需求層限制（避免拖慢 CI 而牴觸 SC-009 的精神），或已明確排除？[Gap, Spec §SC-009] — ✅ 2026-07-29 已明確：FR-002c 訂為「以消除真實等待的方式維持在既有測試指令可接受的時間內」，**明確不另設獨立耗時門檻**，但 MUST NOT 引入真實網路等待或固定睡眠
- [x] CHK030 e2e 使用暫存目錄真實檔案的**清理要求**（不殘留、不污染 repo）是否已定義？[Gap, Contract e2e-harness §1] — ✅ 2026-07-29 已補：FR-002c 新增「暫存資源清理」——MUST 建立於執行環境暫存區，MUST NOT 寫入 repo 工作目錄、MUST NOT 殘留而汙染後續執行
- [x] CHK031 本 Feature「MUST NOT 另建第二套解析或渲染路徑」的 Out of Scope 宣告，是否可透過變更檔案清單客觀稽核？[Measurability, Spec §Out of Scope] — ✅ 2026-07-29 已補：Out of Scope 補上可稽核判準——本 Feature 的變更檔案清單 MUST NOT 出現 F5 的版面與解析實作檔案，出現即視為越界

## Notes

- 勾選規則：`[x]` 表示該項需求敘述**已確認完整/明確/一致**；若發現缺口，請直接修訂 [spec.md](../spec.md) 或對應契約後再勾選。
- 高風險優先項：CHK002（spy 是否違反單一替身條款）、CHK015（3/5/8 與 3/5/7 不一致）、CHK017（「任何 LLM 金鑰」未定義清單）、CHK012（素材更新後 e2e 的維護契約）。
- **2026-07-29 全數結清**：本表 31 項全部通過。本輪新增的需求層條文為 FR-002b / FR-002c / FR-002d，以及 FR-003 / FR-004 / FR-005 的可量測子項。
