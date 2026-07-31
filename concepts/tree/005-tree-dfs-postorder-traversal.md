---
id: tree-dfs-postorder-traversal
title: DFS Postorder Traversal
module: tree
topic: tree
difficulty: easy
estimated_minutes: 20
pattern_label: Depth-First Search
complexity_label: O(n) / O(h)
prerequisite:
  - tree-dfs-inorder-traversal
next:
  - tree-maximum-depth-bottom-up
learning_goal:
  - >-
    Master the Left -> Right -> Root traversal pattern for bottom-up
    aggregation.
exit_criteria:
  - >-
    Write a recursive function that visits left and right subtrees before
    processing the root.
leetcode:
  - 145
  - 1245
tags:
  - tree
  - dfs
  - postorder
---

## Author Hints

- 核心觀念：Traverse both left and right subtrees completely before processing the root node.
- Pattern 辨識線索：When parent computations depend on results computed from children (bottom-up approach).
- Thinking：Recurse left, recurse right, then perform operation on the current node.
- Common Mistakes：Accessing node values before children have returned their computed states.
- TypeScript 重點：Ideal for clean cleanup tasks or computing node heights/sizes.
- Python 重點：Great for recursive destruction or aggregating child metrics.
- 題號 145 為何適合此 Pattern：Directly evaluates standard Postorder traversal.
- 題號 1245 為何適合此 Pattern：利用後序遍歷自底向上收集子樹資訊來計算樹的直徑。
