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
  - >-
    Understand how a sliding window optimizes subarray problems from O(n^2) to
    O(n) by reusing overlapping computations.
exit_criteria:
  - >-
    Can explain why recalculating every subarray from scratch leads to redundant
    work.
  - >-
    Can trace how adding a new element and dropping an old element updates the
    window state.
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
