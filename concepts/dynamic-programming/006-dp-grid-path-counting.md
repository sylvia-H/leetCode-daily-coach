---
id: dp-grid-path-counting
title: Grid Path Counting
module: dynamic-programming
topic: dynamic-programming
difficulty: medium
estimated_minutes: 20
pattern_label: 2D Grid DP
complexity_label: O(m*n) / O(n)
prerequisite:
  - dp-tabulation-bottom-up
  - dp-linear-robber-pattern
next:
  - dp-grid-minimum-path-sum
  - dp-string-lcs-basic
learning_goal:
  - 學會在二維網格上計算路徑數量的動態規劃方法
exit_criteria:
  - 能夠處理二維網格的邊界初始化（第一列與第一欄）
  - 能夠寫出從上方與左方轉移而來的狀態方程式
leetcode:
  - 62
  - 63
tags:
  - grid-dp
  - matrix
---

## Author Hints

- 核心觀念：到達某個格子的方法數等於從上方格子與左方格子的方法數相加
- Pattern 辨識線索：在矩陣中只能向右或向下移動，求到達終點的方法總數
- Thinking：dp[j] = dp[j] + dp[j-1]（使用一維滾動陣列優化空間）
- Common Mistakes：遇到障礙物時未正確將狀態歸零
- TypeScript 重點：使用一維陣列模擬二維表格來節省記憶體
- Python 重點：利用串列初始化帶有障礙物的網格狀態
- 題號 62 為何適合此 Pattern：獨一無二的路徑數計算，基本二維網格轉移
- 題號 63 為何適合此 Pattern：帶有障礙物的路徑數，需加入條件判斷
