---
id: input-output-contract
title: Input-Output Contract
module: programming-mindset
pattern_label: Contract Definition
complexity_label: O(1) / O(1)
estimated_minutes: 12
exit_criteria:
  - 能夠在動筆前寫出函式的型別簽章與邊界條件
---
## Concept

Input-Output Contract（輸入輸出合約）是指在寫下任何一行實作之前，先明確回答兩個問題：這個函式接受什麼（輸入的型別、範圍、結構），以及它保證回傳什麼（輸出的型別與意義）。合約就像函式對外的承諾書：呼叫端只要遵守輸入規格，就能無條件信任輸出保證，完全不必閱讀內部實作。它能消除大量除錯時間的關鍵在「錯誤攔截的位置」：沒有合約時，一筆不合法的資料會一路流進系統深處，在離源頭很遠的地方以莫名其妙的方式炸開，你得沿著呼叫鏈一層層往回追；有合約時，資料在函式邊界就被擋下，錯誤訊息直接指出「誰、用什麼參數、違反了哪一條規則」——除錯從偵探工作變成看報告。

## Thinking

昨天學的拆解是「先定義終點再反推」；套到單一函式上，動筆前的具體步驟是：先寫出型別簽章（例如 `(scores: number[]) => number`），再逐一質問邊界——輸入可能是空陣列嗎？空的時候要回傳什麼、拋出例外，還是這種輸入根本不會出現？數值可能是負數、零或極大值嗎？回傳值在每一種情況下都有明確定義嗎？每一個「不知道」都是合約的破洞，也是未來臭蟲的藏身處。把答案寫成簽章、型別與前置檢查之後才開始實作——此時實作只需要對「合法輸入」負責，程式主體反而變得更簡單。

## Pattern Recognition

當題目明確給出參數範圍（例如「1 <= n <= 10^5」）、資料結構約束與回傳型別要求時，它其實已經替你寫好合約的骨架：動筆前先把這些條件抄下來，翻成程式裡的假設與檢查。反過來，當資料來源沒有任何保證——使用者輸入、外部 API 回傳、檔案內容——就是你該主動補上合約的時機：先定義「合法輸入長什麼樣、不合法時怎麼辦」，再開始寫主邏輯。

## Common Mistakes

最危險的錯誤是假設輸入永遠符合理想狀態：只想著「正常」的輸入寫程式，空陣列、null、負數、極大值一出現就崩潰——或者更糟，不崩潰但默默算出錯的答案。第二個錯誤是合約寫了卻形同虛設：TypeScript 裡把參數標成 `any`，或 Python 裡完全不寫 type hints，型別系統就幫不上忙，錯誤又被推遲到執行期才爆發。第三個錯誤是輸出保證不完整：只定義了正常情況的回傳值，異常路徑有時回傳 undefined、有時拋例外，呼叫端無所適從，只好每次呼叫都額外防禦一層，重複的成本擴散到整個系統。

## Complexity

O(1) / O(1)。定義合約是設計期的思考活動，不佔用執行資源；實作時加上的前置檢查通常只是常數個條件判斷，相對於函式本體的成本可以忽略。

## Digest

Input-Output Contract：動筆前先定義函式接受什麼、保證回傳什麼。合約的價值在錯誤攔截位置——沒有合約，壞資料流進系統深處才炸開，你得沿呼叫鏈往回追兇；有合約，資料在函式邊界就被擋下，錯誤直接指出違反哪條規則。動筆前逐一質問：輸入可能是空集合嗎？空的時候回傳什麼、還是拋例外？數值可能是負數或極大值嗎？每個「不知道」都是未來的臭蟲。以 `average(scores)` 為例：空陣列會除以零，合約必須明說這種輸入要在邊界擋下、還是另有定義，而不是讓它默默算出錯的答案。題目給的參數範圍（1 <= n <= 10^5）就是現成的合約骨架，動筆前先抄下來。

## TypeScript Tip

型別簽章管得住合約的「形狀」，管不住「範圍」——非空、正數這類條件要用邊界檢查補上。驗證時合約的兩面都要顧：合法輸入要得到保證的輸出，不合法輸入要確實被拒絕：

```typescript
function average(scores: number[]): number {
  if (scores.length === 0) throw new Error("scores must be non-empty");
  let sum = 0;
  for (const s of scores) sum += s;
  return sum / scores.length;
}
if (average([80, 90, 100]) !== 90) throw new Error("assertion failed");
let rejected = false;
try { average([]); } catch { rejected = true; }
if (!rejected) throw new Error("empty input must be rejected");
```

## Python Tip

Python 的 type hints 不會在執行期強制檢查，合約中的範圍條件要用 `assert` 或明確拋錯補上：

```python
def average(scores: list[float]) -> float:
    assert len(scores) > 0, "scores must be non-empty"
    return sum(scores) / len(scores)

assert average([80.0, 90.0, 100.0]) == 90.0

rejected = False
try:
    average([])
except AssertionError:
    rejected = True
assert rejected, "empty input must be rejected"
```

空陣列在 Python 會除以零直接拋錯，但合約的精神是在邊界用自己的訊息講清楚，而不是讓底層錯誤替你發言。

## Takeaway

先寫型別簽章與邊界條件再寫實作：合約在邊界擋下壞資料，除錯就不必深入呼叫鏈追兇。

## Tomorrow Preview

明天的 Mental Model of Variables 會從函式邊界往內部走：合約定義了資料進出的規格，變數則是資料在函式內部暫存與演變的容器。我們將建立「變數是具時序性的狀態記錄器」這個正確的心智模型。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請替你最近寫過（或準備寫）的一個函式，在動筆實作前先寫出型別簽章，並列出三個邊界條件與各自的處理方式。
