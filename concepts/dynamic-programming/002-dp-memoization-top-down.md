---
id: dp-memoization-top-down
title: Top-Down DP with Memoization
module: dynamic-programming
topic: dynamic-programming
difficulty: easy
estimated_minutes: 15
pattern_label: Memoization
complexity_label: O(n) / O(n)
prerequisite:
  - dp-core-concept-introduction
next:
  - dp-tabulation-bottom-up
learning_goal:
  - 學會使用記憶化陣列將指數級別的遞迴降為線性時間
exit_criteria:
  - 能夠在遞迴函式中加入快取檢查與更新邏輯
  - 能正確初始化快取陣列的大小與預設值
leetcode:
  - 509
  - 70
tags:
  - memoization
  - recursion
---

## Author Hints

- 核心觀念：自頂向下遞迴搭配快取表，避免重複計算
- Pattern 辨識線索：遞迴樹有大量重複節點且具有最佳子結構
- Thinking：定義函式意義、加入 base case、檢查快取、計算並存入快取
- Common Mistakes：快取陣列初始化錯誤導致存取未定義的值
- TypeScript 重點：利用陣列或物件作為快取紀錄
- Python 重點：使用 @functools.cache 簡化程式碼
- 題號 509 為何適合此 Pattern：可直接套用陣列快取優化費波那契計算
- 題號 70 為何適合此 Pattern：爬樓梯可透過記憶化避免重複走訪相同高度
