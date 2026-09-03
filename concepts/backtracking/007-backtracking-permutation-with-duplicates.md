---
id: backtracking-permutation-with-duplicates
title: Backtracking Permutation with Duplicates
module: backtracking
topic: backtracking
difficulty: medium
estimated_minutes: 20
pattern_label: Visited-Aware Duplicate Skipping
complexity_label: O(n!) / O(n)
prerequisite:
  - backtracking-permutation-basics
  - backtracking-subset-with-duplicates
next:
  - backtracking-palindrome-partitioning
learning_goal:
  - '熟練在輸入陣列含有重複元素時生成不重複的排列。'
exit_criteria:
  - '能對排列同時套用 visited 追蹤與條件式的重複跳過。'
  - '能防止產生重複的排列分支。'
leetcode:
  - 47
tags:
  - backtracking
  - permutations
---

## Author Hints

- 核心觀念：Sort the array and skip duplicate elements by checking if the previous identical element was already visited or used in the current configuration cycle.
- Pattern 辨識線索：Generate all unique permutations from an array with duplicate numbers.
- Thinking：Skip nums[i] if nums[i] == nums[i-1] and visited[i-1] is false (meaning the previous identical element was just left behind at this level).
- Common Mistakes：Confusing the subset duplicate skip rule with the permutation duplicate skip rule.
- TypeScript 重點：Carefully check visited[i-1] status alongside value equality during the loop.
- Python 重點：Sorted input plus `if i > 0 and nums[i] == nums[i-1] and not visited[i-1]: continue` handles uniqueness correctly.
- 題號 47 為何適合此 Pattern：Requires generating unique permutations when duplicate values exist in the input array.
