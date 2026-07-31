---
id: tracing-execution-flow
title: Tracing Execution Flow
module: programming-mindset
topic: programming-mindset
difficulty: easy
estimated_minutes: 15
pattern_label: Step-by-Step Simulation
complexity_label: O(n) / O(1)
prerequisite:
  - mental-model-variables
next:
  - conditional-branching-logic
  - array-two-pointers-sliding
learning_goal:
  - 掌握手動模擬程式執行流程的能力
exit_criteria:
  - 能利用表格追蹤含有迴圈與條件判斷的小段程式碼
leetcode: []
tags:
  - mindset
  - debugging
---

## Author Hints

- 核心觀念：腦內編譯器與手動Trace是最強大的除錯工具
- Pattern 辨識線索：當程式結果不如預期且不知錯在哪裡時
- Thinking：逐行執行並記錄每個變數的當前快照
- Common Mistakes：跳著讀扣或靠直覺猜測錯誤原因
- TypeScript 重點：利用 console.log 或 debugger 驗證 trace 結果
- Python 重點：利用 print 或 pdb 進行互動式 trace
