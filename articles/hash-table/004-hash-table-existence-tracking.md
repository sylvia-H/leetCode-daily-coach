---
id: hash-table-existence-tracking
title: Existence Tracking and Set Membership
module: hash-table
pattern_label: HashSet Membership
complexity_label: O(n) / O(n)
estimated_minutes: 10
exit_criteria:
  - >-
    Can choose between a hash map and a hash set based on whether values need to
    be stored
  - Can detect duplicates during iteration using a set
---
## Concept

存在性追蹤（Existence Tracking）處理最單純的一類查詢：「這個值出現過嗎？」當你只需要「有或沒有」的答案、不需要任何對應資料時，Hash Set 就是為此而生的結構——它只存鍵、不存值，插入與查詢平均 O(1)，效率與 Hash Map 同級，但語意更精準、空間負擔更小。選擇 Set 還是 Map 的判準只有一條：查到之後，還需不需要取出對應資料（索引、次數、其他屬性）？需要就用 Map；只問成員資格，Set 就夠。

## Thinking

以偵測重複為例，單趟走訪維持一條不變式：走到第 i 個元素時，Set 恰好等於前面所有已走訪元素的集合。每步先查當前元素在不在 Set——在，代表它先前出現過，重複成立；不在，就把它加入再繼續。正確性由不變式直接保證：任何重複值的第二次出現必然命中查詢，而命中也必然代表真的出現過，不誤報、不漏報。這個「邊走邊記、先查後加」的骨架延展性很強：加上「距離不超過 k」的限制，就讓 Set 只保留最近 k 個元素，成為固定視窗；反過來先把全部數字放進 Set，再用 O(1) 查詢「num - 1 在不在」認出每段連續序列的起點，只從起點往右計數，每個數至多被走訪兩次，就能以 O(n) 解最長連續序列。

## Pattern Recognition

題目出現「是否存在重複」「是否出現過」「某值在不在」這類是非題，就是 Set 的辨識線索。更廣義地說，只要演算法中某一步需要以 O(1) 回答成員資格，而排序或線性搜尋會成為瓶頸，就該想到 Set。若需求進一步變成「出現幾次」「上次出現在哪」，已超出存在性的範圍，升級用 Map。

## Common Mistakes

第一個誤區：需求只有存在性卻用 Map，把值塞 true 或 0——程式能動，但多耗空間也模糊意圖，讀的人會以為值有意義。第二個：查與加沒有在同一輪迴圈完成，例如先把整個陣列灌進 Set 再開始查——集合失去「目前為止」的時序意義，需要區分先後的邏輯就會出錯。第三個出現在視窗類變形：左界移出視窗的元素忘了從 Set 刪除，集合殘留過期元素，之後的每次判斷都可能誤報。

## Complexity

時間複雜度 O(n)：單趟走訪，每步的查詢與插入平均 O(1)。空間複雜度 O(n)：最壞情況（完全無重複）Set 存下全部元素；固定視窗變形只需 O(k)。

## Digest

Hash Set 是存在性查詢的專用結構：只存鍵、不存值，平均 O(1) 的查與加。選擇判準一條就夠——命中後還需不需要對應資料？需要（索引、次數）用 Map，不需要用 Set。重複偵測的骨架是「邊走邊記、先查後加」的單趟走訪，靠「Set＝已走訪元素的集合」這條不變式保證第一個重複在它第二次出現的當下被抓到。同一骨架加上距離限制就變成固定視窗（記得刪除離窗元素）；把全部元素先入 Set、再從「num - 1 不存在」的起點展開計數，就能以 O(n) 找出最長連續序列。存在性追蹤是之後滑動視窗與更多雜湊技巧的地基。

## TypeScript Tip

`new Set(nums).size !== nums.length` 也能一行判斷重複，但邊走邊查能在第一個重複出現時提前返回；`for...of` 不經索引存取，型別也更乾淨。

```typescript
function containsDuplicate(nums: number[]): boolean {
  const seen = new Set<number>();
  for (const num of nums) {
    if (seen.has(num)) return true;
    seen.add(num);
  }
  return false;
}
if (!containsDuplicate([1, 2, 3, 1])) throw new Error("assertion failed");
if (containsDuplicate([1, 2, 3, 4])) throw new Error("assertion failed");
if (!containsDuplicate([2, 2])) throw new Error("assertion failed");
```

## Python Tip

`in` 對 set 是平均 O(1)、對 list 是 O(n)——同一個運算子，效能天差地遠。`len(set(nums)) != len(nums)` 是一行版，但無法提前返回。

```python
def contains_duplicate(nums: list[int]) -> bool:
    seen: set[int] = set()
    for num in nums:
        if num in seen:
            return True
        seen.add(num)
    return False

assert contains_duplicate([1, 2, 3, 1]) is True
assert contains_duplicate([1, 2, 3, 4]) is False
assert len({1, 1, 2}) == 2
```

## Takeaway

只問「出現過沒有」就用 Set：邊走邊記、先查後加，O(1) 成員查詢是線性演算法的地基。

## Tomorrow Preview

明天把 Hash Set 裝上滑動視窗：讓集合隨左右指標同步增刪、追蹤視窗內的不重複元素，處理最長不重複子字串與固定範圍內的重複偵測。

## Today's Challenge

- **217** · 全域重複偵測的原型題：Set 記錄走訪過的元素，第一個重複在它第二次出現的當下被查到。
  - Hint: 邊走訪邊查 Set，查到已存在就回傳 true；走完都沒命中則回傳 false。
- **219** · 在存在性之上加了「索引距離不超過 k」的限制，Set 化身固定視窗的內容物，查到即符合條件。
  - Hint: Set 大小超過 k 時刪除剛離開視窗的 nums[i - k]，讓「在 Set 裡」等價於「距離不超過 k」。
- **128** · 考驗把 O(1) 存在性查詢用在對的地方：判斷「num - 1 在不在」就能認出每段連續序列的起點。
  - Hint: 全部數字先入 Set；只從沒有左鄰居的數字往右計數，每個數至多被走訪兩次，整體 O(n)。
