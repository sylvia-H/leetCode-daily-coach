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
  - Detect cycles in an undirected graph using DFS or BFS with parent tracking.
exit_criteria:
  - >-
    Identify if any visited neighbor is not the direct parent of the current
    node.
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
