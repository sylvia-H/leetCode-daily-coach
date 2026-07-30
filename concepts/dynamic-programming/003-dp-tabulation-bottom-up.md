---
id: dp-tabulation-bottom-up
title: Bottom-Up DP with Tabulation
module: dynamic-programming
topic: dynamic-programming
difficulty: medium
estimated_minutes: 20
pattern_label: Tabulation
complexity_label: O(n) / O(n)
prerequisite:
  - dp-memoization-top-down
next:
  - dp-space-optimization-rolling
  - dp-grid-path-counting
learning_goal:
  - 掌握由底而上建立表格的迭代式動態規劃解法
exit_criteria:
  - 能夠決定表格的維度與初始狀態
  - 能夠正確寫出迴圈順序來填滿表格
leetcode:
  - 70
  - 746
  - 198
tags:
  - tabulation
  - iteration
---

## Author Hints

- 核心觀念：利用迴圈由小到大迭代填入表格，消除遞迴負擔
- Pattern 辨識線索：狀態轉移依賴先前已知的小狀態，且順序明確
- Thinking：建立 DP 陣列 -> 設定 base case -> 依序迭代更新狀態 -> 回傳目標狀態
- Common Mistakes：迴圈邊界條件設定錯誤導致陣列溢位
- TypeScript 重點：宣告明確型別的陣列來儲存狀態
- Python 重點：使用串列生成式快速初始化 DP 表格
- 題號 70 為何適合此 Pattern：以迴圈從小到大計算每一階的方法數
- 題號 746 為何適合此 Pattern：使用最小花費爬樓梯練習狀態轉移與表格填空
- 題號 198 為何適合此 Pattern：使用表格法（Bottom-Up）由底向上迭代計算，完美體現 Tabulation 的精神。
