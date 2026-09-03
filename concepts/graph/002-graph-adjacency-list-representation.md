---
id: graph-adjacency-list-representation
title: Graph Adjacency List Representation
module: graph
topic: graph
difficulty: easy
estimated_minutes: 12
pattern_label: Data Representation
complexity_label: O(V + E) / O(V + E)
prerequisite:
  - graph-core-concept-introduction
next:
  - graph-adjacency-matrix-representation
  - graph-dfs-traversal
learning_goal:
  - 在程式碼中使用 adjacency list 表示圖。
exit_criteria:
  - 能從邊的列表成功建立 adjacency list。
leetcode:
  - 133
tags:
  - graph
  - representation
---

## Author Hints

- 核心觀念：An adjacency list maps each vertex to a collection of its neighboring vertices.
- Pattern 辨識線索：Sparse graphs where E is much smaller than V^2.
- Thinking：Use a map or array of lists to store direct connections for each node.
- Common Mistakes：Forgetting to add reverse edges for undirected graphs.
- TypeScript 重點：Map<number, number[]> or Map<string, string[]> is ideal for adjacency lists.
- Python 重點：defaultdict(list) is the standard and most concise tool for adjacency lists.
- 題號 133 為何適合此 Pattern：Requires traversing and cloning a graph represented via adjacency structures.
