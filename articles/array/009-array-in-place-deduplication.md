---
id: array-in-place-deduplication
title: In-Place Deduplication in Sorted Array
module: array
pattern_label: Fast-Slow Pointers
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能利用已排序的性質比較相鄰元素
  - 能正確維護不重複區間的寫入指標
---
## Concept

In-Place Deduplication in Sorted Array 指的是在已排序的陣列中，透過原地（In-Place）修改的方式移除重複的元素，使得每個唯一元素僅出現一次（或至多指定次數），同時將有效長度回傳，且空間複雜度保持在 O(1)。由於陣列已經排序，相同的元素必然會聚集在相鄰的位置，這為我們省去了額外的雜湊表儲存空間，並提供了極佳的優化契機。

## Thinking

在處理已排序陣列的去重問題時，核心思維是運用 Fast-Slow Pointers。我們設置一個慢指標（slow）指向當前有效、不重複區間的最後一個元素位置，並用快指標（fast）從索引 1 開始掃描整個陣列。當快指標指向的元素與慢指標不同時，表示我們發現了一個新的獨特元素，此時將慢指標向後移動一位，並把快指標的值賦值給慢指標所在的位置。這種方法不需要額外的記憶體開銷，直接在原始陣列上進行覆寫。

## Pattern Recognition

當題目明確指出輸入為「已排序陣列（Sorted Array）」且要求「原地（In-Place）」進行「移除重複元素（Remove Duplicates）」操作時，即可強烈識別出此 Pattern 為 Fast-Slow Pointers。這類題目的特徵在於我們需要在線性的時間內掃描陣列，並且利用排序性質來過濾資料，而不需要建立額外的陣列或集合。

## Common Mistakes

最常見的錯誤包括忽略邊界條件，例如當傳入的陣列為空（empty array）或長度為 1 時，沒有做早期返回（early return）而導致索引越界或邏輯錯誤。另一個常見錯誤是在更新慢指標與寫入數值的順序上搞錯，導致部分元素被覆蓋或遺漏。此外，在處理允許重複出現兩次（如 LeetCode 80）的變體時，若沒有正確計算允許的頻率邊界，也會導致邏輯失效。

## Complexity

時間複雜度為 O(n)，因為快指標只需對陣列進行一次完整的線性掃描。空間複雜度為 O(1)，因為所有操作均在原陣列上進行，不需要額外的資料結構。

## Digest

In-Place Deduplication in Sorted Array 是演習中經典的指標操作題型。利用已排序陣列的單調性，相同元素必定相鄰，我們得以拋棄 O(n) 的額外空間開銷，轉而使用 O(1) 空間的 Fast-Slow Pointers。慢指標維護有效區間，快指標尋找新元素，兩者協同完成原地重組。掌握這個技巧不僅能解決基本的去重問題，更能應付多重重複次數的進階變體。

## TypeScript Tip

```typescript
function removeDuplicatesExtended(nums: number[], k: number): number {
  if (nums.length <= k) return nums.length;
  let slow = k;
  for (let fast = k; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow - k]) {
      nums[slow] = nums[fast];
      slow++;
    }
  }
  return slow;
}
const kLen = removeDuplicatesExtended([1, 1, 1, 2, 2, 3], 2);
if (kLen !== 5) throw new Error("Assertion failed");
```

## Python Tip

```python
def remove_duplicates_extended(nums: list[int], k: int) -> int:
    if len(nums) <= k:
        return len(nums)
    slow = k
    for fast in range(k, len(nums)):
        if nums[fast] != nums[slow - k]:
            nums[slow] = nums[fast]
            slow += 1
    return slow

length_k = remove_duplicates_extended([1, 1, 1, 2, 2, 3], 2)
assert length_k == 5, "Assertion failed"
```

## TypeScript Corner

```typescript
function removeDuplicates(nums: number[]): number {
  if (nums.length === 0) return 0;
  let slow = 0;
  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow]) {
      slow++;
      nums[slow] = nums[fast];
    }
  }
  return slow + 1;
}
const len = removeDuplicates([1, 1, 2]);
if (len !== 2) throw new Error("Assertion failed");
```

## Python Corner

```python
def remove_duplicates(nums: list[int]) -> int:
    if not nums:
        return 0
    slow = 0
    for fast in range(1, len(nums)):
        if nums[fast] != nums[slow]:
            slow += 1
            nums[slow] = nums[fast]
    return slow + 1

length = remove_duplicates([1, 1, 2])
assert length == 2, "Assertion failed"
```

## Takeaway

排序特性是去重的金鑰，善用 Fast-Slow Pointers 即可在 O(n) 時間與 O(1) 空間內完成原地清洗。

## Tomorrow Preview

明天我們將探討如何將 Fast-Slow Pointers 的應用延伸至鏈結串列（Linked List）的原地反轉與環形檢測，進一步深化指標操作的功力。

## Today's Challenge

- **26** · 題目要求在已排序陣列中原地移除重複元素並回傳新長度，完美契合 Fast-Slow Pointers 的標準應用場景。
  - Hint: 慢指標維護不重複的最後位置，快指標負責開路尋找相異元素。
- **80** · 允許每個元素最多重複兩次，這需要調整快慢指標的比較基準，透過與 slow - 2 處的元素進行比較來維持有效區間。
  - Hint: 將比較條件從 nums[fast] !== nums[slow] 改為檢查當前元素是否與倒數第二個有效元素相異。
