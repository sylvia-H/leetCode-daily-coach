---
id: dfs-recursive-implementation
title: 遞迴式 DFS 實作
module: dfs-bfs
topic: dfs-bfs
difficulty: easy
estimated_minutes: 15
pattern_label: DFS Recursive
complexity_label: O(V + E) / O(V)
prerequisite:
  - dfs-bfs-core-concept-introduction
next:
  - dfs-visited-state-management
learning_goal:
  - 掌握利用程式語言呼叫堆疊實作遞迴式 DFS 的技巧
exit_criteria:
  - 能寫出標準的遞迴式 DFS 結構
  - 理解遞迴基底條件與遞迴呼叫的關係
leetcode:
  - 200
  - 104
tags:
  - dfs
  - recursion
  - graph
---

## Author Hints

- 核心觀念：利用函式呼叫堆疊（Call Stack）隱式維護走訪狀態，一路深入直到無路可走再回溯。
- Pattern 辨識線索：結構本身具備遞迴性質或需要深度探索到底的題目。
- Thinking：定義遞迴函式：傳入當前節點，處理當前節點，並對所有未造訪的鄰居呼叫遞迴。
- Common Mistakes：忘記設定終止條件或沒有正確記錄已造訪節點導致無限遞迴。
- TypeScript 重點：注意 JavaScript/TypeScript 的最大呼叫堆疊限制，避免過深遞迴造成 Stack Overflow。
- Python 重點：Python 預設的遞迴深度限制較小，必要時可用 sys.setrecursionlimit。
- 題號 200 為何適合此 Pattern：島嶼數量問題可完美利用遞迴 DFS 尋找並標記相連的陸地。
- 題號 104 為何適合此 Pattern：透過遞迴直接走訪二元樹的左右子樹，是學習基礎 DFS 遞迴實作的經典入門題。
