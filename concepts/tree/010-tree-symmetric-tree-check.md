---
id: tree-symmetric-tree-check
title: Symmetric Tree Check
module: tree
topic: tree
difficulty: easy
estimated_minutes: 20
pattern_label: Mirror Image DFS
complexity_label: O(n) / O(h)
prerequisite:
  - tree-same-tree-validation
next:
  - tree-invert-binary-tree
learning_goal:
  - Validate tree symmetry by comparing mirrored branches recursively.
exit_criteria:
  - 'Compare left subtree''s left with right subtree''s right, and left with right.'
leetcode:
  - 101
tags:
  - tree
  - dfs
  - symmetry
---

## Author Hints

- 核心觀念：A tree is symmetric if its left subtree is a mirror reflection of its right subtree.
- Pattern 辨識線索：Checking if a data structure is symmetric around a center axis.
- Thinking：Write a helper function taking two nodes (t1, t2). Check t1.val == t2.val and mirror recurse (t1.left, t2.right) and (t1.right, t2.left).
- Common Mistakes：Comparing left-to-left and right-to-right instead of crossing them for reflection.
- TypeScript 重點：Pass two parallel pointers down the helper function.
- Python 重點：Use a helper function inside the main method to manage dual node arguments.
- 題號 101 為何適合此 Pattern：Requires comparing left and right branches as mirror images.
