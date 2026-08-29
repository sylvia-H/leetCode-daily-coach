---
id: graph-topological-sort-bfs-kahns
title: Graph Topological Sort BFS (Kahn's Algorithm)
module: graph
topic: graph
difficulty: medium
estimated_minutes: 15
pattern_label: Kahn's Algorithm
complexity_label: O(V + E) / O(V)
prerequisite:
  - graph-topological-sort-dfs
next: []
learning_goal:
  - 使用 in-degree 與佇列實作 Kahn's algorithm 進行拓樸排序。
exit_criteria:
  - 能計算所有節點的 in-degree，將 in-degree 為 0 的節點加入佇列並逐層處理。
leetcode:
  - 207
tags:
  - graph
  - kahns-algorithm
---

## Author Hints

- 核心觀念：Repeatedly remove nodes with zero in-degree and decrement their neighbors' in-degrees.
- Pattern 辨識線索：BFS-based dependency resolution and cycle detection in directed graphs.
- Thinking：Build in-degree array, queue up all 0-degree nodes, and decrement as you traverse.
- Common Mistakes：Failing to verify if the count of visited nodes equals total nodes (indicating a cycle).
- TypeScript 重點：Use an in-degree array and a queue data structure.
- Python 重點：Track in-degrees with a list/dictionary and use deque for the queue.
- 題號 207 為何適合此 Pattern：Kahn's algorithm checks if all nodes can be processed, effectively detecting cycles.
