---
id: binary-search-lower-bound
title: Binary Search Lower Bound
module: binary-search
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 'Correctly identify lower bound conditions when nums[mid] >= target.'
---
## Concept

Binary Search Lower Bound 是一種衍生自標準二元搜尋的進階演算法，專門用於在排序陣列中尋找第一個大於或等於指定目標值（target）的元素位置。與傳統二元搜尋在找到目標值時立即返回不同，Lower Bound 演算法在遇到 nums[mid] >= target 時，不會直接中斷搜尋，而是將搜尋區間向左收縮（即將右邊界更新為 mid），以確保能找出所有相同元素中最左側的那一個。這種特性使其在處理包含重複元素的陣列時特別強大與精確。

## Thinking

當我們面對尋找特定數值的任務時，直覺往往是當 nums[mid] === target 時就立刻返回當前索引。然而，當陣列中存在重複的目標值時，這種傳統作法無法保證找到的是第一個出現的位置。為了克服這個限制，我們的思考邏輯必須轉變為：當 nums[mid] >= target 時，當前的 mid 位置有可能就是我們要找的答案，但為了追求「第一個」，我們必須把右指標收斂到 mid，繼續在左半邊尋找是否有更早出現的合法位置。這種把等於的情況歸類在左半邊搜尋的思維，是掌握 Lower Bound 與 Upper Bound 的核心關鍵。

## Pattern Recognition

當題目描述中出現「first position」、「lower bound」、「smallest index such that」、「first occurrence」或暗示陣列中含有重複元素時，我們應立即聯想到 Binary Search Lower Bound 的 Pattern。此外，若題目要求在 O(log n) 時間複雜度內找出符合特定條件的邊界索引，這也是標準的模式辨識線索。

## Common Mistakes

最常見的錯誤是在找到 nums[mid] === target 時直接 return mid，導致無法處理重複元素的最左側邊界。另一個常見失誤是迴圈條件設定不當（如使用 <= 而非 <），或者指標更新時沒有妥善包含 mid（例如寫成 high = mid - 1 而非 high = mid），這會導致當目標值不存在於陣列中時，演算法陷入無限迴圈或漏掉正確的插入位置。

## Complexity

時間複雜度為 O(log n)，因為每一次迭代都將搜尋範圍減半；空間複雜度為 O(1)，僅使用常數級別的指標變數。

## Digest

Binary Search Lower Bound 旨在尋找排序陣列中第一個大與或等於 target 的元素索引。核心精神在於 nums[mid] >= target 時收縮右邊界（high = mid），確保不漏掉左側可能的重複答案。時間複雜度 O(log n)，空間複雜度 O(1)。

## TypeScript Tip

```typescript
function tsTipExample(): void {
  const nums: number[] = [1, 2, 3, 3, 5];
  const target = 3;
  let low = 0, high = nums.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] >= target) high = mid;
    else low = mid + 1;
  }
  if (low !== 2) throw new Error("assertion failed");
}
tsTipExample();
```

## Python Tip

```python
def py_tip_example() -> None:
    nums = [1, 2, 3, 3, 5]
    target = 3
    low, high = 0, len(nums)
    while low < high:
        mid = (low + high) // 2
        if nums[mid] >= target:
            high = mid
        else:
            low = mid + 1
    assert low == 2, "assertion failed"
py_tip_example()
```

## Takeaway

掌握 nums[mid] >= target 時收縮右邊界的關鍵邏輯，精準解決重複元素的邊界查詢問題。

## Tomorrow Preview

明天我們將探討 Binary Search Upper Bound 的實作與應用，學習如何尋找第一個大於目標值的元素位置，並進一步融會貫通左右邊界的區間查詢技巧。

## Today's Challenge

- **34** · 題目要求找出陣列中目標值的起始與結束位置，其中尋找起始位置（starting position）正是標準的 Binary Search Lower Bound 應用場景。
  - Hint: 分別執行兩次二元搜尋：第一次使用 Lower Bound 找起始點，第二次微調條件找結束點。
