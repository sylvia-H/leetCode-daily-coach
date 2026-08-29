---
id: graph-connected-components
title: Graph Connected Components
module: graph
topic: graph
difficulty: easy
estimated_minutes: 12
pattern_label: Connected Components
complexity_label: O(V + E) / O(V)
prerequisite:
  - graph-dfs-traversal
  - graph-bfs-traversal
next:
  - graph-detect-cycle-undirected
learning_goal:
  - 計數並找出無向圖中所有的 connected components。
exit_criteria:
  - 能走訪所有節點，對未造訪的節點啟動 DFS/BFS 以計數 components。
leetcode:
  - 323
tags:
  - graph
  - components
---

## Author Hints

- 核心觀念：A connected component is a maximal set of vertices connected by paths.
- Pattern 辨識線索：Count islands, provinces, or independent subnetworks.
- Thinking：Loop through all vertices 0 to n-1; if unvisited, trigger a traversal and increment component count.
- Common Mistakes：Failing to check all vertices, missing isolated nodes with no edges.
- TypeScript 重點：Iterative loop combined with a global visited Set.
- Python 重點：Simple loop checking `if node not in visited:`.
- 題號 323 為何適合此 Pattern：Directly asks to count connected components in an undirected graph.
