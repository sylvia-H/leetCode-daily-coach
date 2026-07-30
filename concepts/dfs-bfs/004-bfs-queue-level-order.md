---
id: bfs-queue-level-order
title: BFS 與佇列層級走訪
module: dfs-bfs
topic: dfs-bfs
difficulty: easy
estimated_minutes: 15
pattern_label: BFS Queue
complexity_label: O(V + E) / O(V)
prerequisite:
  - dfs-bfs-core-concept-introduction
  - dfs-visited-state-management
next:
  - bfs-shortest-path-unweighted
  - matrix-bfs-multi-directional
  - graph-bipartite-check
learning_goal:
  - 掌握使用 Queue 資料結構實現廣度優先搜尋的標準樣板
exit_criteria:
  - 能用 Queue 寫出逐層向外擴散的 BFS 迴圈
  - 理解先進先出（FIFO）在層級搜尋中的角色
leetcode:
  - 102
tags:
  - bfs
  - queue
  - tree
---

## Author Hints

- 核心觀念：使用 Queue 顯式管理待處理節點，確保近的節點優先於遠的節點被處理。
- Pattern 辨識線索：題目要求按層級（Level-order）處理或尋找最短路徑。
- Thinking：初始化 Queue，將起點放入，迴圈直到 Queue 為空，每次取出並將所有未造訪鄰居入隊。
- Common Mistakes：混淆 Queue 的先進先出與 Stack 的後進先出特性。
- TypeScript 重點：JavaScript 中若使用陣列的 shift() 效能較差，大型圖應實作簡單的 Queue 或使用指標。
- Python 重點：Python 使用 collections.deque 提供 O(1) 的 popleft 操作。
- 題號 102 為何適合此 Pattern：二元樹層序走訪是標準的 BFS 應用，需按層收集節點。
