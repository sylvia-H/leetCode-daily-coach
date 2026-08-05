---
id: matrix-bfs-multi-directional
title: 二維網格的 BFS 擴散
module: dfs-bfs
topic: dfs-bfs
difficulty: medium
estimated_minutes: 20
pattern_label: Grid BFS
complexity_label: O(R * C) / O(R * C)
prerequisite:
  - bfs-queue-level-order
  - matrix-dfs-grid-exploration
next:
  - graph-connected-components-count
learning_goal:
  - 學會在網格中使用 BFS 模擬波紋擴散或多起點同步擴散過程
exit_criteria:
  - 能使用 Queue 在網格中進行多方向的廣度優先擴散
  - 能處理多源起點同時開始的擴散問題
leetcode:
  - 994
tags:
  - bfs
  - matrix
  - grid
---

## Author Hints

- 核心觀念：多個起點可以同時放入 Queue 中，透過 BFS 一層層向外同步擴散求解全域時間或距離。
- Pattern 辨識線索：題目涉及腐爛擴散、水流蔓延、最近障礙物距離等同步擴散情境。
- Thinking：將所有初始狀態的格子先加入 Queue，再進行標準的 Queue 層級處理。
- Common Mistakes：逐個起點分別做 BFS 導致時間複雜度過高，應採用多源同時入隊。
- TypeScript 重點：使用序列化座標字串（如 `${r},${c}`）或二維陣列記錄狀態。
- Python 重點：使用 collections.deque 儲存多個座標 tuple。
- 題號 994 為何適合此 Pattern：腐爛的橘子需要多個腐爛源同時向外擴散，計算所有橘子腐爛所需的最小分鐘數。
