---
id: dfs-visited-state-management
title: DFS 已造訪狀態管理
module: dfs-bfs
topic: dfs-bfs
difficulty: easy
estimated_minutes: 15
pattern_label: Visited Tracking
complexity_label: O(V) / O(V)
prerequisite:
  - dfs-recursive-implementation
next:
  - bfs-queue-level-order
  - matrix-dfs-grid-exploration
  - graph-connected-components-count
learning_goal:
  - 學會使用 Hash Set 或布林陣列記錄造訪狀態以防止無限迴圈
exit_criteria:
  - 能在圖形有環的情況下正確使用 visited 陣列或集合
  - 理解在進入節點前與離開節點時標記狀態的時機差異
leetcode:
  - 733
tags:
  - dfs
  - visited
  - graph
---

## Author Hints

- 核心觀念：圖形結構可能包含環，必須透過 visited 狀態追蹤確保每個節點只被處理一次。
- Pattern 辨識線索：題目涉及網格、有向圖或無向圖搜尋時。
- Thinking：在拜訪鄰居之前或剛進入函式時立即將當前節點標記為已造訪。
- Common Mistakes：在將節點加入鄰居清單才標記 visited，導致重複加入佇列或重複遞迴。
- TypeScript 重點：使用 Set<string> 記錄座標或數字 ID 的已造訪狀態。
- Python 重點：使用集合 set() 儲存已造訪的節點或座標 tuple。
- 題號 733 為何適合此 Pattern：著色問題需要精準記錄已填色的像素以免無限迴圈。
