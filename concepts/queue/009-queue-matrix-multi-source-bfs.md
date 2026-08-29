---
id: queue-matrix-multi-source-bfs
title: Matrix Multi-Source BFS
module: queue
topic: queue
difficulty: medium
estimated_minutes: 20
pattern_label: Multi-Source BFS
complexity_label: O(m * n) / O(m * n)
prerequisite:
  - queue-shortest-path-unweighted
next:
  - queue-sliding-window-maximum
learning_goal:
  - '以多個起點初始化佇列，同時計算從任一來源出發的最短距離。'
exit_criteria:
  - '能在 BFS 迴圈開始前，先把所有起始來源加入佇列。'
  - '能就地（in-place）更新網格值，或改用距離矩陣。'
leetcode:
  - 542
  - 994
tags:
  - queue
  - bfs
  - matrix
---

## Author Hints

- 核心觀念：Seed the queue with all starting nodes at distance 0 so wavefronts expand concurrently.
- Pattern 辨識線索：Problems asking for distance from the nearest 0, rot, or water across a grid.
- Thinking：Push all sources into the queue at once, then run standard BFS expansion.
- Common Mistakes：Running separate BFS from each source instead of starting them simultaneously.
- TypeScript 重點：Queue holds coordinate tuples [r, c].
- Python 重點：Queue holds coordinate tuples (r, c).
- 題號 542 為何適合此 Pattern：Multi-source BFS from all zeros to find nearest distance for each cell.
- 題號 994 為何適合此 Pattern：Rotting oranges spreading simultaneously from all initial rotten oranges.
