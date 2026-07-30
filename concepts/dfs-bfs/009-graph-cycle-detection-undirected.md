---
id: graph-cycle-detection-undirected
title: 無向圖環路偵測
module: dfs-bfs
topic: dfs-bfs
difficulty: medium
estimated_minutes: 20
pattern_label: Cycle Detection
complexity_label: O(V + E) / O(V)
prerequisite:
  - graph-connected-components-count
next:
  - graph-bipartite-check
learning_goal:
  - 掌握在無向圖中利用 DFS 傳遞父節點資訊來偵測環的存在
exit_criteria:
  - 能理解無向圖中遇到已造訪鄰居且該鄰居不是父節點即代表有環
  - 能寫出帶有 parent 參數的 DFS 偵測函式
leetcode:
  - 261
tags:
  - graph
  - cycle-detection
  - dfs
---

## Author Hints

- 核心觀念：在無向圖搜尋時，若遇到一個已造訪過的鄰居，且它不是當前節點的來源（父節點），則代表圖中存在環。
- Pattern 辨識線索：題目要求判斷圖是否為一棵樹（Tree 必須是無環且連通）。
- Thinking：DFS 函式帶入 current 與 parent，遍歷鄰居時若鄰居已造訪且不等同 parent，則偵測到環。
- Common Mistakes：忘記排除從父節點回來的邊，誤將其判定為環。
- TypeScript 重點：使用遞迴傳遞 parent 變數（可用數字或 null）。
- Python 重點：在遞迴呼叫中傳入 parent 參數進行狀態比對。
- 題號 261 為何適合此 Pattern：判定有效圖是否為樹需要同時檢查連通性與無環特性。
