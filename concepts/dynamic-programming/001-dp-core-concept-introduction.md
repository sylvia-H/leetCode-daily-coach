---
id: dp-core-concept-introduction
title: Dynamic Programming Core Concept Introduction
module: dynamic-programming
topic: dynamic-programming
difficulty: easy
estimated_minutes: 15
pattern_label: Overlapping Subproblems
complexity_label: O(n) / O(n)
prerequisite:
  - computational-thinking-basics
next:
  - dp-memoization-top-down
learning_goal:
  - 理解動態規劃如何透過儲存重複子問題的解來優化效能
exit_criteria:
  - 能夠辨識何時遞迴呼叫存在重複計算
  - 能夠手動畫出呼叫樹並找出重疊
leetcode:
  - 509
  - 70
tags:
  - dynamic-programming
  - recursion
---

## Author Hints

- 核心觀念：動態規劃是將大問題拆解為重疊子問題並記憶化結果的技巧
- Pattern 辨識線索：當看到題目要求求出第 n 項或最佳解且可用遞迴表達時
- Thinking：先寫出純遞迴解，觀察其重複計算的子問題
- Common Mistakes：混淆遞迴的終止條件與狀態轉移方程式
- TypeScript 重點：使用 Map 或陣列來儲存已經計算過的狀態
- Python 重點：善用 lru_cache 裝飾器來自動化記憶化過程
- 題號 509 為何適合此 Pattern：費波那契數列是展示重複子問題的最佳範例
- 題號 70 為何適合此 Pattern：爬樓梯問題展現了如何將問題拆解為前兩項的組合
