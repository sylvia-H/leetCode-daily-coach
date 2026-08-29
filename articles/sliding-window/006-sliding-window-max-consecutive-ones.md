---
id: sliding-window-max-consecutive-ones
title: Max Consecutive Ones with Replacements
module: sliding-window
pattern_label: Variable Sliding Window
complexity_label: O(n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能追蹤視窗內最高頻元素或無效元素的數量。
  - 能依據 (window_length - max_freq <= k) 維持視窗合法性。
---
## Concept

Max Consecutive Ones with Replacements 屬於經典的 Variable Sliding Window 題型。其核心概念是允許在一個連續子陣列中，存在至多 k 個無效元素（例如將 0 替換為 1）。當視窗內的無效元素數量超過 k 時，我們必須透過收縮左側指標（left pointer）來使視窗重新合法。透過動態調整左右邊界，我們能找出包含最多連續 1 的最大視窗長度。

## Thinking

在處理這類允許替換次數限制的題目時，思維模式通常圍繞著追蹤視窗內的狀態。我們維護一個滑動視窗 [left, right]，並記錄視窗內目標元素（例如 1）的最大頻率，或者直接追蹤無效元素（例如 0）的數量。若以追蹤 0 的數量為例，當 0 的個數大於 k 時，左指標右移直到 0 的個數小於或等於 k。視窗的最大長度會在右指標向右掃描的過程中不斷被更新。

## Pattern Recognition

當題目要求尋找一個子陣列，且該子陣列允許進行至多 k 次修改、翻轉、或替換操作時，這就是典型的 Variable Sliding Window Pattern。辨識線索包括：要求『最長子陣列』、『包含最多某個元素』，並且伴隨一個限制條件——允許將不超過 k 個其他元素轉換成目標元素。

## Common Mistakes

最常見的錯誤是在視窗左指標收縮（contraction）時，重新從頭計算視窗內元素的頻率或無效元素數量，導致時間複雜度退化至 O(n^2)。另一個常見錯誤是混淆了視窗長度與替換次數的關係，例如誤用當前視窗的總長度去判斷是否合法，而沒有正確扣除主要元素的頻率，或是沒有適時更新全域最大長度變數。

## Complexity

時間複雜度為 O(n)，因為左右指標在整個走訪過程中最多各自移動 n 次。空間複雜度為 O(1)，只需要常數級別的變數來記錄指標位置與計數。

## Digest

本單元聚焦於 Max Consecutive Ones with Replacements 觀念。我們學習了如何透過 Variable Sliding Window 在 O(n) 時間內處理具備 k 次替換限制的子陣列問題。關鍵在於維護視窗內無效元素的數量，當超過 k 時收縮左指標。TypeScript 與 Python 的實作皆展示了如何有效率地推進指標並維持視窗合法性。

## TypeScript Tip

```typescript
function checkWindow(nums: number[], k: number): void {
  const isValid = k >= 0;
  if (!isValid) throw new Error("assertion failed");
}
checkWindow([1, 0, 1], 1);
```

## Python Tip

```python
def check_window(nums: list[int], k: int) -> None:
    is_valid = k >= 0
    assert is_valid, "assertion failed"
check_window([1, 0, 1], 1)
```

## Takeaway

掌握 Variable Sliding Window 與 k 次替換限制的結合，透過動態維護無效元素數量達成 O(n) 高效解法。

## Tomorrow Preview

明天我們將探討 Sliding Window 與字串匹配的結合，學習如何運用雜湊表與滑動視窗來解決包含重複字元或字安檢測的問題。

## Today's Challenge

- **1004** · 題號 1004 要求尋找最多包含 k 個 0 的最長連續 1 子陣列，完美對應 Variable Sliding Window 允許 k 次替換的 Pattern。
  - Hint: 將視窗內的 0 視為無效元素，當 0 的數量大於 k 時收縮左指標。
