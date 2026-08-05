---
id: error-driven-refinement
title: Error-Driven Refinement
module: programming-mindset
topic: programming-mindset
difficulty: easy
estimated_minutes: 15
pattern_label: Iterative Debugging
complexity_label: O(1) / O(1)
prerequisite:
  - spacetime-tradeoff-awareness
next:
  - array-move-zeroes
learning_goal:
  - 將編譯錯誤與測資失敗視為指引方向的燈塔而非挫折
exit_criteria:
  - 能從錯誤訊息或失敗測資中精準定位問題根源並修正
leetcode: []
tags:
  - mindset
  - resilience
---

## Author Hints

- 核心觀念：錯誤訊息是系統給你的精準提示，學會解讀它就能加速成長
- Pattern 辨識線索：當程式碼報錯或 LeetCode 顯示 Wrong Answer 時
- Thinking：冷靜分析失敗的測資，找出心智模型與現實的落差
- Common Mistakes：瞎猜亂改程式碼直到碰運氣通過
- TypeScript 重點：善用 TypeScript 型別錯誤來釐清架構盲點
- Python 重點：看懂 Traceback 的呼叫堆疊順序
