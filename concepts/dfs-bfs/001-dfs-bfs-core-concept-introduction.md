---
id: dfs-bfs-core-concept-introduction
title: DFS / BFS 核心觀念介紹
module: dfs-bfs
topic: dfs-bfs
difficulty: easy
estimated_minutes: 10
pattern_label: Graph Search Basics
complexity_label: O(V + E) / O(V)
prerequisite:
  - graph-core-concept-introduction
next:
  - dfs-recursive-implementation
  - bfs-queue-level-order
learning_goal:
  - 理解深度優先搜尋與廣度優先搜尋的核心精神與適用情境差異
exit_criteria:
  - 能用自己的話解釋 DFS 與 BFS 的走訪順序差異
  - 能辨識何時該用 DFS 何時該用 BFS
leetcode: []
tags:
  - graph
  - dfs
  - bfs
  - fundamentals
---

## Author Hints

- 核心觀念：DFS 與 BFS 是圖形與樹狀結構走訪的兩大基礎策略，分別模擬盲目深入與層層擴散。
- Pattern 辨識線索：當題目要求遍歷所有節點、尋找路徑或連通塊時，即為圖形搜尋問題。
- Thinking：先思考問題是否具有層級特性（選 BFS）還是需要窮舉所有可能路徑（選 DFS）。
- Common Mistakes：將圖形搜尋與一般陣列線性掃描混淆，忘記處理圖中可能存在的環。
- TypeScript 重點：在 TypeScript 中以介面或鄰接串列表示圖結構。
- Python 重點：在 Python 中使用字典加串列或集合來表示圖的鄰接關係。
