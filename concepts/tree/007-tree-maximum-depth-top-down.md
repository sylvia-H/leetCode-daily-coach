---
id: tree-maximum-depth-top-down
title: Maximum Depth of Binary Tree (Top-Down)
module: tree
topic: tree
difficulty: medium
estimated_minutes: 20
pattern_label: Top-Down DFS (Accumulator)
complexity_label: O(n) / O(h)
prerequisite:
  - tree-maximum-depth-bottom-up
next:
  - tree-balanced-binary-tree-check
learning_goal:
  - Pass accumulated state down the recursive tree paths (top-down approach).
exit_criteria:
  - Maintain and update a global or passed-down depth counter during traversal.
leetcode:
  - 104
tags:
  - tree
  - dfs
  - top-down
---

## Author Hints

- 核心觀念：Carry the current depth down as an argument and update a global answer upon reaching leaves.
- Pattern 辨識線索：When state must be accumulated from root down to leaves rather than returned upwards.
- Thinking：Pass (node, current_depth) to helper; update max_depth when node is a leaf.
- Common Mistakes：Confusing top-down parameter passing with bottom-up return values.
- TypeScript 重點：Use a helper function or closure to track state across recursive calls.
- Python 重點：Nonlocal variables or helper functions help track running maximums.
- 題號 104 為何適合此 Pattern：Can be solved by passing depth downward and tracking the maximum.
