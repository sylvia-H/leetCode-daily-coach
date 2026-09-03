---
id: graph-topological-sort-dfs
title: Graph Topological Sort DFS
module: graph
topic: graph
difficulty: medium
estimated_minutes: 15
pattern_label: Topological Sort
complexity_label: O(V + E) / O(V)
prerequisite:
  - graph-detect-cycle-directed
next:
  - graph-topological-sort-bfs-kahns
learning_goal:
  - 使用後序 DFS 對 DAG 進行拓樸排序。
exit_criteria:
  - 能在造訪完某節點的所有後代後，將該節點前插或推入結果列表。
leetcode:
  - 210
tags:
  - graph
  - topological-sort
---

## Author Hints

- 核心觀念：Post-order DFS traversal naturally orders nodes such that prerequisites appear before dependents when reversed.
- Pattern 辨識線索：Ordering tasks with precedence constraints (DAG).
- Thinking：Run DFS, and upon finishing a node's children, add the node to a stack or list.
- Common Mistakes：Forgetting to check for cycles before or during topological sort.
- TypeScript 重點：Push to an array and reverse it at the end.
- Python 重點：Append to a list and reverse, or insert at index 0.
- 題號 210 為何適合此 Pattern：Produces the exact linear ordering of courses required.
