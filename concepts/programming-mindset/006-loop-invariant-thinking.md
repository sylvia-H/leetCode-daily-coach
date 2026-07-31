---
id: loop-invariant-thinking
title: Loop Invariant Thinking
module: programming-mindset
topic: programming-mindset
difficulty: medium
estimated_minutes: 20
pattern_label: Invariant
complexity_label: O(n) / O(1)
prerequisite:
  - conditional-branching-logic
next:
  - problem-simplification-strategy
  - array-linear-scan
learning_goal:
  - 理解迴圈不變量，確保重複執行的正確性
exit_criteria:
  - 能說明迴圈開始前、執行中、結束後維持不變的性質
leetcode: []
tags:
  - mindset
  - loops
---

## Author Hints

- 核心觀念：迴圈的本質是透過重複維持某個不變的數學性質直到終點
- Pattern 辨識線索：當需要設計複雜的迴圈或指標移動時
- Thinking：定義每一步都要成立的假設，並確保每次迭代都有推進
- Common Mistakes：寫出無限迴圈或漏掉最後一個元素的處理
- TypeScript 重點：用明確的變數命名來表達迴圈範圍的定義
- Python 重點：注意 range 的左右開閉區間定義
