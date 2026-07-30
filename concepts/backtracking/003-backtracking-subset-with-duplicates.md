---
id: backtracking-subset-with-duplicates
title: Backtracking Subset with Duplicates
module: backtracking
topic: backtracking
difficulty: medium
estimated_minutes: 20
pattern_label: Duplicate Skip Pattern
complexity_label: O(2^n) / O(n)
prerequisite:
  - backtracking-subset-generation
next:
  - backtracking-combination-sum
  - backtracking-combination-sum-ii
  - backtracking-permutation-with-duplicates
learning_goal:
  - >-
    Learn how to sort and skip adjacent duplicate elements at the same recursion
    level to avoid generating duplicate subsets.
exit_criteria:
  - >-
    Can correctly identify when an element is a duplicate within the same tree
    level.
  - Can implement sorting and skipping logic cleanly.
leetcode:
  - 90
tags:
  - backtracking
  - duplicates
---

## Author Hints

- 核心觀念：By sorting the input array first, identical elements are brought adjacent to each other. When iterating through choices at the same level, skip any element that equals the previous element if the previous element was not chosen.
- Pattern 辨識線索：Input array contains duplicates, and the output must not contain duplicate combinations.
- Thinking：Check if i > startIndex and nums[i] == nums[i-1]; if so, skip this branch to prevent redundant exploration.
- Common Mistakes：Skipping duplicates across different recursion depths instead of the same level, which incorrectly suppresses valid valid multi-instance subsets.
- TypeScript 重點：Sort the array numerically using nums.sort((a,b)=>a-b) before starting the backtracking function.
- Python 重點：Sort the list with nums.sort() and apply the conditional skip check inside the loop.
- 題號 90 為何適合此 Pattern：Requires finding all unique subsets from a collection that contains duplicate numbers.
