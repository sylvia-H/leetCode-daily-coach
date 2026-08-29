---
id: graph-detect-cycle-undirected
title: Graph Detect Cycle in Undirected Graph
module: graph
topic: graph
difficulty: medium
estimated_minutes: 15
pattern_label: Cycle Detection
complexity_label: O(V + E) / O(V)
prerequisite:
  - graph-connected-components
next:
  - graph-detect-cycle-directed
learning_goal:
  - 使用 DFS 或 BFS 搭配父節點追蹤，偵測無向圖中的環。
exit_criteria:
  - 能辨識是否有已造訪的鄰居不是目前節點的直接父節點。
leetcode:
  - 261
tags:
  - graph
  - cycle
---

## Author Hints

- 核心觀念：In an undirected graph, a cycle exists if you encounter an already visited node that is not your parent.
- Pattern 辨識線索：Checking if a graph is a valid tree (connected and acyclic).
- Thinking：Pass the parent node index into the recursive DFS function.
- Common Mistakes：Treating the edge back to the parent node as a cycle.
- TypeScript 重點：Pass parent parameter in recursive helper functions.
- Python 重點：Keep track of `parent` in DFS arguments.
- 題號 261 為何適合此 Pattern：A graph is a valid tree if it has no cycles and is fully connected.
