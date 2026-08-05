---
id: graph-detect-cycle-directed
title: Graph Detect Cycle in Directed Graph
module: graph
topic: graph
difficulty: medium
estimated_minutes: 15
pattern_label: Cycle Detection
complexity_label: O(V + E) / O(V)
prerequisite:
  - graph-detect-cycle-undirected
next:
  - graph-topological-sort-dfs
learning_goal:
  - >-
    Detect cycles in a directed graph using 3-state coloring or recursion stack
    tracking.
exit_criteria:
  - >-
    Distinguish between globally visited nodes and nodes currently in the
    recursion stack.
leetcode:
  - 207
tags:
  - graph
  - cycle
  - directed
---

## Author Hints

- 核心觀念：A directed graph has a cycle if a DFS hits a node currently present in the current recursion path.
- Pattern 辨識線索：Course schedule or prerequisite validation with directed dependencies.
- Thinking：Use three states: 0 = unvisited, 1 = visiting (in stack), 2 = visited.
- Common Mistakes：Using a simple visited set which fails because cross-edges in directed graphs do not form cycles.
- TypeScript 重點：Use a visiting Set alongside a visited Set, or a numeric status array.
- Python 重點：Maintain a `rec_stack` set or use integer states 0, 1, 2.
- 題號 207 為何適合此 Pattern：Course prerequisite validation requires detecting cycles in a directed graph.
