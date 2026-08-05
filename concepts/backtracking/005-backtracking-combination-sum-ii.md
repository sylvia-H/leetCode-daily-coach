---
id: backtracking-combination-sum-ii
title: Backtracking Combination Sum II
module: backtracking
topic: backtracking
difficulty: medium
estimated_minutes: 20
pattern_label: Unique Combination Sum Pattern
complexity_label: O(2^n) / O(n)
prerequisite:
  - backtracking-combination-sum
  - backtracking-subset-with-duplicates
next:
  - backtracking-permutation-basics
learning_goal:
  - >-
    Combine target-sum tracking with duplicate skipping when elements can only
    be used once.
exit_criteria:
  - 'Can combine sorting, level-skip duplicate checks, and target subtraction.'
  - Can ensure each combination is unique.
leetcode:
  - 40
tags:
  - backtracking
  - combinations
---

## Author Hints

- 核心觀念：Each number in candidates may only be used once in the combination, and duplicates must be avoided using level-skip logic on sorted input.
- Pattern 辨識線索：Find unique combinations summing to target with a collection that contains duplicates and single-use constraints.
- Thinking：Sort input, advance index by +1 in recursive calls, and skip adjacent duplicate elements at the same recursion level.
- Common Mistakes：Mixing up the reuse rule from Combination Sum I; here index must advance to i + 1.
- TypeScript 重點：Combine index advancement (i + 1) with the duplicate check if (i > start && nums[i] === nums[i-1]) continue.
- Python 重點：Use sorted arrays and standard loop-based iteration with index + 1 and duplicate pruning.
- 題號 40 為何適合此 Pattern：Requires finding unique combinations from duplicate elements with single-use constraints.
