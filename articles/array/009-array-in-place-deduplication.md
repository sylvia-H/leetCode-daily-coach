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

In-Place Deduplication in Sorted Array 指的是在已排序陣列中，以原地（in-place）覆寫的方式移除重複元素，讓每個獨特值只保留一份（或至多保留指定次數），並回傳去重後的有效長度，空間複雜度維持在 O(1)。關鍵前提是「已排序」：排序保證相同的值必定彼此相鄰，因此要判斷一個元素是否重複，只需要與「最後一個被保留的元素」比較即可，不需要雜湊表這類額外結構來記錄看過哪些值。換句話說，排序已經替我們把資訊整理完畢，去重只剩下一次線性掃描的收割工作，這正是此 Pattern 能同時做到 O(n) 時間與 O(1) 空間的根本原因。

## Thinking

解法骨架是 Fast-Slow Pointers：慢指標 slow 指向「目前不重複區間的最後一個位置」，快指標 fast 從索引 1 開始向右掃描。當 `nums[fast] !== nums[slow]` 時代表出現新值：先把 slow 往右移一格，再把 nums[fast] 寫入該位置；兩者相同時 fast 直接略過。這個做法的正確性可以用迴圈不變式說清楚：每輪迭代開始前，nums[0..slow] 恰好存放「已掃描區段裡的所有獨特值，且維持原本的遞增順序」。初始時該區間只有 nums[0]，不變式成立；之後只有遇到新值才擴張一格並寫入該值，重複值一律略過，因此不變式在每一輪都被保持；掃描結束時 nums[0..slow] 就是完整答案，有效長度為 slow + 1。另一個必須說服自己的問題是：原地覆寫會不會蓋掉還沒讀到的資料？不會——slow 每輪至多前進一步、fast 每輪必定前進一步，所以 slow 永遠小於或等於 fast，寫入位置始終落在 fast 已經讀取過的區域內。

## Pattern Recognition

當題目同時出現三個訊號——輸入是已排序陣列（sorted array）、要求原地修改且不得配置額外陣列、目標是移除重複（remove duplicates）並回傳新長度——即可直接鎖定 Fast-Slow Pointers。若題目放寬為「每個值至多保留 k 次」，同一套骨架仍然適用：只要把比較對象從最後一個保留值，改成「寫入位置往前第 k 格的已保留元素」，因為在已排序陣列中，nums[fast] 與該元素相同就代表這個值已經出現滿 k 次。反過來說，若陣列未排序，相同值不再相鄰，相鄰比較法立刻失效，只能改用雜湊集合並付出 O(n) 額外空間的代價。

## Common Mistakes

最常見的錯誤是忽略邊界：空陣列或長度為 1 的陣列應直接回傳其長度，否則後續邏輯可能越界或做多餘判斷。其次是把更新順序寫反——必須先推進 slow、再寫入 nums[fast]；若先寫入再推進，會把新值蓋在既有的獨特元素上。第三是回傳值弄錯：slow 是「索引」，有效長度是 slow + 1，兩者恰差一。最後，在「至多保留兩次」的變體中，若仍拿 nums[fast] 與 nums[slow] 比較，會把合法的第二次出現也濾掉；正確做法是與倒數第二個已保留元素比較，才能精準控制每個值的保留次數。

## Complexity

時間複雜度為 O(n)：fast 對陣列進行恰好一次線性掃描，每個元素至多被讀取一次、寫入一次。空間複雜度為 O(1)：整個過程只用到兩個索引變數，所有寫入都發生在原陣列上，不需要任何額外資料結構。

## Digest

In-Place Deduplication in Sorted Array 是 Fast-Slow Pointers 的經典應用。排序讓相同元素必定相鄰，因此只需拿當前元素與最後一個保留值比較即可辨識重複，完全省下雜湊表的 O(n) 空間。slow 維護不重複區間、fast 負責向前探索，nums[0..slow] 在整個掃描過程中始終保持「獨特且有序」的不變式，結束時回傳 slow + 1 即為新長度。把比較對象改成寫入位置往前第 k 格，同一套骨架就能處理「每個值至多保留 k 次」的進階變體。

## TypeScript Tip

```typescript
function removeDuplicatesExtended(nums: number[], k: number): number {
  if (nums.length <= k) return nums.length;
  let slow = k;
  for (let fast = k; fast < nums.length; fast++) {
    if (nums[fast] !== nums[slow - k]) {
      nums[slow] = nums[fast]!;
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

## Takeaway

排序讓重複元素相鄰，Fast-Slow Pointers 即可在 O(n) 時間、O(1) 空間完成原地去重。

## Tomorrow Preview

明天我們將把 Fast-Slow Pointers 延伸到另一個經典情境：Moving Zeroes to End——原地把所有零搬到陣列末端，同時保持非零元素的相對順序，體會同一套快慢指標骨架如何換上不同的寫入條件。

## Today's Challenge

- **26** · 已排序陣列的原地去重並回傳新長度，是 Fast-Slow Pointers 最標準的應用場景。
  - Hint: slow 維護最後一個不重複位置，fast 掃描找新值；找到時先推進 slow 再寫入。
- **80** · 允許每個元素至多出現兩次，考驗你能否把比較基準從最後一個保留值換成更前面的元素。
  - Hint: 改與寫入位置往前第 2 格的已保留元素比較，相同即代表該值已出現滿兩次。
