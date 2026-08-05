---
id: dp-string-lcs-basic
title: Longest Common Subsequence
module: dynamic-programming
topic: dynamic-programming
difficulty: medium
estimated_minutes: 25
pattern_label: Two-Sequence DP
complexity_label: 'O(m*n) / O(min(m, n))'
prerequisite:
  - dp-grid-path-counting
  - dp-knapsack-unbounded
next:
  - dp-string-edit-distance
learning_goal:
  - 掌握處理兩個字串配對的最長共同子序列動態規劃解法
exit_criteria:
  - 能夠在字元相符與不相符時寫出正確的狀態轉移方程式
  - 能夠理解二維字串 DP 的空間滾動優化技巧
leetcode:
  - 1143
  - 583
  - 392
tags:
  - string-dp
  - lcs
---

## Author Hints

- 核心觀念：當字元相符時長度加一加上斜上方狀態，不相符時取上方或左方最大值
- Pattern 辨識線索：給定兩個字串，尋找最長共同子序列或相關相似度
- Thinking：若 s1[i] == s2[j] 則 dp[i][j] = dp[i-1][j-1] + 1，否則 max(dp[i-1][j], dp[i][j-1])
- Common Mistakes：字串索引與 DP 表格大小差 1 導致邊界錯亂
- TypeScript 重點：使用雙行滾動陣列將空間複雜度從 O(m*n) 降至 O(n)
- Python 重點：利用 zip 或雙陣列交替更新狀態
- 題號 1143 為何適合此 Pattern：最長共同子序列的標準題型
- 題號 583 為何適合此 Pattern：兩個字串的刪除操作步數可轉化為 LCS 問題來求解
- 題號 392 為何適合此 Pattern：最簡單的雙序列匹配與子序列判定問題，適合作為 LCS 的入門暖身題。
