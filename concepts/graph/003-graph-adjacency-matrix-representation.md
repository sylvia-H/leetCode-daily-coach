---
id: graph-adjacency-matrix-representation
title: Graph Adjacency Matrix Representation
module: graph
topic: graph
difficulty: easy
estimated_minutes: 10
pattern_label: Data Representation
complexity_label: O(V^2) / O(V^2)
prerequisite:
  - graph-adjacency-list-representation
next:
  - graph-dfs-traversal
learning_goal:
  - Represent a graph using a 2D matrix (adjacency matrix).
exit_criteria:
  - Check edge existence in O(1) time using a matrix.
leetcode: []
tags:
  - graph
  - representation
---

## Author Hints

- 核心觀念：A 2D array where matrix[i][j] indicates whether an edge exists between vertex i and j.
- Pattern 辨識線索：Dense graphs or when O(1) edge lookup is required.
- Thinking：Initialize a V x V grid filled with zeros or infinity, then populate weights or presence flags.
- Common Mistakes：Allocating O(V^2) space for extremely sparse graphs, leading to memory waste.
- TypeScript 重點：Use nested arrays like number[][].
- Python 重點：Use list comprehensions to initialize 2D grids safely without reference aliasing.
