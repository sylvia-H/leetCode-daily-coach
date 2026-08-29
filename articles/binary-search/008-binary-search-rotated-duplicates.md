---
id: binary-search-rotated-duplicates
title: Binary Search Rotated Array with Duplicates
module: binary-search
pattern_label: Binary Search
complexity_label: O(n) worst / O(log n) average
estimated_minutes: 20
exit_criteria:
  - 'Detect when nums[left] == nums[mid] == nums[right] and shrink boundaries.'
---
## Concept

包含重複元素的旋轉排序陣列（Rotated Sorted Array with Duplicates）是標準 Binary Search 的進階變體。當陣列中允許重複元素存在時，原本能明確區分哪一半是有序的特徵會失效。例如當 nums[left] 等於 nums[mid] 且等於 nums[right] 時，我們無法透過比較邊界來判斷目標值落在哪個半區，此時必須透過收縮左右邊界來解決。

## Thinking

在處理包含重複元素的旋轉陣列時，思考過程需要加入邊界相等的例外處理機制。首先，確認中點位置是否即為目標值。若不是，則檢查左半部是否有序。若左半部有序，判斷目標值是否落在左半部的範圍內，若是則將右邊界移動至中點左側，否則移動左邊界。若左半部無法判定有序性，即 nums[left] == nums[mid] == nums[right]，此時無法使用標準的 Binary Search 邏輯，必須將 left 指標右移且 right 指標左移，以略過重複的干擾元素，確保演算法能繼續推進。

## Pattern Recognition

當題目描述一個原本已排序的陣列經過旋轉，且明確指出陣列中「包含重複元素（with duplicates）」時，即可直接對應至此 Pattern。識別線索在於標準 Binary Search 無法僅靠左右端點與中點的大小關係來唯一確定哪一半是嚴格遞增的，必須額外增加處理重複值的防禦性收縮邏輯。

## Common Mistakes

最常見的錯誤是忽略了重複元素所導致的最壞時間複雜度退化問題。開發者常直接套用無重複版本的二分搜尋法，導致當陣列全為相同元素或包含大量重複值時陷入無限迴圈或錯誤判斷。另一個常見錯誤是未妥善處理邊界指標的交錯，導致存取超出陣列範圍的記憶體錯誤。

## Complexity

時間複雜度在一般情況下為 O(log n)，但在最壞情況下，當陣列包含大量重複元素且剛好促使指標每次僅能各退一步時，時間複雜度會退化為 O(n)。空間複雜度為 O(1)，因為僅使用常數額外變數。

## Digest

包含重複元素的旋轉排序陣列挑戰了解決 Binary Search 中因為重複值而導致有序性判斷失效的問題。當 nums[left] 等於 nums[mid] 且等於 nums[right] 時，標準二分法失效，必須透過將 left 加一與 right 減一來手動消除重複值帶來的干擾。這將時間複雜度在最壞情況下拉低至 O(n)，但在平均情況下仍能維持 O(log n) 的高效能。透過本單元的程式碼實作，你將掌握如何安全地處理邊界收縮並避免無限迴圈。

## TypeScript Tip

```typescript
function verifySorted(nums: number[]): void {
  if (nums.length === 0) throw new Error("empty array");
  const isNotDuplicate = nums[0] !== nums[nums.length - 1];
  if (isNotDuplicate && nums[0] > nums[nums.length - 1]) {
    throw new Error("invalid rotated state");
  }
}
verifySorted([1, 1, 2, 1]);
```

## Python Tip

```python
def verify_bounds(nums: list[int], left: int, right: int) -> None:
    if left > right:
        raise ValueError("Pointers crossed")
    assert 0 <= left < len(nums), "Left out of bounds"
    assert 0 <= right < len(nums), "Right out of bounds"

verify_bounds([1, 0, 1, 1, 1], 0, 4)
```

## Takeaway

面對旋轉陣列中的重複值，當邊界相等無法判定時，以線性收縮取代二分猜測是確保正確性的關鍵。

## Tomorrow Preview

明天我們將探討尋找旋轉排序陣列中的最小值（Find Minimum in Rotated Sorted Array），學習如何利用邊界特性在 O(log n) 時間內定位極值。

## Today's Challenge

- **81** · 本題正是允許重複元素的旋轉排序陣列搜尋問題，當左右中三者相等時必須執行指標收縮以維持正確性。
  - Hint: 當 nums[left] == nums[mid] == nums[right] 時，無法判斷哪一半有序，將 left++ 且 right--
