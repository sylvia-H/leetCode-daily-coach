---
id: graph-bfs-traversal
title: Graph BFS Traversal
module: graph
topic: graph
difficulty: medium
estimated_minutes: 15
pattern_label: Breadth-First Search
complexity_label: O(V + E) / O(V)
prerequisite:
  - graph-dfs-traversal
next:
  - graph-connected-components
learning_goal:
  - 使用佇列實作 Breadth-First Search，逐層走訪。
exit_criteria:
  - 能使用 BFS 在無權重圖中找出最短路徑。
leetcode:
  - 994
tags:
  - graph
  - bfs
---

## Author Hints

- 核心觀念：Explore neighbors layer by layer using a queue data structure.
- Pattern 辨識線索：Shortest path in unweighted graphs, multi-source spread, level-order exploration.
- Thinking：Enqueue the starting node, pop, process, and push unvisited neighbors.
- Common Mistakes：Marking nodes as visited only upon dequeuing instead of upon enqueuing, causing duplicate work.
- TypeScript 重點：Implement a proper queue instead of shifting arrays to maintain O(1) pops.
- Python 重點：Use collections.deque for efficient O(1) pops from the left.
- 題號 994 為何適合此 Pattern：BFS models simultaneous rotting spread across minutes (levels).
