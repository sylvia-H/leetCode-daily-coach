---
id: edge-case-enumeration
title: Edge Case Enumeration
module: programming-mindset
topic: programming-mindset
difficulty: easy
estimated_minutes: 15
pattern_label: Defensive Design
complexity_label: O(1) / O(1)
prerequisite:
  - problem-simplification-strategy
next:
  - spacetime-tradeoff-awareness
  - array-two-pointers-variable
learning_goal:
  - 建立主動窮舉邊界條件的防禦性思維
exit_criteria:
  - 能條列出空值、極大值、重複值與單一元素等邊界測資
leetcode: []
tags:
  - mindset
  - testing
---

## Author Hints

- 核心觀念：Bug 通常藏在正常邏輯之外的邊界角落
- Pattern 辨識線索：當寫完主邏輯準備提交前
- Thinking：思考 0、1、負數、極大陣列、null 等極端輸入
- Common Mistakes：只測驗證了 Happy Path 而忽略其他可能
- TypeScript 重點：善用 optional chaining 與 nullish coalescing 防範未然
- Python 重點：注意 None、空字串與空集合的布林求值特性
