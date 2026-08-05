---
id: dp-knapsack-unbounded
title: Unbounded Knapsack Pattern
module: dynamic-programming
topic: dynamic-programming
difficulty: medium
estimated_minutes: 20
pattern_label: Unbounded Knapsack
complexity_label: O(N*W) / O(W)
prerequisite:
  - dp-knapsack-01-basic
next:
  - dp-string-lcs-basic
learning_goal:
  - 學會物品可以無限次選取的完全背包問題與正向迴圈技巧
exit_criteria:
  - 能夠辨識物品可重複使用的背包情境
  - 能夠說明為什麼完全背包的一維空間優化需要正向迴圈
leetcode:
  - 322
  - 518
tags:
  - knapsack
  - unbounded-knapsack
---

## Author Hints

- 核心觀念：物品可無限次選取，狀態轉移時依賴已經包含當前物品的較小容量狀態
- Pattern 辨識線索：硬幣或物品數量無限，求湊成目標金額的最少數量或組合數
- Thinking：dp[w] = min(dp[w], dp[w - coin] + 1) 或累加組合數
- Common Mistakes：將 0/1 背包的反向迴圈誤用於完全背包
- TypeScript 重點：使用 Infinity 初始化最小值並在無法到達時保持
- Python 重點：容量迴圈由左至右正向走訪以允許重複選取
- 題號 322 為何適合此 Pattern：零錢兌換硬幣數量無限，是經典的完全背包最少硬幣數問題
- 題號 518 為何適合此 Pattern：零錢兌換 II 求湊成金額的組合總數
