---
id: bfs-shortest-path-unweighted
title: 未加權圖的最短路徑
module: dfs-bfs
topic: dfs-bfs
difficulty: medium
estimated_minutes: 20
pattern_label: Shortest Path BFS
complexity_label: O(V + E) / O(V)
prerequisite:
  - bfs-queue-level-order
next:
  - matrix-dfs-grid-exploration
learning_goal:
  - 學會利用 BFS 保證首次抵達目標即為最短路徑的特性來求解最短步數
exit_criteria:
  - 能計算從起點到終點的最小邊數或步數
  - 理解為什麼 BFS 在邊權均等時必然找到最短路徑
leetcode:
  - 111
  - 127
tags:
  - bfs
  - shortest-path
  - graph
---

## Author Hints

- 核心觀念：在邊權相同的圖中，BFS 擴散的特性保證第一次到達目標節點時走過的路徑最短。
- Pattern 辨識線索：尋找「最少步數」、「最短距離」且每步消耗均等的題目。
- Thinking：在 Queue 中記錄距離或使用變數記錄當前層數，一旦到達目標即可回傳。
- Common Mistakes：在非最短路徑問題中誤用 DFS 尋找最短距離。
- TypeScript 重點：可以利用物件或額外的 Map 記錄起點到各節點的距離。
- Python 重點：使用字典或 distance 陣列記錄每個節點的訪問距離。
- 題號 111 為何適合此 Pattern：求二元樹的最小深度即是尋找根節點到最近葉子節點的最短路徑。
- 題號 127 為何適合此 Pattern：在未加權的單字圖中使用 BFS 尋找從起點到終點的最短轉換序列長度。
