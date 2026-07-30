---
id: mental-model-variables
title: Mental Model of Variables
module: programming-mindset
topic: programming-mindset
difficulty: easy
estimated_minutes: 15
pattern_label: State Tracking
complexity_label: O(1) / O(1)
prerequisite:
  - input-output-contract
next:
  - tracing-execution-flow
  - array-memory-layout
  - linked-list-node-memory-model
  - stack-core-concept-introduction
learning_goal:
  - 建立變數是記憶體容器的正確心智模型
exit_criteria:
  - 能正確畫出變數賦值前後的記憶體指向變化
leetcode: []
tags:
  - mindset
  - memory
---

## Author Hints

- 核心觀念：變數不是數學方程式中的未知數，而是具時序性的狀態記錄器
- Pattern 辨識線索：當需要記錄迴圈中累積的數值或狀態時
- Thinking：追蹤每一次賦值時變數代表的意義是否一致
- Common Mistakes：賦予變數過多重疊的含義導致混淆
- TypeScript 重點：善用 const 減少非必要的可變狀態
- Python 重點：理解 Python 的名稱與物件參考模型
