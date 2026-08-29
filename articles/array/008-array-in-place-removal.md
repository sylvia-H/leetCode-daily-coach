---
id: array-in-place-removal
title: In-Place Element Removal with Fast-Slow Pointers
module: array
pattern_label: Fast-Slow Pointers
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能區分快指標（尋找有效元素）與慢指標（寫入位置）的職責
  - 能在不使用額外記憶體下完成陣列壓縮
---
## Concept

In-Place Element Removal with Fast-Slow Pointers 是一種在處理陣列資料時極具效率的演算法模式。當題目要求我們在原本的陣列空間內移除特定元素，且空間複雜度必須達到 O(1) 時，傳統的建立新陣列或使用額外資料結構的方法便不再適用。此時，我們利用兩個指標——快指標與慢指標，在同一個陣列上進行掃描與覆寫。快指標的職責在於遍歷整個陣列，尋找所有符合條件（例如不等於目標值）的有效元素；而慢指標則負責標記下一個有效元素應該被寫入的位置。透過這種分工，我們能夠在不佔用額外記憶體的狀況下，將陣列進行原地壓縮，並同時計算出新陣列的有效長度。

## Thinking

在著手解決 In-Place Element Removal 相關問題時，思考的邏輯起點在於如何避免頻繁搬移元素所帶來的效能損耗。若使用暴力解法，每當找到一個要移除的元素就將後方所有元素往前搬移，時間複雜度會退化至 O(n^2)。此時我們轉換思維，採用 Fast-Slow Pointers。我們初始化一個慢指標 slow，通常從索引 0 開始，用來代表下一個有效資料的存放位置。接著讓快指標 fast 從頭到尾掃描陣列。當 fast 指向的元素是我們需要保留的有效元素時，我們就把它賦值給 arr[slow]，隨後將 slow 向右推動一格。若遇到需要移除的元素，fast 則繼續前進，而 slow 停留在原地等待下一個有效元素的覆蓋。如此一來，陣列前端會依序塞滿所有有效元素，而後端則成為未使用的殘留空間。當快指標掃描完畢時，slow 的數值剛好等於新陣列的有效長度。

## Pattern Recognition

要辨識這類題目是否適用 Fast-Slow Pointers 模式，可以從幾個關鍵特徵來判斷。第一，題目明確要求 In-place 修改，即空間複雜度限制為 O(1)，不能宣告額外的陣列或集合來儲存結果。第二，題目牽涉到元素的篩選、移除特定數值、或是根據條件保留特定頻率的元素（例如最多允許重複兩次）。第三，陣列通常允許被破壞性修改，也就是說，原本陣列後方的順序或數值在處理過後可以被覆蓋或忽略。當觀察到這些線索時，即可直接聯想並套用快慢指標架構來建立有效區間。

## Common Mistakes

開發者在實作 Fast-Slow Pointers 時最常犯的錯誤，在於搞清楚快慢指標的更新時機與賦值順序。常見的錯誤是將條件判斷寫反，或者在不該推進慢指標時盲目將其遞增，導致有效元素被覆蓋或遺漏。另一個常見的迷思是誤以為需要額外呼叫陣列的刪除方法（如 splice 或 pop），這在大部分語言中會觸發底層陣列的大規模元素搬移，導致時間複雜度劣化至 O(n^2)。正確的做法是單純透過指派運算子進行覆寫，最後直接回傳慢指標的數值作為新長度，忽略索引大於等於該長度的後續元素即可。

## Complexity

時間複雜度為 O(n)，因為快指標只需對整個陣列進行一次線性掃描；空間複雜度為 O(1)，全程僅使用固定的指標變數，未動用任何額外的動態記憶體。

## Digest

本篇課程深入探討了 In-Place Element Removal 與 Fast-Slow Pointers 的核心運作機制。我們學習到如何透過快指標負責掃描、慢指標負責寫入的協同作業，在 O(n) 時間與 O(1) 空間下完成陣列壓縮。文章詳細剖析了 Pattern 的辨識線索、常見的指標更新錯誤，並透過 TypeScript 與 Python 的標準程式碼範例展示了實作細節。掌握此模式不僅能解決基本的值移除題，更能應對允許重複保留等進階變體。

## TypeScript Tip

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
const nums = [1, 1, 2];
const len = removeDuplicates(nums);
if (len !== 2) throw new Error("Length check failed");
if (nums[0] !== 1 || nums[1] !== 2) throw new Error("Content check failed");
```

## Python Tip

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

nums = [1, 1, 2]
length = remove_duplicates(nums)
assert length == 2, "Length check failed"
assert nums[:2] == [1, 2], "Content check failed"
```

## Takeaway

快慢指標分工明確，快找有效、慢作寫入，O(1) 空間原地壓縮陣列。

## Tomorrow Preview

明天我們將探討 Two Pointers 延伸的另一個經典架構：相向雙指標（Collision Pointers）。我們將學習如何利用左右雙指標在已排序陣列中尋找特定總和的數對，並進一步分析其在演算法效率上的優勢。

## Today's Challenge

- **27** · 題目要求原地移除指定數值且不使用額外記憶體，完全符合 Fast-Slow Pointers 的快指標掃描、慢指標覆寫之經典應用場景。
  - Hint: 快指標掃描不等於 val 的元素，將其依序搬移到慢指標所在位置。
- **80** · 允許元素最多重複兩次，可藉由調整快慢指標的比較條件與容忍次數，在原陣列中直接進行篩選與覆寫。
  - Hint: 慢指標落後兩位進行比對，確保相同元素不超過兩次。
