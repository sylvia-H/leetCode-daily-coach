---
id: matrix-dfs-grid-exploration
title: 二維網格的 DFS 探索
module: dfs-bfs
topic: dfs-bfs
difficulty: medium
estimated_minutes: 20
pattern_label: Grid DFS
complexity_label: O(R * C) / O(R * C)
prerequisite:
  - dfs-visited-state-management
  - bfs-shortest-path-unweighted
next:
  - matrix-bfs-multi-directional
learning_goal:
  - 掌握在二維矩陣（Grid）中使用方向陣列（Direction Array）進行上下左右 DFS 搜尋
exit_criteria:
  - '能利用方向陣列（dx, dy）簡化網格鄰居的尋找'
  - 能正確處理網格邊界檢查（Boundary Check）
leetcode:
  - 695
  - 463
tags:
  - dfs
  - matrix
  - grid
---

## Author Hints

- 核心觀念：二維矩陣可以視為隱式圖，透過方向陣列 [-1,0,1,0] 與 [0,1,0,-1] 走訪相鄰格子。
- Pattern 辨識線索：題目給定地圖、矩陣、島嶼或網格，要求計算連通區域或區域大小。
- Thinking：設計遞迴函式接收 (r, c)，先檢查邊界與是否造訪，再向四個方向遞迴。
- Common Mistakes：忘記檢查陣列越界（Row/Col out of bounds）導致 Runtime Error。
- TypeScript 重點：善用常數陣列定義方向以維持程式碼簡潔。
- Python 重點：Python 中可直接用迴圈走訪 directions = [(-1,0), (1,0), (0,-1), (0,1)]。
- 題號 695 為何適合此 Pattern：島嶼的最大面積需要透過 DFS 遍歷每個連通區塊並累加計數。
- 題號 463 為何適合此 Pattern：使用遞迴 DFS 在二維網格上探訪相鄰的陸地格子以計算周長。
