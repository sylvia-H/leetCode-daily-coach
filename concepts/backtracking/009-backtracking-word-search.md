---
id: backtracking-word-search
title: Backtracking Word Search
module: backtracking
topic: backtracking
difficulty: medium
estimated_minutes: 20
pattern_label: Grid DFS Pathfinding
complexity_label: O(N * 3^L) / O(L)
prerequisite:
  - backtracking-core-concept-introduction
  - graph-dfs-traversal
  - backtracking-palindrome-partitioning
next:
  - backtracking-n-queens-diagonal-pruning
learning_goal:
  - >-
    Apply backtracking to a 2D grid to search for a sequence of characters
    matching a target word.
exit_criteria:
  - Can traverse 4-directional grid neighbors recursively.
  - >-
    Can temporarily mark visited cells in-place and restore them after
    exploration.
leetcode:
  - 79
tags:
  - backtracking
  - matrix
  - dfs
---

## Author Hints

- 核心觀念：Start DFS from every cell in the grid that matches the first letter of the word, exploring 4 directions while matching characters and avoiding revisiting cells in the current path.
- Pattern 辨識線索：Find if a word exists in an m x n grid of characters with sequential adjacent steps.
- Thinking：Temporarily mutate grid cell to a special character (e.g., '#') to mark visited, recurse to 4 neighbors, then restore the original character.
- Common Mistakes：Forgetting to restore the grid cell state after recursion, which breaks paths originating from other starting cells.
- TypeScript 重點：Handle bounds checking (row < 0, col < 0, etc.) cleanly before inspecting grid cells.
- Python 重點：In-place modification of board[r][c] is efficient; ensure restoration in a finally block or explicit unsetting.
- 題號 79 為何適合此 Pattern：Requires 2D grid traversal with state restoration to match a sequential target string.
