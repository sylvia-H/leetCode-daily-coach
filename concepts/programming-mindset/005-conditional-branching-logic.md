---
id: conditional-branching-logic
title: Conditional Branching Logic
module: programming-mindset
topic: programming-mindset
difficulty: easy
estimated_minutes: 15
pattern_label: Decision Table
complexity_label: O(1) / O(1)
prerequisite:
  - tracing-execution-flow
next:
  - loop-invariant-thinking
  - array-two-pointers-opposite
learning_goal:
  - 學會完整覆蓋所有條件分支與互斥情況
exit_criteria:
  - 能寫出沒有遺漏邊界條件的 if-else 邏輯
leetcode: []
tags:
  - mindset
  - logic
---

## Author Hints

- 核心觀念：條件分支必須互相排斥且涵蓋所有可能性
- Pattern 辨識線索：當題目要求根據不同狀態執行不同行為時
- Thinking：優先處理特殊與邊界情況，再處理一般情況
- Common Mistakes：條件重疊導致非預期的分支被提前攔截
- TypeScript 重點：善用 guard clauses 減少巢狀 if
- Python 重點：善用 elif 與早期返回維持程式碼扁平
