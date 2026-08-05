---
id: binary-search-exclusive-bounds
title: Binary Search Exclusive Bounds
module: binary-search
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
estimated_minutes: 20
exit_criteria:
  - Configure pointers with right = n.
  - Update bounds correctly using right = mid.
---
## Concept

Binary Search Exclusive Bounds 是一種高效的二分搜尋策略，其核心在於將右邊界設定為開區間（Exclusive Right Bound），即區間表示為 [left, right)。在這種模式中，初始的右邊界 right 通常設定為陣列長度 n，代表它指向搜尋範圍之外的第一個元素。透過 while (left < right) 作為迴圈條件，搜尋空間逐步縮小，直到 left 與 right 相遇。此方法在處理尋找邊界、插入位置或處理重複元素時，能保持程式碼的簡潔與邏輯的一致性，有效避免傳統閉區間 [left, right] 容易發生的邊界條件混淆或無窮迴圈問題。

## Thinking

思考 Binary Search Exclusive Bounds 時，首要任務是釐清區間的語意。當我們使用 [left, right) 時，left 是包含在搜尋空間內的，而 right 則是嚴格不包含在內的。初始狀態下，left 設定為 0，而 right 設定為 n（陣列長度），因為合法的索引範圍最大只到 n-1。在迴圈內部，計算中間點 mid = Math.floor(left + (right - left) / 2)。當比較 nums[mid] 與目標值時，如果目標值小於或等於 nums[mid]，代表目標可能在左半邊或就是當前位置，因此我們將右邊界收縮至 mid（即 right = mid）；如果目標值大於 nums[mid]，則目標必定在右半邊，因此將左邊界移動至 mid + 1（即 left = mid + 1）。當迴圈終止時（即 left === right），該指針即指向正確的邊界或插入位置。

## Pattern Recognition

在 LeetCode 題目中，當看到需要尋找「第一個大於等於目標值的元素」、「插入點（Insertion Position）」、或者在含有重複元素的陣列中尋找「左邊界或右邊界」時，就應該強烈考慮使用 Binary Search Exclusive Bounds Pattern。辨識的關鍵線索包括：題目要求回傳一個索引，且該索引可能超出當前陣列範圍（例如可以插入到陣列末尾，即索引為 n），或者題目涉及區間的尋找。此時，將右邊界初始化為 n 且採用 [left, right) 區間，能夠自然地處理插入到陣列尾端的情況，而不需額外編寫特殊的條件判斷式。

## Common Mistakes

實作 Binary Search Exclusive Bounds 時最常見的錯誤包括：第一，混淆了開區間與閉區間的更新邏輯，例如在 right = mid 的情況下誤用了 right = mid - 1，這會導致跳過正確的邊界或造成漏掉目標元素。第二，迴圈條件寫錯，例如寫成 while (left <= right)，在 [left, right) 的語意下，若等於會導致當 left 與 right 相遇時繼續進行無意義的比較，甚至引發無窮迴圈或陣列存取越界。第三，計算 mid 時未考慮整數溢位（雖然在現代高階語言中較少見，但仍為良好的防範習慣）。第四，未能正確理解終止時 left 與 right 的交會點即為解答。

## Complexity

時間複雜度為 O(log n)，因為每一次迴圈迭代都將搜尋範圍減半；空間複雜度為 O(1)，僅使用常數級別的指針變數來追蹤邊界。

## Digest

Binary Search Exclusive Bounds 是一種以 [left, right) 開區間為核心的二分搜尋策略。相較於傳統閉區間，它將右邊界初始化為陣列長度 n，使得插入點或邊界的尋找變得異常自然與優雅。透過 while (left < right) 迴圈與 right = mid、left = mid + 1 的更新法則，演算法能夠穩定收斂至目標位置。這種模式特別適合解決 LeetCode 35 與 34 等涉及邊界定位的經典問題，能有效避免指針錯亂與無窮迴圈。

## TypeScript Tip

在 TypeScript 中實作此 Pattern 時，務必確保 right 初始化為 nums.length。計算 mid 時建議使用 Math.floor(left + (right - left) / 2) 以保持風格嚴謹。迴圈條件嚴格使用 < 運算子。以下為完整範例：
```typescript
function lowerBound(nums: number[], target: number): number {
    let left = 0;
    let right = nums.length;
    while (left < right) {
        const mid = Math.floor(left + (right - left) / 2);
        if (nums[mid] >= target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    if (left !== 1) throw new Error("assertion failed");
    return left;
}
lowerBound([1, 2, 4, 5], 2);
```

## Python Tip

在 Python 中，運用 Exclusive Bounds 時，型別提示與整數除法運算符 // 是編寫高品質程式碼的關鍵。確保 right 指向 len(nums)，並且迴圈條件為 left < right。以下為驗證範例：
```python
def lower_bound(nums: list[int], target: int) -> int:
    left, right = 0, len(nums)
    while left < right:
        mid = left + (right - left) // 2
        if nums[mid] >= target:
            right = mid
        else:
            left = mid + 1
    assert left == 1, "assertion failed"
    return left

lower_bound([1, 2, 4, 5], 2)
```

## TypeScript Corner

```typescript
function searchInsert(nums: number[], target: number): number {
    let left = 0;
    let right = nums.length;
    while (left < right) {
        const mid = Math.floor(left + (right - left) / 2);
        if (nums[mid] >= target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    if (left !== 2) throw new Error("assertion failed");
    return left;
}
const result = searchInsert([1, 3, 5, 6], 5);
```

## Python Corner

```python
def searchInsert(nums: list[int], target: int) -> int:
    left, right = 0, len(nums)
    while left < right:
        mid = left + (right - left) // 2
        if nums[mid] >= target:
            right = mid
        else:
            left = mid + 1
    assert left == 2, "assertion failed"
    return left

result = searchInsert([1, 3, 5, 6], 5)
```

## Takeaway

掌握 [left, right) 區間與 right = n 的初始化，使用 while (left < right) 尋找邊界與插入點。

## Tomorrow Preview

明天我們將探討 Binary Search Inclusive Bounds Pattern，學習如何利用閉區間 [left, right] 與 while (left <= right) 來處理精確尋找特定數值的場景，並比較其與 Exclusive Bounds 在邊界處理上的差異。

## Today's Challenge

- **35** · 此題要求尋找目標值的插入索引，若數值不存在則返回按順序插入的位置，非常適合利用 [left, right) 區間與 right = n 來尋找第一個大於等於目標值的元素。
  - Hint: 初始化 right 為陣列長度，當 nums[mid] >= target 時收縮右邊界至 mid。
- **34** · 此題需要在排序陣列中尋找元素的第一個與最後一個位置，透過兩次應用 Exclusive Bounds 策略（分別尋找左邊界與右邊界），可以完美且高效地定位區間。
  - Hint: 分別撰寫尋找起始位置與結束位置的輔助函數，注意當尋找右邊界時的條件判斷微調。
