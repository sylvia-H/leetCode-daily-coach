---
id: tree-binary-tree-node-representation
title: Binary Tree Node Representation
module: tree
topic: tree
difficulty: easy
estimated_minutes: 15
pattern_label: Binary Tree Node
complexity_label: O(1) / O(1)
prerequisite:
  - tree-core-concept-introduction
next:
  - tree-dfs-preorder-traversal
learning_goal:
  - '實作含 value、left、right 指標的二元樹節點結構。'
exit_criteria:
  - '能在程式碼中成功建立二元樹節點並指定子節點指標。'
leetcode: []
tags:
  - tree
  - binary-tree
---

## Author Hints

- 核心觀念：A binary tree node restricts every node to having at most two children, traditionally named left and right.
- Pattern 辨識線索：Any problem statement referencing left and right subtrees.
- Thinking：Create a class or interface with a val property, a left reference, and a right reference.
- Common Mistakes：Forgetting to initialize left and right to null/None.
- TypeScript 重點：class TreeNode { val: number; left: TreeNode | null; right: TreeNode | null; ... }
- Python 重點：class TreeNode: def __init__(self, val=0, left=None, right=None): ...
