---
id: graph-dfs-traversal
title: Graph DFS Traversal
module: graph
topic: graph
difficulty: medium
estimated_minutes: 15
pattern_label: Depth-First Search
complexity_label: O(V + E) / O(V)
prerequisite:
  - graph-adjacency-list-representation
  - graph-adjacency-matrix-representation
next:
  - graph-bfs-traversal
  - backtracking-core-concept-introduction
  - backtracking-word-search
  - graph-connected-components
learning_goal:
  - 在圖上實作 Depth-First Search，走訪所有可到達的節點。
exit_criteria:
  - 能使用 visited set 避免在含環的圖上陷入無窮迴圈。
leetcode:
  - 200
tags:
  - graph
  - dfs
---

## Author Hints

- 核心觀念：Explore as deep as possible along each branch before backtracking.
- Pattern 辨識線索：Exhaustive search, finding connected components, or path existence.
- Thinking：Recursively visit neighbors while maintaining a visited state array or set.
- Common Mistakes：Forgetting to mark nodes as visited before recursive calls, causing infinite loops.
- TypeScript 重點：Use a Set<number> to track visited nodes.
- Python 重點：Use a set or boolean list for visited tracking; watch out for recursion depth limits.
- 題號 200 為何適合此 Pattern：DFS allows exploring entire connected components of land in a grid.
