---
id: dp-knapsack-01-basic
title: 0/1 Knapsack Basic Pattern
module: dynamic-programming
topic: dynamic-programming
difficulty: medium
estimated_minutes: 25
pattern_label: 0/1 Knapsack
complexity_label: O(N*W) / O(W)
prerequisite:
  - dp-linear-robber-pattern
  - dp-grid-minimum-path-sum
next:
  - dp-knapsack-unbounded
learning_goal:
  - 掌握經典 0/1 背包問題的狀態定義與逆向迴圈優化
exit_criteria:
  - 能夠理解每個物品只能選一次的限制下的狀態轉移
  - 能夠解釋為什麼一維空間優化時容量迴圈必須由大到小反向進行
leetcode:
  - 416
  - 494
tags:
  - knapsack
  - subset-sum
---

## Author Hints

- 核心觀念：每個物品面對容量限制只有『放入』與『不放入』兩種選擇
- Pattern 辨識線索：給定一組物品與總容量，判斷能否組成特定目標或求最大價值
- Thinking：dp[w] = max(dp[w], dp[w - weight[i]] + value[i])
- Common Mistakes：一維優化時容量迴圈寫成正向導致物品被重複使用
- TypeScript 重點：使用一維陣列由右至左更新背包容量
- Python 重點：注意背包容量邊界不要小於當前物品重量
- 題號 416 為何適合此 Pattern：分割等和子集可轉化為容量為總和一半的 0/1 背包問題
- 題號 494 為何適合此 Pattern：目標和問題可轉換為尋找特定子集總和的背包變體
