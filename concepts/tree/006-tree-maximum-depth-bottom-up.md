---
id: tree-maximum-depth-bottom-up
title: Maximum Depth of Binary Tree (Bottom-Up)
module: tree
topic: tree
difficulty: easy
estimated_minutes: 20
pattern_label: Bottom-Up DFS
complexity_label: O(n) / O(h)
prerequisite:
  - tree-dfs-postorder-traversal
next:
  - tree-maximum-depth-top-down
  - tree-balanced-binary-tree-check
  - tree-same-tree-validation
learning_goal:
  - Compute tree depth using a postorder bottom-up recursive strategy.
exit_criteria:
  - Return 1 plus the maximum of left and right subtree depths.
leetcode:
  - 104
tags:
  - tree
  - dfs
  - recursion
---

## Author Hints

- 核心觀念：The depth of a node is 1 plus the maximum depth of its left and right children.
- Pattern 辨識線索：Finding global tree properties by aggregating local subtree results.
- Thinking：Base case: null returns 0. Step: compute left depth, compute right depth, return 1 + max(left, right).
- Common Mistakes：Returning 0 for null instead of correctly handling base cases.
- TypeScript 重點：Keep function pure and concise.
- Python 重點：Leverage built-in max() function with explicit base checks.
- 題號 104 為何適合此 Pattern：Classic bottom-up tree depth calculation.
