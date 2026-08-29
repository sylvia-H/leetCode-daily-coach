---
id: tree-dfs-preorder-traversal
title: DFS Preorder Traversal
module: tree
topic: tree
difficulty: easy
estimated_minutes: 20
pattern_label: Depth-First Search
complexity_label: O(n) / O(h)
prerequisite:
  - tree-binary-tree-node-representation
next:
  - tree-dfs-inorder-traversal
learning_goal:
  - '熟練運用遞迴實作 Root -> Left -> Right 的走訪模式。'
exit_criteria:
  - '能寫出先造訪當前節點、再左子樹、再右子樹的遞迴函式。'
leetcode:
  - 144
  - 114
tags:
  - tree
  - dfs
  - preorder
---

## Author Hints

- 核心觀念：Visit the root node first before recursively traversing its left and right subtrees.
- Pattern 辨識線索：Problems where actions must be taken on the parent before processing children.
- Thinking：Base case: if node is null, return. Recursive step: process node, traverse left, traverse right.
- Common Mistakes：Forgetting the base case leading to stack overflow.
- TypeScript 重點：Handle null checks cleanly with optional chaining or explicit guards.
- Python 重點：Use helper functions or default list arguments carefully to collect results.
- 題號 144 為何適合此 Pattern：Directly evaluates the standard Preorder traversal order.
- 題號 114 為何適合此 Pattern：使用前序遍歷的概念將二元樹原地展開為鏈結串列。
