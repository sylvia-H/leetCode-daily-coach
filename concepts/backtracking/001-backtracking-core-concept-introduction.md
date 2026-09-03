---
id: backtracking-core-concept-introduction
title: Backtracking Core Concept Introduction
module: backtracking
topic: backtracking
difficulty: easy
estimated_minutes: 15
pattern_label: Decision Tree Exploration
complexity_label: O(2^n) / O(n)
prerequisite:
  - graph-dfs-traversal
next:
  - backtracking-subset-generation
  - backtracking-permutation-basics
  - backtracking-palindrome-partitioning
  - backtracking-word-search
  - backtracking-n-queens-diagonal-pruning
learning_goal:
  - '理解 Backtracking 如何像在一棵隱含的決策樹上做 DFS 一樣，有系統地探索解空間。'
exit_criteria:
  - '能說明「選擇—探索—撤銷選擇」（choose–explore–unchoose）的模式。'
  - '能追蹤狀態如何被修改與還原。'
leetcode:
  - 78
tags:
  - backtracking
  - recursion
  - dfs
---

## Author Hints

- 核心觀念：Backtracking is an algorithmic technique for solving problems recursively by trying to build a solution incrementally, one piece at a time, removing those solutions that fail to satisfy the constraints of the problem at any point of time.
- Pattern 辨識線索：Look for problems requiring all possible combinations, permutations, or subsets, or finding if any path leads to a valid configuration.
- Thinking：Visualize the problem as a tree where each node represents a partial state, and branches represent valid choices to extend the state.
- Common Mistakes：Forgetting to undo (unchoose) the state change after the recursive call returns, leading to corrupted states for subsequent branches.
- TypeScript 重點：Pass mutable arrays or lists as parameters and ensure you .pop() or slice correctly when backtracking.
- Python 重點：Use list.append() followed by recursion and list.pop() to maintain the path state cleanly.
- 題號 78 為何適合此 Pattern：Subsets require exploring whether to include or exclude each element, forming a classic binary decision tree.
