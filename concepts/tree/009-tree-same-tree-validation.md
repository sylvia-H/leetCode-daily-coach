---
id: tree-same-tree-validation
title: Same Tree Validation
module: tree
topic: tree
difficulty: easy
estimated_minutes: 15
pattern_label: Parallel Tree Traversal
complexity_label: O(n) / O(h)
prerequisite:
  - tree-maximum-depth-bottom-up
  - tree-balanced-binary-tree-check
next:
  - tree-symmetric-tree-check
learning_goal:
  - Compare two binary trees structurally and by value simultaneously.
exit_criteria:
  - >-
    Return true if two trees are identical in structure and node values, false
    otherwise.
leetcode:
  - 100
tags:
  - tree
  - dfs
  - comparison
---

## Author Hints

- 核心觀念：Recursively check if current roots match and their respective left and right subtrees match in parallel.
- Pattern 辨識線索：Comparing two separate tree structures node by node.
- Thinking：Base cases: both null (true), one null (false), values unequal (false). Recurse on left and right.
- Common Mistakes：Not checking null conditions properly before accessing .val.
- TypeScript 重點：Handle null guards cleanly to prevent runtime exceptions.
- Python 重點：Logical 'and' combines results of structural and value checks.
- 題號 100 為何適合此 Pattern：Direct structural and value comparison of two binary trees.
