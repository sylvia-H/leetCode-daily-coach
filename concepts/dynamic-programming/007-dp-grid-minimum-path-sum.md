---
id: dp-grid-minimum-path-sum
title: Grid Minimum Path Sum
module: dynamic-programming
topic: dynamic-programming
difficulty: medium
estimated_minutes: 20
pattern_label: Optimization Grid DP
complexity_label: O(m*n) / O(n)
prerequisite:
  - dp-grid-path-counting
next:
  - dp-knapsack-01-basic
learning_goal:
  - 學會在網格中尋找具有最小或最大總和路徑的動態規劃技巧
exit_criteria:
  - 能夠結合格子的權重與前置狀態的極值
  - 能正確處理第一列與第一欄的累積總和初始化
leetcode:
  - 64
  - 120
tags:
  - grid-dp
  - path-sum
---

## Author Hints

- 核心觀念：到達當前格子的最小路徑和等於當前權重加上左方或上方取較小者
- Pattern 辨識線索：在二維矩陣中移動並尋找權重總和極值
- Thinking：dp[j] = grid[i][j] + min(dp[j], dp[j-1])
- Common Mistakes：邊界初始化的累積加總方向搞錯
- TypeScript 重點：確保在一維滾動時正確更新邊界值
- Python 重點：利用原地修改 grid 或使用一維陣列更新
- 題號 64 為何適合此 Pattern：尋找左上到右下的最小路徑和
- 題號 120 為何適合此 Pattern：三角形最小路徑和，變體網格動態規劃
