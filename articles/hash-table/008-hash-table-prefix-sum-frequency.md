---
id: hash-table-prefix-sum-frequency
title: Prefix Sum Frequency for Subarray Counts
module: hash-table
pattern_label: Prefix Sum Hash Map
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - Can compute running prefix sum
  - >-
    Can check if prefix_sum - target exists in the frequency map to count valid
    subarrays
---
## Concept

Prefix Sum Frequency for Subarray Counts 是處理連續子陣列總和問題的核心技巧。當題目要求尋找總和等於特定目標值的子陣列數量，且陣列中包含負數時，傳統的 Sliding Window 因為失去單調性而無法適用，此時便需要結合 Prefix Sum 與 Hash Map 來將時間複雜度降至 O(n)。

## Thinking

在處理子陣列總和問題時，如果我們計算從索引 0 到 j 的 Prefix Sum 記為 prefixSum[j]，而某個較早的索引 i 其 Prefix Sum 記為 prefixSum[i]，那麼從 i+1 到 j 的子陣列總和即為 prefixSum[j] - prefixSum[i]。若此總和等於目標值 target，則有方程式 prefixSum[j] - prefixSum[i] = target，進一步可推導為 prefixSum[i] = prefixSum[j] - target。因此，我們可以在走訪陣列的過程中，使用一個 Hash Map 記錄每個 Prefix Sum 出現的頻率。每當計算出當前的 prefixSum[j]，我們只需在 Hash Map 中查詢是否存在 prefixSum[j] - target，若存在，其對應的頻率即代表有多少個以 j 結尾的子陣列其總和等於 target。

## Pattern Recognition

當題目具備以下特徵時，高度對應 Prefix Sum Hash Map Pattern：第一，尋找符合特定總和（Target Sum）的連續 Subarray；第二，陣列中包含負數或零，導致無法使用 Sliding Window；第三，要求計算符合條件的子陣列數量而非單純判斷是否存在。

## Common Mistakes

最常見的錯誤是遺漏將 Hash Map 初始化為 {0: 1}。這個初始化至關重要，因為當某個 Prefix Sum 本身剛好就等於 target 時，prefixSum[j] - target 的結果為 0，如果 Hash Map 中沒有記錄 0 出現過 1 次，這種從陣列開頭起算的合法子陣列將會被漏掉。

## Complexity

Time Complexity: O(n) 因為只需要對陣列進行一次線性掃描，且 Hash Map 的插入與查找操作平均時間複雜度為 O(1)。Space Complexity: O(n) 用於儲存 Prefix Sum 頻率的 Hash Map 在最壞情況下需要儲存所有相異的 Prefix Sum。

## Digest

Prefix Sum Frequency for Subarray Counts 是一種透過空間換取時間的經典演算法策略。當我們面對包含負數的子陣列總和問題時，Sliding Window 的單調性假設不再成立，此時藉由 Prefix Sum 數學性質將查詢轉換為兩數之差，再利用 Hash Map 記錄歷史頻率，能將原本需要 O(n^2) 的暴力搜尋法優化至 O(n)。學習此 Pattern 的核心在於理解初始化 {0: 1} 的必要性，以及如何維護動態的 Prefix Sum 頻率表。

## TypeScript Tip

在 TypeScript 中實作時，建議明確定義 Map 的型別為 Map<number, number>，並在迴圈開始前務必執行 map.set(0, 1)。
```typescript
function countSubarrays(nums: number[], k: number): number {
  const freqMap = new Map<number, number>();
  freqMap.set(0, 1);
  let prefixSum = 0;
  let ans = 0;
  for (const x of nums) {
    prefixSum += x;
    ans += freqMap.get(prefixSum - k) ?? 0;
    freqMap.set(prefixSum, (freqMap.get(prefixSum) ?? 0) + 1);
  }
  if (ans < 0) throw new Error("invalid count");
  return ans;
}
const testVal = countSubarrays([1, -1, 0], 0);
if (testVal !== 3) throw new Error("assertion failed");
```

## Python Tip

在 Python 中，推薦使用 collections.defaultdict(int) 來簡化 Hash Map 的讀寫邏輯，避免頻繁檢查鍵值是否存在。
```python
from collections import defaultdict


def count_subarrays(nums: list[int], k: int) -> int:
    freq_map = defaultdict(int)
    freq_map[0] = 1
    prefix_sum = 0
    ans = 0
    for x in nums:
        prefix_sum += x
        ans += freq_map[prefix_sum - k]
        freq_map[prefix_sum] += 1
    return ans


assert count_subarrays([1, -1, 0], 0) == 3, "assertion failed"
```

## Takeaway

掌握 Prefix Sum 結合 Hash Map 的數學轉換公式 prefixSum[i] = prefixSum[j] - target，並牢記初始化 {0: 1}。

## Tomorrow Preview

明天我們將探討 Two Pointers 與 Hash Table 在字串子字串匹配問題中的綜合應用，學習如何維持動態窗口並處理重複字元。

## Today's Challenge

- **560** · 典型的子陣列總和等於 k 問題，包含正負數，必須使用 Prefix Sum 頻率 Hash Map 在 O(n) 時間內求解。
  - Hint: 注意當前 prefix sum 減去 k 的差值是否存在於 Hash Map 中。
- **525** · 尋找具有相同數量 0 與 1 的連續子陣列，可透過將 0 視為 -1，轉換為尋找總和等於 0 的子陣列問題。
  - Hint: 將輸入陣列中的 0 轉換為 -1，問題即轉化為 Subarray Sum Equals 0。
