---
id: tree-dfs-inorder-traversal
title: DFS Inorder Traversal
module: tree
topic: tree
difficulty: easy
estimated_minutes: 20
pattern_label: Depth-First Search
complexity_label: O(n) / O(h)
prerequisite:
  - tree-dfs-preorder-traversal
next:
  - tree-dfs-postorder-traversal
learning_goal:
  - '熟練適用於 BST 的 Left -> Root -> Right 走訪模式。'
exit_criteria:
  - '能寫出先造訪左子樹、再根節點、再右子樹的遞迴函式。'
leetcode:
  - 94
  - 230
tags:
  - tree
  - dfs
  - inorder
---

## Author Hints

- 核心觀念：Traverse the left subtree, process the root node, and then traverse the right subtree.
- Pattern 辨識線索：When working with Binary Search Trees (BST) to retrieve elements in sorted order.
- Thinking：Traverse left fully, process current node value, then traverse right.
- Common Mistakes：Mixing up the execution order with preorder or postorder.
- TypeScript 重點：Accumulate results in an array passed down or scoped externally.
- Python 重點：Return lists by combining results from left and right recursive calls.
- 題號 94 為何適合此 Pattern：Directly implements standard Inorder traversal.
- 題號 230 為何適合此 Pattern：利用中序遍歷二元搜尋樹會產生遞增序列的特性來尋找第 K 小的元素。
