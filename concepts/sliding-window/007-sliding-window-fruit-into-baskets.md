---
id: sliding-window-fruit-into-baskets
title: Fruit Into Baskets (At Most K Distinct)
module: sliding-window
topic: sliding-window
difficulty: medium
estimated_minutes: 20
pattern_label: Variable Sliding Window + Frequency Map
complexity_label: O(n) / O(k)
prerequisite:
  - sliding-window-longest-substring-no-repeat
  - sliding-window-max-consecutive-ones
next:
  - sliding-window-permutation-in-string
learning_goal:
  - 管理涉及相異類別數量上限的 Sliding Window 限制。
exit_criteria:
  - 能維護元素頻率的 hash map，以追蹤視窗內相異元素的數量。
  - 能從左側收縮視窗，直到相異數量降回允許的上限。
leetcode:
  - 904
tags:
  - sliding-window
  - hash-table
---

## Author Hints

- 核心觀念：Keep expanding the window while the number of distinct fruit types is <= 2, and contract when it exceeds 2.
- Pattern 辨識線索：Finding the longest subarray containing at most k distinct values.
- Thinking：Use a hash map to record counts of each element. When map size exceeds 2, increment left and decrement counts until size is 2.
- Common Mistakes：Forgetting to delete keys from the hash map when their count drops to zero.
- TypeScript 重點：Explicitly delete keys from Map when frequency reaches 0 to check distinct count accurately.
- Python 重點：Check len(freq_map) after decrementing counts and pop zero-count items.
- 題號 904 為何適合此 Pattern：Equivalent to finding the longest subarray with at most 2 distinct integers.
