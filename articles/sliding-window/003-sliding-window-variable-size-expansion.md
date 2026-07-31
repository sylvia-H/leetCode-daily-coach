---
id: sliding-window-variable-size-expansion
title: 'Variable-Size Sliding Window: Expansion Phase'
module: sliding-window
pattern_label: Variable Sliding Window
complexity_label: O(n) / O(k)
estimated_minutes: 15
exit_criteria:
  - >-
    Can write a loop that greedily expands the right pointer until a condition
    is met or violated.
  - >-
    Can update window state correctly upon incorporating a new element at the
    right pointer.
---
## Concept

Variable-Size Sliding Window 的 Expansion Phase 是處理動態長度子陣列或子字串問題的核心機制。在固定長度的滑動視窗中，我們維持固定的窗口大小並向前移動；但在變動長度（Variable-Size）的場景中，視窗的左界與右界皆會根據問題的限制條件動態調整。Expansion Phase 專門負責透過右指標（Right Pointer）的向右擴展，將新元素納入當前視窗，藉此逐步建立符合條件的候選區間，或探索違反約束條件的邊界。

## Thinking

在進入右指標擴展的思考邏輯時，我們通常需要使用一個迴圈讓右指標從陣列的起始端一路掃描到終點。每當右指標向前移動一步，我們必須立即更新當前視窗的狀態。這可能包含將新元素加入雜湊表（Hash Map）、累加總和、或是更新字元頻率統計。在將元素納入視窗的同時或之後，我們便能檢視當前視窗是否滿足題目的條件，或者是否已經觸發了需要收縮左指標的條件，為後續的 Shrink Phase 做好準備。

## Pattern Recognition

當題目要求尋找「滿足特定條件的最長或最短子陣列」、「包含所有特定字元的最小子字串」、或「總和不大於/不小於目標值的連續區間」，且陣列元素包含正數或非負數時，即可辨識出這是 Variable-Size Sliding Window 的題型。此時，右指標的盲目擴展與左指標的條件式收縮便成為標準的雙指標（Two Pointers）解題骨架。

## Common Mistakes

最常見的錯誤是在擴展右指標時，沒有在第一時間正確更新視窗的狀態統計變數，導致後續的條件判斷基於過時的資料。另一個常見失誤是混淆了「滿足條件」與「違反條件」的時機，導致在右指標擴展時過早收縮左指標，或是漏掉了將元素完整納入視窗再進行合法性檢查的步驟。

## Complexity

時間複雜度通常為 O(n)，因為左右指標在整個執行過程中最多各走過陣列一次；空間複雜度視視窗狀態儲存結構而定，使用雜湊表或計數陣列時通常為 O(k)，其中 k 為字元集大小或視窗內的相異元素數量。

## Digest

Variable-Size Sliding Window 的 Expansion Phase 是動態區間問題的基礎。本單元重點在於如何透過右指標的向右移動來持續擴展視窗範圍，並即時更新視窗內部的狀態。掌握此階段後，開發者能夠準確地在迴圈中整合新元素，為搭配左指標收縮的完整演算法打下穩固根基。

## TypeScript Tip

```typescript
function trackMaxWindow(s: string): number {
  const map = new Map<string, number>();
  let left = 0;
  let maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    map.set(char, (map.get(char) || 0) + 1);
    while (map.get(char)! > 1) {
      const leftChar = s[left];
      map.set(leftChar, map.get(leftChar)! - 1);
      left++;
    }
    maxLen = Math.max(maxLen, right - left + 1);
  }
  if (maxLen !== 3) throw new Error("assertion failed");
  return maxLen;
}
trackMaxWindow("abcabcbb");
```

## Python Tip

```python
from collections import defaultdict

def track_max_window(s: str) -> int:
    count = defaultdict(int)
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        count[char] += 1
        while count[char] > 1:
            left_char = s[left]
            count[left_char] -= 1
            left += 1
        max_len = max(max_len, right - left + 1)
    assert max_len == 3, "assertion failed"
    return max_len

track_max_window("abcabcbb")
```

## TypeScript Corner

```typescript
function expandWindow(nums: number[], target: number): number {
  let left = 0;
  let currentSum = 0;
  let maxLength = 0;
  for (let right = 0; right < nums.length; right++) {
    currentSum += nums[right];
    while (currentSum > target) {
      currentSum -= nums[left];
      left++;
    }
    maxLength = Math.max(maxLength, right - left + 1);
  }
  if (maxLength !== 3) throw new Error("assertion failed");
  return maxLength;
}
expandWindow([1, 2, 3, 4, 5], 6);
```

## Python Corner

```python
def expand_window(nums: list[int], target: int) -> int:
    left = 0
    current_sum = 0
    max_length = 0
    for right in range(len(nums)):
        current_sum += nums[right]
        while current_sum > target:
            current_sum -= nums[left]
            left += 1
        max_length = max(max_length, right - left + 1)
    assert max_length == 3, "assertion failed"
    return max_length

expand_window([1, 2, 3, 4, 5], 6)
```

## Takeaway

擴展右指標並同步更新視窗狀態，是動態區間問題的關鍵第一步。

## Tomorrow Preview

明天我們將深入探討 Variable-Size Sliding Window 的另一半核心：Shrink Phase（收縮階段），學習如何在違反條件時精準移動左指標以維持最優解。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
