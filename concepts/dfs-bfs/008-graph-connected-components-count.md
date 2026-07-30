---
id: graph-connected-components-count
title: 圖形連通分量計算
module: dfs-bfs
topic: dfs-bfs
difficulty: medium
estimated_minutes: 15
pattern_label: Connected Components
complexity_label: O(V + E) / O(V)
prerequisite:
  - dfs-visited-state-management
  - matrix-bfs-multi-directional
next:
  - graph-cycle-detection-undirected
learning_goal:
  - 學會使用 DFS 或 BFS 統計無向圖或網格中獨立連通塊的數量
exit_criteria:
  - 能寫出外層迴圈配合內部 DFS/BFS 計算連通分量的樣板
  - 理解如何透過計數器追蹤獨立群組
leetcode:
  - 323
tags:
  - graph
  - connected-components
  - dfs
---

## Author Hints

- 核心觀念：透過走訪所有未造訪的節點，每啟動一次全新的 DFS/BFS 就代表發現一個新的連通分量。
- Pattern 辨識線索：詢問「共有幾個獨立群組」、「省份數量」或「島嶼總數」的題目。
- Thinking：外層迴圈遍歷所有節點，若節點未被造訪，計數器加一，並啟動搜尋將該連通塊全部標記。
- Common Mistakes：漏掉孤立節點（degree 為 0）或沒有正確將整塊連通區標記。
- TypeScript 重點：可用 Set 或 boolean 陣列記錄全域造訪狀態。
- Python 重點：利用迴圈依序檢查每個節點是否在 visited 集合中。
- 題號 323 為何適合此 Pattern：計算無向圖中的連通分量數量是此 pattern 的教科書級別應用。
