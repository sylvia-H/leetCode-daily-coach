---
id: sliding-window-concept-intro
title: Sliding Window Core Concept
module: sliding-window
topic: sliding-window
difficulty: easy
estimated_minutes: 15
pattern_label: Sliding Window
complexity_label: O(n) / O(1)
prerequisite:
  - array-linear-scan
next:
  - sliding-window-fixed-size
learning_goal:
  - 理解 Sliding Window 如何藉由重用重疊的計算，將 subarray 問題從 O(n^2) 最佳化到 O(n)。
exit_criteria:
  - 能說明為何每個 subarray 都從頭重新計算會導致重複的工作。
  - 能追蹤加入新元素與移除舊元素如何更新視窗狀態。
leetcode: []
tags:
  - sliding-window
  - array
  - fundamentals
---

## Author Hints

- 核心觀念：Instead of recomputing the entire window from scratch, slide the window by adding the incoming element and removing the outgoing element.
- Pattern 辨識線索：Continuous subarray or substring problems where moving the boundary by one step overlaps heavily with the previous computation.
- Thinking：Identify what state needs to be maintained, and how the state transitions when the left and right pointers shift.
- Common Mistakes：Forgetting to remove the outgoing element's contribution from the running state.
- TypeScript 重點：Use simple number variables or typed arrays to track running sums or frequencies.
- Python 重點：Accumulate values directly using basic arithmetic or collections.
