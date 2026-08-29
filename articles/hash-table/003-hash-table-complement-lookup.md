---
id: hash-table-complement-lookup
title: Complement Lookup for Pair Finding
module: hash-table
pattern_label: Complement Hash
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 'Can identify the complement condition (e.g., target - current)'
  - Can retrieve past elements during a single linear scan
---
## Concept

補數查詢（Complement Lookup）處理的是「找出兩個元素滿足某個數學關係」的問題，最典型的就是兩數相加等於 target。暴力解用雙層迴圈檢查所有數對，時間是 O(n^2)；補數查詢把問題反過來想：與其問「哪兩個數相加等於 target」，不如在走訪到某個數 x 時直接問「target - x 出現過了嗎」。這一步把「找一對」化約成「查一個」，再靠 Hash Map 讓查詢平均 O(1)，整體便降為 O(n)。這是「以空間換時間」的經典示範：多花 O(n) 記憶體保存看過的元素，換掉一整層迴圈。

## Thinking

關鍵是一條迴圈不變式：走到索引 i 時，Map 裡恰好存著 i 之前所有「已看過」的元素（值 → 索引）。每一步先算補數 target - nums[i]，查 Map：查到，代表某個更早的元素能與當前元素配對，直接回傳兩個索引；查不到，才把 nums[i] 寫進 Map。為什麼不會漏解？假設答案是一對 (i, j) 且 i < j：當迴圈走到 j 時，nums[i] 早已在 Map 裡，此刻查 target - nums[j] 必然命中。也就是說，每一對答案都會在「較晚的那個索引」被抓到，單趟掃描就足夠。而「先查後存」的順序同時保證了另一件事：查詢當下，當前元素還沒進 Map，絕不可能拿自己配對自己。

## Pattern Recognition

辨識線索：題目要找「兩個元素」滿足某個可移項的數學關係——和等於 target、差等於 k、湊成特定配對。只要關係式能改寫成「已知 x，求固定的另一半」，就能邊掃邊查。細節依需求調整：要回傳索引，Map 存「值 → 索引」；只需判斷存在，Set 就夠；允許同值多次配對（如統計能湊出幾對），則存出現次數，成對後把次數扣一。

## Common Mistakes

最常見的錯誤是先把整個陣列灌進 Map 再開始查，這會造成自我配對：target 為 6、陣列裡只有一個 3 時，查 6 - 3 會查到自己。「先查後存」天然避開這一點，而且同值配對也正確——陣列是 [3, 3] 時，第二個 3 查到的是第一個 3。另一個誤區是把它與排序加雙指標混為一談：雙指標必須先排序（O(n log n)），且排序會打亂位置，要回傳原始索引還得額外記錄；補數查詢不動原陣列、單趟完成，兩者適用前提不同。也要留意 Map 的鍵是「元素值」而非索引——鍵放錯，補數就永遠查不到。

## Complexity

時間複雜度 O(n)：單趟線性掃描，每步的 Hash Map 查詢與插入平均 O(1)。空間複雜度 O(n)：最壞情況（掃完仍無配對）Map 會存下全部 n 個元素。

## Digest

補數查詢用一條問題轉換把兩數配對從 O(n^2) 降到 O(n)：走訪到 x 時不再問「哪個數能跟它配」，而是查「target - x 出現過了嗎」。Hash Map 保存「值 → 索引」，維持「表＝已看過的前綴」這條不變式，任何一對答案都會在較晚的索引被查到，單趟掃描即完備。實作鐵律是「先查後存」：查詢當下當前元素尚未入表，杜絕自我配對，同時讓 [3, 3] 這種同值配對自然正確。需要索引就用 Map、只問存在就用 Set、允許多次配對就存次數。它與排序後雙指標互為替代：前者不動原陣列、保留索引、花 O(n) 空間；後者省空間但必須先排序。

## TypeScript Tip

用 `seen.get()` 一次完成「查存在＋取索引」；命中判斷要寫 `j !== undefined`，寫成 `if (j)` 會把索引 0 誤判為未命中。嚴格索引設定下以 `nums[i]!` 收斂型別。

```typescript
function twoSum(nums: number[], target: number): [number, number] | null {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const num = nums[i]!;
    const j = seen.get(target - num);
    if (j !== undefined) return [j, i];
    seen.set(num, i);
  }
  return null;
}
if (JSON.stringify(twoSum([3, 2, 4], 6)) !== "[1,2]") throw new Error("assertion failed");
if (JSON.stringify(twoSum([3, 3], 6)) !== "[0,1]") throw new Error("assertion failed");
```

## Python Tip

`dict.get()` 查不到時回傳 `None`，比先 `in` 再取值省一次雜湊查詢；命中判斷用 `is not None`，索引 0 才不會被誤判成未命中。

```python
def two_sum(nums: list[int], target: int) -> tuple[int, int] | None:
    seen: dict[int, int] = {}
    for i, num in enumerate(nums):
        j = seen.get(target - num)
        if j is not None:
            return (j, i)
        seen[num] = i
    return None

assert two_sum([3, 2, 4], 6) == (1, 2)
assert two_sum([3, 3], 6) == (0, 1)
assert two_sum([1, 2], 7) is None
```

## Takeaway

補數查詢把「找一對」化約成「查一個」：先查後存的單趟掃描，用 O(n) 空間換掉一整層迴圈。

## Tomorrow Preview

明天進入 Existence Tracking and Set Membership：當你只在乎「出現過沒有」、不需要對應值時，Hash Set 是比 Hash Map 更精準的工具，我們將用它處理重複偵測與成員查詢。

## Today's Challenge

- **1** · 找兩數相加等於 target 並回傳索引，是補數查詢的原型：邊掃描邊查 target - nums[i] 是否已在 Map 中。
  - Hint: Map 存「值 → 索引」；先查補數、查不到再存入當前元素，自然避開自我配對。
- **1679** · 要湊出總和為 k 的數對且每個元素只能用一次，是補數查詢加上次數統計的變形。
  - Hint: Map 記錄每個值的剩餘可用次數；遇到補數且次數大於零就成對並扣一，否則把當前值的次數加一。
