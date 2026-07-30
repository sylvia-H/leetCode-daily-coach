---
id: tree-invert-binary-tree
title: Invert Binary Tree
module: tree
topic: tree
difficulty: easy
estimated_minutes: 15
pattern_label: Tree Transformation
complexity_label: O(n) / O(h)
prerequisite:
  - tree-symmetric-tree-check
next: []
learning_goal:
  - Transform a binary tree by swapping left and right children recursively.
exit_criteria:
  - Swap left and right pointers for every node in the binary tree.
leetcode:
  - 226
tags:
  - tree
  - dfs
  - transformation
---

## Author Hints

- 核心觀念：Swap the left and right children of a node, then recursively invert both subtrees.
- Pattern 辨識線索：Modifying or mirroring an entire tree structure in-place.
- Thinking：Base case: null returns null. Swap left and right pointers, then recurse on both children.
- Common Mistakes：Failing to store or reassign swapped references correctly.
- TypeScript 重點：Destructuring assignment makes swapping pointers very clean in modern TS/JS.
- Python 重點：Simultaneous assignment node.left, node.right = node.right, node.left makes swapping trivial.
- 題號 226 為何適合此 Pattern：Classic in-place tree inversion by swapping children.
