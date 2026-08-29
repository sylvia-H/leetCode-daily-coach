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

Input-Output Contract 是演算法設計的基石，意指在撰寫任何一行實作程式碼之前，先精準定義函式的輸入（Input）型別、範圍、結構以及輸出（Output）的保證（Guarantees）。一個清晰的合約能夠在編譯期或呼叫初期就阻絕無效資料，確保資料流在系統中的正確性與可預測性。明確的合約能消除八成以上的除錯時間，並讓維護者不需閱讀繁雜的實作細節即可理解函式的職責。

## Thinking

在著手解決問題時，首先必須確認參數可能為空（null 或 undefined）、型別不符或極端值的行為。思考過程應從邊界條件（Edge Cases）出發：當輸入為空集合時應該回傳什麼？當數值超出範圍時是否需要拋出例外？透過嚴謹的思考來建立防禦性設計，確保函式在各種異常情況下皆有明確的輸出保證，而不是產生未定義的行為或隱含的錯誤。

## Pattern Recognition

當題目給定明確的參數範圍、資料結構約束與回傳型別要求時，即是使用 Contract Definition 模式的最佳時機。這種模式常見於介面導向設計、API 規格制定及演算法函式庫的開發中，透過型別系統或前置條件檢查來強制執行資料格式，防止錯誤向後傳播。

## Common Mistakes

最常見的錯誤是假設輸入永遠符合理想狀態，未考慮空值、負數或極端大數的情況。另一個常見誤區是型別定義過於鬆散（例如在 TypeScript 中過度使用 any，或在 Python 中缺乏型別提示），導致合約形同虛設，必須在執行期發生錯誤時才能察覺問題。

## Complexity

O(1) / O(1)

## Digest

Input-Output Contract 是確保程式碼品質的核心技術。透過在動筆前明確定義輸入與輸出，我們能大幅減少除錯時間並提升程式碼的可讀性。本單元重點在於學習如何識別型別約束、防範邊界條件，並透過 TypeScript 與 Python 的型別系統實踐合約導向程式設計。

## TypeScript Tip

```typescript
function validateRange(value: number): asserts value is number {
  if (value < 0 || value > 100) {
    throw new Error('Value out of range');
  }
}
const val: number = 50;
validateRange(val);
if (val !== 50) throw new Error('Assertion failed');
```

## Python Tip

```python
from typing import Final

MAX_RETRY: Final[int] = 3

def connect(retry: int) -> bool:
    assert 0 <= retry <= MAX_RETRY, 'Invalid retry count'
    return True

assert connect(2) is True
```

## Takeaway

先定合約再寫實作，邊界條件嚴格把關，型別系統助你安心。

## Tomorrow Preview

明天我們將探討如何利用這些精準的型別合約來建構更複雜的資料結構與演算法模組，並進一步學習邊界條件的自動化測試策略。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
