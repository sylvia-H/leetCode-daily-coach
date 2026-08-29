---
id: sliding-window-fruit-into-baskets
title: Fruit Into Baskets (At Most K Distinct)
module: sliding-window
pattern_label: Variable Sliding Window + Frequency Map
complexity_label: O(n) / O(k)
estimated_minutes: 20
exit_criteria:
  - 能維護元素頻率的 hash map，以追蹤視窗內相異元素的數量。
  - 能從左側收縮視窗，直到相異數量降回允許的上限。
---
## Concept

Fruit Into Baskets (At Most K Distinct) 是一類經典的 Variable Sliding Window 問題。核心在於維護一個動態視窗，使其內部的相異元素數量（distinct categories）不超過規定的上限（例如題目的 k = 2）。透過擴展右邊界來納入新元素，並在超過條件時從左邊界收縮，直到視窗內部的相異種類數重新符合限制為止。這個模式廣泛應用於處理『最多包含 k 種不同元素』的最長子陣列或子字串問題。

## Thinking

在思考這類問題時，首要任務是選用適合的資料結構來追蹤視窗內的狀態。我們需要一個頻率映射表（Frequency Map）來記錄每個元素在視窗內出現的次數。當我們向右移動右邊界（right pointer）並將新元素加入映射表後，若映射表的鍵總數（即相異元素數量）超過了上限 k，我們就必須開始移動左邊界（left pointer）。在收縮左邊界時，對應元素的頻率會遞減；一旦某個元素的頻率降為零，必須將該鍵從映射表中徹底刪除，以便正確反映當前的相異元素數量。在每次符合條件的狀態下，計算並更新視窗的最大長度。

## Pattern Recognition

當題目要求尋找『包含最多 k 種不同元素的最長子陣列』、『至多包含 k 個不同字元的最長子字串』，或涉及連續區間且帶有相異種類數量上限的約束時，即可高度識別為 Variable Sliding Window 搭配 Frequency Map 的模式。其特徵在於視窗大小不固定，右指針不斷前進，左指針在違反條件時被動追趕，且判定條件依賴於雜湊表的大小而非單純的數值大小。

## Common Mistakes

最常見的錯誤是在頻率歸零時忘記將該鍵從 Map 或字典中刪除。如果只將頻率設為 0 卻保留鍵，會導致雜湊表的大小計算錯誤，誤判相異元素的數量，進而使左指針無法正確收縮。另一個常見錯誤是在迴圈中沒有持續收縮直到相異元素數量降回上限，導致違反條件的狀態殘留在視窗中。

## Complexity

時間複雜度為 O(n)，因為左右指針各自最多遍歷陣列一次。空間複雜度為 O(k)，其中 k 為視窗內允許的最大相異元素數量，雜湊表最多儲存 k + 1 個鍵值。

## Digest

今日重點：學習 Fruit Into Baskets (At Most K Distinct) 模式。透過 Variable Sliding Window 與 Frequency Map，我們能以 O(n) 時間複雜度解決尋找至多包含 k 種相異元素的最長子陣列問題。關鍵在於當相異種類超標時，收縮左邊界並確實從雜湊表中刪除頻率歸零的元素。

## TypeScript Tip

```typescript
// TypeScript 提示：在操作 Map 時，務必明確呼叫 delete 方法來清理頻率為 0 的鍵，以確保 freqMap.size 能精準代表相異元素的數量。
const map = new Map<number, number>();
map.set(1, 1);
map.delete(1);
if (map.size !== 0) throw new Error("Assertion failed");
```

## Python Tip

```python
# Python 提示：使用字典紀錄頻率時，頻率歸零務必使用 del 移除鍵，否則 len(freq_map) 會包含計數為零的項目。
freq = {1: 1}
freq[1] -= 1
if freq[1] == 0:
    del freq[1]
assert len(freq) == 0, "Assertion failed"
```

## Takeaway

運用 Variable Sliding Window 與 Frequency Map 處理至多 k 種相異元素的區間問題時，確實刪除歸零的鍵是維持正確性的核心。

## Tomorrow Preview

明天我們將探討 Sliding Window 的另一種變體：固定大小的滑動視窗（Fixed Sliding Window），學習如何在固定長度的區間內高效維持與更新統計數據。

## Today's Challenge

- **904** · 此題本質即為尋找最多包含 2 種不同整數的最長子陣列，完美對應 Variable Sliding Window 搭配頻率映射的模式。
  - Hint: 使用雜湊表記錄目前視窗內每種水果的數量，當種類大於 2 時移動左指針並縮減計數。
