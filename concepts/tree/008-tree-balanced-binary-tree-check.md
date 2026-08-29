---
id: tree-balanced-binary-tree-check
title: Balanced Binary Tree Check
module: tree
topic: tree
difficulty: medium
estimated_minutes: 25
pattern_label: Bottom-Up Validation
complexity_label: O(n) / O(h)
prerequisite:
  - tree-maximum-depth-bottom-up
  - tree-maximum-depth-top-down
next:
  - tree-same-tree-validation
learning_goal:
  - '透過同時回傳高度與布林狀態來最佳化驗證檢查。'
exit_criteria:
  - '能及早偵測不平衡並將失敗向上傳遞，不做多餘的高度計算。'
leetcode:
  - 110
tags:
  - tree
  - dfs
  - validation
---

## Author Hints

- 核心觀念：Check if left and right subtrees are balanced and their height difference is at most 1, returning -1 on failure.
- Pattern 辨識線索：Problems requiring simultaneous property validation and metric calculation to avoid O(n^2) time.
- Thinking：Write a helper that returns height if balanced, or -1 if unbalanced.
- Common Mistakes：Calculating height separately at each node, leading to O(n^2) time complexity.
- TypeScript 重點：Return an object or use sentinel values like -1 to encode both valid height and error status.
- Python 重點：Return tuples like (is_balanced, height) for clean state propagation.
- 題號 110 為何適合此 Pattern：Requires checking height difference across all subtrees efficiently.
