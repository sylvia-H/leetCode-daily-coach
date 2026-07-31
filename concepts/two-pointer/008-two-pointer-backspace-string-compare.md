---
id: two-pointer-backspace-string-compare
title: Backspace String Compare Backward
module: two-pointer
topic: two-pointer
difficulty: easy
estimated_minutes: 15
pattern_label: Two Pointers - Backward Simulation
complexity_label: O(n + m) / O(1)
prerequisite:
  - string-linear-scan
  - two-pointer-interval-merging-check
next:
  - two-pointer-valid-palindrome-ii
learning_goal:
  - 學習如何從字串尾端開始利用雙指標模擬刪除退格操作以達到 O(1) 空間
exit_criteria:
  - '能夠正確利用計數器追蹤遇到的退格字元 # 數量'
  - 掌握從右向左掃描字串並同步比對兩個字串有效字元的技巧
leetcode:
  - 844
tags:
  - two-pointers
  - string
  - simulation
---

## Author Hints

- 核心觀念：從字串尾端往前走，用計數器記錄退格符號帶來的刪除次數，直接定位出下一個有效字元進行比對。
- Pattern 辨識線索：字串比對包含刪除或退格操作，且要求 O(1) 空間複雜度。
- Thinking：設定 i 與 j 分別指向兩字串末端；用 skipI 與 skipJ 記錄尚待刪除的字元數；略過被刪除的字元後比對當前字元是否相同。
- Common Mistakes：計數器沒有正確累加連續的退格符號。
- TypeScript 重點：小心處理指標小於 0 的邊界條件。
- Python 重點：使用倒序 while 迴圈配合條件判斷來實作指標倒退。
- 題號 844 為何適合此 Pattern：反向雙指標模擬退格的經典代表題，不需額外建立 Stack 空間。
