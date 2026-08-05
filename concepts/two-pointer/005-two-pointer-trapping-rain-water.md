---
id: two-pointer-trapping-rain-water
title: Trapping Rain Water Optimization
module: two-pointer
topic: two-pointer
difficulty: medium
estimated_minutes: 25
pattern_label: Two Pointers - Boundary Tracking
complexity_label: O(n) / O(1)
prerequisite:
  - two-pointer-container-water
next:
  - two-pointer-boats-to-save-people
learning_goal:
  - 掌握利用左右雙指標動態維護左右兩側最大高度來計算雨水收集量的技巧
exit_criteria:
  - 能夠推導出為何只要較低側有最大高度保證，即可直接計算當前格子的積水量
  - 理解 O(1) 空間複雜度的雙指標解法相較於 Prefix Max 陣列的優勢
leetcode:
  - 42
tags:
  - two-pointers
  - array
  - stack
---

## Author Hints

- 核心觀念：利用左右雙指標與各自歷史最大高度 (leftMax, rightMax)，動態決定較低一側的積水並向內推進。
- Pattern 辨識線索：計算不規則高度柱子之間可以積蓄多少雨水。
- Thinking：維持 left, right, leftMax, rightMax；若 leftMax < rightMax，則代表左側較低，左側當前格子的積水量取決於 leftMax，更新後 left++，反之亦然。
- Common Mistakes：混淆當前高度與歷史最大高度的比較關係。
- TypeScript 重點：在迴圈中透過條件判斷即時更新 max 變數再累積總量。
- Python 重點：雙指標交替推進時注意迴圈終止條件是 left <= right。
- 題號 42 為何適合此 Pattern：透過雙指標動態追蹤左右極值的經典高階題型。
