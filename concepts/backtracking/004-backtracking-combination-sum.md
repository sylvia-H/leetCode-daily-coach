---
id: backtracking-combination-sum
title: Backtracking Combination Sum
module: backtracking
topic: backtracking
difficulty: medium
estimated_minutes: 20
pattern_label: Reusable Elements Sum Pattern
complexity_label: O(2^(t/min)) / O(t/min)
prerequisite:
  - backtracking-subset-generation
  - backtracking-subset-with-duplicates
next:
  - backtracking-combination-sum-ii
learning_goal:
  - '理解如何處理元素可以無限次重複使用以湊出目標總和的問題。'
exit_criteria:
  - '能在遞迴過程中管理目標值的扣減。'
  - '能把當前索引原樣傳回遞迴呼叫，以允許元素重複使用。'
leetcode:
  - 39
tags:
  - backtracking
  - combinations
---

## Author Hints

- 核心觀念：Subtract the chosen element from the target sum and permit the next recursive step to reuse the same index if elements can be repeated.
- Pattern 辨識線索：Find combinations that sum up to a specific target where candidate elements can be used multiple times.
- Thinking：When choosing element at index i, pass i (instead of i + 1) in the next recursive call to allow unlimited reuse.
- Common Mistakes：Failing to establish a base case for when the remaining target becomes negative, leading to infinite recursion or TLE.
- TypeScript 重點：Check target < 0 as an early pruning condition to optimize execution speed.
- Python 重點：Keep track of remaining target and stop exploring further down when remaining < 0.
- 題號 39 為何適合此 Pattern：Core combination sum problem where numbers can be chosen indefinitely until the target is met.
