---
id: queue-shortest-path-unweighted
title: Queue Shortest Path in Unweighted Graph
module: queue
topic: queue
difficulty: medium
estimated_minutes: 20
pattern_label: Breadth-First Search
complexity_label: O(V + E) / O(V)
prerequisite:
  - queue-bfs-level-order-traversal
next:
  - queue-matrix-multi-source-bfs
learning_goal:
  - '用 BFS 搭配距離追蹤結構，在無權重圖或網格中找出最短路徑。'
exit_criteria:
  - '能追蹤已走訪節點，避免環與重複計算。'
  - '能隨著佇列擴展逐步遞增距離。'
leetcode:
  - 111
  - 934
tags:
  - queue
  - bfs
  - shortest-path
---

## Author Hints

- 核心觀念：BFS guarantees that the first time a node is reached, it is via the shortest path in unweighted graphs.
- Pattern 辨識線索：Find minimum steps or shortest path in a grid or unweighted graph.
- Thinking：Enqueue starting node, mark visited, then expand neighbors level by level while tracking distance.
- Common Mistakes：Forgetting to mark nodes as visited immediately upon adding to queue, causing duplicate processing.
- TypeScript 重點：Use a Set or boolean grid for visited tracking.
- Python 重點：Use a visited set to store coordinates or node IDs.
- 題號 111 為何適合此 Pattern：Minimum depth of binary tree is shortest path from root to leaf.
- 題號 934 為何適合此 Pattern：Shortest bridge between two islands using BFS expansion.
