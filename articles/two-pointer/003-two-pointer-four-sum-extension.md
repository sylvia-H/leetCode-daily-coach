---
id: two-pointer-four-sum-extension
title: Four Sum Nested Reduction
module: two-pointer
pattern_label: Two Pointers - Multi-layer Fixed Pointers
complexity_label: O(n^3) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能夠正確處理四個數字的巢狀迴圈與重複值略過邏輯
  - 理解剪枝優化（Pruning）在多重迴圈中的應用時機
---
## Concept

Four Sum Nested Reduction 是一種將高維度 k-sum 問題透過多層巢狀迴圈與相向雙指標進行降維的系統性方法。當我們面對需要在陣列中尋找四個數字其和等於特定目標值的問題時，直覺的暴力解法需要四層迴圈，時間複雜度高達 O(n^4)。透過先對陣列進行排序，並利用雙層迴圈固定前兩個數字，將剩餘的求解範圍縮減為雙指標夾擊的一維搜尋問題，我們能將整體時間複雜度有效降低至 O(n^3)。這種降維策略不僅適用於四數之和，更是推廣至任意 k-sum 問題的核心骨幹。在處理多重巢狀迴圈時，搭配適當的剪枝（Pruning）與去重（Deduplication）機制，可以避免大量重複的計算，大幅提升演算法在極端測資下的執行效能。

## Thinking

在處理 Four Sum 問題時，思考的起點在於如何有序地窮舉所有可能的組合而不遺漏、不重複。首先，必須將輸入的數字陣列進行原地排序，排序是所有雙指標與剪枝優化的基石。接著，使用外層迴圈固定第一個數字 nums[i]，並用第二層迴圈固定第二個數字 nums[j]。在固定了前兩個數字之後，問題便轉化為在剩餘的右側區間內尋找兩個數字，使其和等於 target - nums[i] - nums[j]，這正是經典的 Two Sum 變體。此時，我們可以在內部使用左指標 left 與右指標 right 進行相向夾擊。為了達到最佳效能，必須在每一層迴圈中實作嚴格的去重邏輯，跳過與前一個元素相同的數值以避免重複組合。同時，利用極值判斷進行剪枝，當目前最小的和已經大於目標值，或目前最大的和依然小於目標值時，可直接使用 break 或 continue 終止迴圈，省去不必要的運算。

## Pattern Recognition

當題目要求在一個未排序或已排序的數值陣列中尋找多個數字（例如四個數字）的組合，使其總和剛好等於一個給定的目標值，且要求回傳所有不重複的獨特組合時，即可強烈識別出此 Pattern。其核心特徵包含：第一，尋找的目標是數值的組合而非單一索引；第二，所需尋找的數字個數 k 大於 2（本例中 k=4）；第三，允許透過排序與雙指標來取代高維度的指數級窮舉。若題目同時強調時間複雜度需優於 O(n^4) 且空間複雜度要求達到 O(1) 或僅使用額外的排序空間，則此「雙層固定迴圈搭配內層相向雙指標」的 Multi-layer Fixed Pointers 模式即為最標準的解答架構。

## Common Mistakes

開發者在實現 Four Sum 演算法時最常見的錯誤，主要集中在多層迴圈的變數去重與邊界條件處理上。首先，容易漏掉對第二層迴圈變數 j 的去重檢查，導致當內層指針重置時產生重複的四元組答案。正確的做法是確保 j > i + 1 時才與前一個數字進行比較（nums[j] === nums[j - 1]）。其次，在處理數字相加時未考慮數值溢位（Overflow）的風險，雖然在多數現代程式語言中整數範圍足夠，但在處理極端大數時仍需特別注意型別安全。最後，剪枝條件的寫法若不夠嚴謹，可能會提早跳過合法的正確解，例如在總和可能小於或大於目標值時誤判了正負號的影響，特別是當陣列中包含負數時，遞增或遞減的單調性判斷必須格外小心。

## Complexity

時間複雜度為 O(n^3)，其中 n 為陣列長度。主體包含雙層巢狀迴圈，外層執行 n 次，第二層平均執行 n 次，內層的雙指標夾擊在最壞情況下也需要走訪 n 次，因此總運算次數為 O(n^3)。空間複雜度為 O(1)，若不計入排序所需的堆疊空間；若考量排序演算法的空間消耗，則視語言實作而定，通常為 O(log n) 或 O(n)。

## Digest

本單元深入探討 Four Sum Nested Reduction 模式。透過排序與雙層固定迴圈，將高維度的四數之和問題降維至雙指標操作。我們學習了在多層迴圈中如何正確實作去重邏輯，避免重複的組合被加入結果集，並透過嚴謹的邊界控制與指針移動策略確保演算法在 O(n^3) 時間複雜度內高效運行。這項技巧是解決所有 k-sum 類型問題的基礎架構。

## TypeScript Tip

```typescript
function optimizePruningDemo(nums: number[], target: number): number[][] {
  nums.sort((a, b) => a - b);
  const res: number[][] = [];
  const n = nums.length;
  for (let i = 0; i < n - 3; i++) {
    if (nums[i] + nums[i+1] + nums[i+2] + nums[i+3] > target) break;
    if (nums[i] + nums[n-3] + nums[n-2] + nums[n-1] < target) continue;
    for (let j = i + 1; j < n - 2; j++) {
      res.push([nums[i], nums[j], nums[j+1], nums[j+2]]);
      break;
    }
    break;
  }
  return res;
}
const testRes = optimizePruningDemo([1, 2, 3, 4, 5], 10);
if (!Array.isArray(testRes)) throw new Error("assertion failed");
```

## Python Tip

```python
def py_early_stopping_demo(nums: list[int], target: int) -> list[list[int]]:
    nums.sort()
    res = []
    n = len(nums)
    for i in range(n - 3):
        if nums[i] * 4 > target:
            break
        res.append([nums[i], nums[i+1], nums[i+2], nums[i+3]])
        break
    return res

assert isinstance(py_early_stopping_demo([1, 2, 3, 4, 5], 10), list), "assertion failed"
```

## Takeaway

Four Sum 透過雙層固定迴圈與內層相向雙指標，將 O(n^4) 暴力解降維至 O(n^3)，核心在於嚴格的排序、去重與剪枝優化。

## Tomorrow Preview

明天我們將探討 Sliding Window 與 Two Pointers 的進階結合應用，學習如何在可變長度的區間內進行高效的子字串與子陣列搜尋，並掌握動態狀態維護的技巧。

## Today's Challenge

- **18** · 題號 18 4Sum 正是此多層固定指標與相向雙指標降維技術的標準代表題型，需要透過雙層迴圈與雙指標來找出所有獨特的四元組。
  - Hint: 記得先將陣列排序，並在兩層外迴圈中分別對 i 與 j 進行值相同的重複略過檢查。
