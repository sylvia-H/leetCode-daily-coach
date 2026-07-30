---
id: backtracking-n-queens-diagonal-pruning
title: Backtracking N-Queens Diagonal Pruning
module: backtracking
topic: backtracking
difficulty: medium
estimated_minutes: 25
pattern_label: Constraint Propagation Pattern
complexity_label: O(n!) / O(n)
prerequisite:
  - backtracking-core-concept-introduction
  - backtracking-word-search
next: []
learning_goal:
  - >-
    Understand how to use mathematical relationships (row +/- col) for O(1)
    diagonal conflict checks in constraint satisfaction problems.
exit_criteria:
  - Can formulate column and diagonal tracking sets/arrays.
  - Can place queens row by row with immediate pruning.
leetcode:
  - 51
tags:
  - backtracking
  - matrix
  - constraint-satisfaction
---

## Author Hints

- 核心觀念：Place one queen per row. Use sets or bitmasks to track occupied columns, major diagonals (row - col), and minor diagonals (row + col) to instantly prune invalid placements.
- Pattern 辨識線索：Place multiple non-attacking pieces on a board where row, column, and diagonal conflicts must be avoided.
- Thinking：Iterate through columns for the current row, check if column and diagonals are free, place queen, update sets, and recurse to the next row.
- Common Mistakes：Checking diagonals with slow O(n) loops instead of O(1) mathematical index formulas (row - col and row + col).
- TypeScript 重點：Use Set data structures to store active diagonal and column keys for O(1) lookups.
- Python 重點：Sets or boolean arrays make tracking columns and diagonals efficient and clean.
- 題號 51 為何適合此 Pattern：Classic N-Queens placement problem requiring rigorous constraint tracking across rows, columns, and diagonals.
