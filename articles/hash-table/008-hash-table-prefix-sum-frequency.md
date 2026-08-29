---
id: hash-table-prefix-sum-frequency
title: Prefix Sum Frequency for Subarray Counts
module: hash-table
pattern_label: Prefix Sum Hash Map
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能計算累積的 prefix sum
  - 能檢查 prefix_sum - target 是否存在於 frequency map 中，以計算合法子陣列的數量
---
## Concept

Prefix Sum Frequency 解決的是「數出總和等於目標值的連續子陣列個數」這類問題。當陣列可能含負數或零時，Sliding Window 會失效：擴張右界不保證總和變大、收縮左界不保證總和變小，單調性一旦消失，指標就沒有可依循的移動方向。此時改從數學關係下手——任何子陣列的和都能寫成兩個前綴和之差，於是「找和為 k 的子陣列」等價於「找兩個前綴和，其差恰為 k」。走訪過程中用 Hash Map 記錄每個前綴和出現過幾次，每到一個位置只需一次查表，就能知道有多少個合法起點，整體只需要一次線性掃描。

## Thinking

設 prefixSum[j] 為索引 0 到 j 的總和。若從 i+1 到 j 的子陣列總和等於 k，則 `prefixSum[j] - prefixSum[i] = k`，移項得 `prefixSum[i] = prefixSum[j] - k`。因此走訪到 j 時，只要查 Hash Map 中 prefixSum[j] - k 這個值出現過幾次，每一次出現都對應一個不同的合法起點 i，把次數累加進答案即可。這裡必須記「頻率」而不能只記「有無」：含負數的陣列中，同一個前綴和可能出現多次，每一次都是獨立的合法起點，只記存在會漏算。查完之後才把當前的 prefixSum[j] 寫入 Hash Map，供之後的位置配對。

## Pattern Recognition

三個特徵同時出現即高度對應此 Pattern：第一，目標對象是連續子陣列的「總和」；第二，陣列含負數或零，Sliding Window 的單調性前提不成立；第三，要求計數所有符合條件的子陣列，而非只判斷存在或求單一最佳。此外，一些表面上與總和無關的題目可以先轉換：例如求 0 與 1 數量相等的最長子陣列，把 0 視為 -1 之後，就變成「和為 0 的子陣列」，即可套用同一套框架。

## Common Mistakes

第一，遺漏初始化 {0: 1}：它代表「空前綴」——當 prefixSum[j] 本身恰等於 k 時，需要查到 prefixSum[j] - k = 0 曾出現過一次，從索引 0 起算的子陣列才會被計入；漏掉它，所有從開頭起算的答案全數消失。第二，先寫入再查詢：當 k 為 0 時，當前的前綴和會查到剛寫入的自己，把長度為零的空區間誤算成一筆，正確順序必須是先查詢、後寫入。第三，用 Set 只記前綴和是否出現過：負數會讓同一前綴和重複出現，每次出現都是獨立起點，必須記次數才不會漏算。

## Complexity

時間複雜度 O(n)：整個演算法只對陣列做一次線性掃描，每一步的 Hash Map 查詢與寫入平均為 O(1)。空間複雜度 O(n)：最壞情況下每個位置的前綴和都不相同，頻率表需儲存 n+1 個相異的鍵（含初始的 0）。

## Digest

Prefix Sum Frequency 是「用空間換時間」的經典策略：子陣列和等於兩個前綴和之差，於是「找和為 k 的子陣列」轉換為「查 prefixSum - k 出現過幾次」。用 Hash Map 記錄每個前綴和的出現頻率，一次線性掃描即可完成計數，取代 O(n^2) 的暴力列舉；含負數的陣列讓 Sliding Window 失去單調性，此法卻完全不受影響。三個關鍵細節：初始化 {0: 1} 代表空前綴、每一步先查詢後寫入、記頻率而非只記存在。掌握之後，0 與 1 等量子陣列這類題目也只是「先轉換再套框架」的變形。

## TypeScript Tip

明確標註 Map<number, number> 型別，讀取用 `?? 0` 收斂 undefined；迴圈開始前務必先放入基底 (0, 1)。

```typescript
function countSubarrays(nums: number[], k: number): number {
  const freq = new Map<number, number>();
  freq.set(0, 1);
  let prefix = 0;
  let ans = 0;
  for (const x of nums) {
    prefix += x;
    ans += freq.get(prefix - k) ?? 0;
    freq.set(prefix, (freq.get(prefix) ?? 0) + 1);
  }
  return ans;
}
if (countSubarrays([1, -1, 0], 0) !== 3) throw new Error("assertion failed");
```

## Python Tip

collections.defaultdict(int) 讓未出現的鍵讀出 0，省去存在性檢查；但基底 {0: 1} 仍須手動放入。

```python
from collections import defaultdict

def count_subarrays(nums: list[int], k: int) -> int:
    freq = defaultdict(int)
    freq[0] = 1
    prefix = 0
    ans = 0
    for x in nums:
        prefix += x
        ans += freq[prefix - k]
        freq[prefix] += 1
    return ans

assert count_subarrays([1, -1, 0], 0) == 3, "assertion failed"
```

## Takeaway

子陣列和即前綴和之差：查 prefixSum - k 的歷史頻率並累加，記得基底 {0: 1} 與先查後寫的順序。

## Tomorrow Preview

明天學習以 Hash Set 建構連續序列：只從「前一個數不存在」的邊界起點展開，在 O(n) 內找出最長的連續數列。

## Today's Challenge

- **560** · 陣列含負數使 Sliding Window 失效，正是以前綴和頻率表在 O(n) 內計數目標和子陣列的典型場景。
  - Hint: 每一步先查 prefix - k 在表中出現過幾次、再寫入當前 prefix，並以 {0: 1} 起始。
- **525** · 求 0 與 1 數量相等的最長子陣列，把 0 視為 -1 後即轉化為「和為 0」的前綴和問題。
  - Hint: 記錄每個前綴和第一次出現的索引，再次遇到同值時以索引差更新最長答案。
