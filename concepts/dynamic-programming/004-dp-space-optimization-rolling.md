---
id: dp-space-optimization-rolling
title: Space Optimization with Rolling Variables
module: dynamic-programming
topic: dynamic-programming
difficulty: medium
estimated_minutes: 20
pattern_label: Space Optimization
complexity_label: O(n) / O(1)
prerequisite:
  - dp-tabulation-bottom-up
next:
  - dp-linear-robber-pattern
learning_goal:
  - 學會利用變數滾動技巧將動態規劃的空間複雜度降至常數級別
exit_criteria:
  - 能夠分析狀態轉移方程式僅需依賴哪幾個過去狀態
  - 能夠以常數個變數取代完整的 DP 表格
leetcode:
  - 70
  - 198
tags:
  - space-optimization
  - rolling-array
---

## Author Hints

- 核心觀念：當前狀態只依賴有限的幾個前置狀態時，不需保留完整陣列
- Pattern 辨識線索：狀態轉移方程式中只出現 i-1, i-2 等固定偏移量
- Thinking：保留前幾個需要的變數，在迴圈中透過指派或交換來推進
- Common Mistakes：更新變數順序錯誤導致覆蓋了尚未使用的舊值
- TypeScript 重點：使用多個變數進行解構賦值以同時更新
- Python 重點：善用 Python 的同時指派 (a, b = b, a + b)
- 題號 70 為何適合此 Pattern：只需要記錄前兩階的數值即可算出當前階數
- 題號 198 為何適合此 Pattern：打家劫舍只需保留前兩間房屋的最大獲利
