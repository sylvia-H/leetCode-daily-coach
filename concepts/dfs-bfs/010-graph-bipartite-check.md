---
id: graph-bipartite-check
title: 二分圖判定
module: dfs-bfs
topic: dfs-bfs
difficulty: medium
estimated_minutes: 20
pattern_label: Bipartite Graph
complexity_label: O(V + E) / O(V)
prerequisite:
  - bfs-queue-level-order
  - graph-cycle-detection-undirected
next: []
learning_goal:
  - 學會使用 BFS 或 DFS 進行著色法（Coloring）判定圖是否為二分圖
exit_criteria:
  - 能用兩種顏色對圖進行交替著色
  - 能理解相鄰節點顏色相同即代表無法構成二分圖
leetcode:
  - 785
  - 886
tags:
  - graph
  - bipartite
  - coloring
---

## Author Hints

- 核心觀念：二分圖可以將節點分成兩組，使得所有邊的兩端點都屬於不同組。透過著色法（0 與 1）若發生衝突則非二分圖。
- Pattern 辨識線索：題目詢問是否能將群體分成兩組、或檢查是否存在奇數長度的環。
- Thinking：對未著色節點賦予顏色，並在其鄰居填入相反顏色，若鄰居已有同色則回傳 false。
- Common Mistakes：忽略非完全連通圖，必須對所有獨立分量都執行著色檢查。
- TypeScript 重點：使用 Map 或數字陣列記錄每個節點的顏色（未著色可設為 -1 或 0）。
- Python 重點：使用字典或陣列紀錄顏色狀態，搭配 BFS 佇列進行逐層擴散檢驗。
- 題號 785 為何適合此 Pattern：判斷給定圖是否為二分圖是標準的著色法應用題。
- 題號 886 為何適合此 Pattern：使用 BFS 進行著色法判定圖是否為二分圖的進階應用題。
