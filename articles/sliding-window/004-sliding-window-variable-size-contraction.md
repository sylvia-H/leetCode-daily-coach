---
id: sliding-window-variable-size-contraction
title: 'Variable-Size Sliding Window: Contraction Phase'
module: sliding-window
pattern_label: Variable Sliding Window
complexity_label: O(n) / O(k)
estimated_minutes: 20
exit_criteria:
  - 能寫出在限制被違反時，從左側收縮視窗的內層 while 迴圈。
  - 能在收縮過程中正確更新全域最佳結果（最大或最小長度）。
---
## Concept

在處理動態視窗大小（Variable-Size Sliding Window）的問題時，擴展右指標（Right Pointer）通常用於尋找滿足特定條件的候選區間，而收縮左指標（Left Pointer）則用於在維持條件有效的情況下尋找最佳解（如最小長度），或者在違反條件時恢復視窗的合法性。Contraction Phase 的核心精神在於當視窗滿足目標時，嘗試從左側剔除元素，藉此壓縮視窗範圍，確保我們能精確捕捉到極值。

## Thinking

當我們使用雙指標（Two Pointers）來維護一個動態視窗時，右指標會不斷向右移動以將新元素納入視窗。一旦視窗內容達成某個門檻或違反了某個限制，我們就必須啟動一個內部迴圈來推動左指標。在這個收縮過程中，我們需要在每次移除左側元素後立即更新全域的最優解（例如最短子陣列長度），直到視窗再次變為不合法或不再滿足條件為止。這種「外層推進右邊，內層緊縮左邊」的雙迴圈結構是 Variable Sliding Window 的典型特徵。

## Pattern Recognition

當題目要求尋找「符合某條件的最小長度子陣列」（Minimal Size Subarray Sum）或「包含所有必要字元的最小子字串」時，強烈暗示我們需要使用 Variable-Size Sliding Window 的 Contraction Phase。若問題的條件是「大於等於某個值（>= target）」並要求最短長度，這就是標準的收縮觸發點：一旦當前視窗總和達標，便立即記錄長度並嘗試向右移動左指標來縮小範圍。

## Common Mistakes

最常見的錯誤是在內層的收縮迴圈（while loop）中遺漏了更新最優解的步驟，導致我們只在視窗擴大時檢查，或是搞錯了更新極值的時機點。另一個常見失誤是沒有正確維護視窗的累計狀態（例如忘記從總和中減去被移出的左側元素），或者在條件判斷時寫錯大於小於符號，導致內部迴圈變成死循環或根本無法執行。

## Complexity

時間複雜度為 O(n)，因為左右指標在整個執行過程中最多各遍歷陣列一次；空間複雜度為 O(k)，其中 k 為視窗內元素所佔用的額外資料結構空間，若僅使用數值變數則為 O(1)。

## Digest

本單元深入剖析 Variable-Size Sliding Window 的 Contraction Phase。當右指標擴展視窗以滿足目標時，內部的 while 迴圈會推動左指標進行收縮，藉此在合法的前提下尋找最小長度或最佳解。我們學習了如何精確維護狀態、更新全域最優值，並避免常見的指標錯亂與漏算問題。

## TypeScript Tip

```typescript
import assert from "node:assert";

function verifyWindow(): void {
  const target = 7;
  const nums = [2, 3, 1, 2, 4, 3];
  let left = 0, sum = 0, minLen = Infinity;
  for (let r = 0; r < nums.length; r++) {
    sum += nums[r];
    while (sum >= target) {
      minLen = Math.min(minLen, r - left + 1);
      sum -= nums[left++];
    }
  }
  assert.strictEqual(minLen, 2);
}
verifyWindow();
```

## Python Tip

```python
def verify_window() -> None:
    target = 7
    nums = [2, 3, 1, 2, 4, 3]
    left = 0
    current_sum = 0
    min_len = float('inf')
    for r in range(len(nums)):
        current_sum += nums[r]
        while current_sum >= target:
            min_len = min(min_len, r - left + 1)
            current_sum -= nums[left]
            left += 1
    assert min_len == 2

verify_window()
```

## Takeaway

掌握 Contraction Phase 的關鍵在於：當視窗滿足條件時，使用內部迴圈推進左指標來收縮範圍，並在每次收縮時安全地更新全域最優解。

## Tomorrow Preview

明天我們將探討 Variable-Size Sliding Window 的另一種應用型態：字元計數與雜湊表搭配的動態視窗收縮，並深入處理不重複字串的極大化問題。

## Today's Challenge

- **209** · 本題要求找出滿足總和大於等於 target 的最短連續子陣列長度，完全對應 Variable-Size Sliding Window 搭配左指標收縮尋找極值的典型模式。
  - Hint: 使用右指標累加數字，一旦總和達標即啟動內部 while 迴圈縮減左指標並記錄最小長度。
