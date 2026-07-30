---
id: dp-string-edit-distance
title: Edit Distance Pattern
module: dynamic-programming
topic: dynamic-programming
difficulty: medium
estimated_minutes: 25
pattern_label: Edit Distance
complexity_label: 'O(m*n) / O(min(m, n))'
prerequisite:
  - dp-string-lcs-basic
next: []
learning_goal:
  - 掌握字串編輯距離的三種操作狀態轉移：插入、刪除與替換
exit_criteria:
  - 能夠寫出同時包含插入、刪除、替換三種決策的狀態轉移方程式
  - 能夠正確初始化空字串轉換為目標字串所需的基礎編輯步數
leetcode:
  - 72
  - 712
tags:
  - string-dp
  - edit-distance
---

## Author Hints

- 核心觀念：字元相符時不需操作，不相符時取插入、刪除、替換三者的最小值加一
- Pattern 辨識線索：要求將一個字串轉換成另一個字串所需的最小操作次數
- Thinking：min(insert, delete, replace) + 1
- Common Mistakes：搞錯各種操作對應到 DP 表格的方向（如插入對應左方，刪除對應上方）
- TypeScript 重點：注意二維陣列邊界初始化時的基礎累加步數
- Python 重點：使用巢狀迴圈或滾動陣列維護最小操作數
- 題號 72 為何適合此 Pattern：經典編輯距離，完美對應三種字串轉換操作
- 題號 712 為何適合此 Pattern：兩個字串的最小 ASCII 刪除和，與編輯距離架構高度相似
