---
id: two-pointer-interval-merging-check
title: Interval Overlap Detection
module: two-pointer
topic: two-pointer
difficulty: medium
estimated_minutes: 15
pattern_label: Two Pointers - Linear Scan & Compare
complexity_label: O(n log n) / O(n)
prerequisite:
  - array-linear-scan
  - two-pointer-boats-to-save-people
next:
  - two-pointer-backspace-string-compare
learning_goal:
  - 學習如何透過排序區間起點來檢查或合併重疊區間
exit_criteria:
  - 能夠根據區間的起點與終點判斷是否有重疊並進行合併
  - 理解排序在區間處理中的關鍵前置作用
leetcode:
  - 56
tags:
  - sorting
  - array
  - intervals
---

## Author Hints

- 核心觀念：依區間起點排序後，透過掃描線或前後比對來合併重疊的區間。
- Pattern 辨識線索：題目涉及時間區間、範圍重疊或會議室排程。
- Thinking：先依 interval[0] 排序；維護一個當前合併區間，若下一個區間的起點小於等於當前區間的終點，則更新終點，否則加入結果集。
- Common Mistakes：忘記在排序時同時考慮區間的起點與終點順序。
- TypeScript 重點：使用陣列的 push 與尾端元素檢視來實作合併堆疊效果。
- Python 重點：Python 中可直接利用串列末尾元素進行比對與修改。
- 題號 56 為何適合此 Pattern：區間合併的基礎核心範例，依賴排序與線性掃描比對。
