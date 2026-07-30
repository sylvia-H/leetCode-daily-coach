---
id: string-sliding-window-variable
title: Variable-Size Sliding Window on Strings
module: string
topic: string
difficulty: medium
estimated_minutes: 20
pattern_label: Sliding Window
complexity_label: O(n) / O(k)
prerequisite:
  - string-sliding-window-fixed
next:
  - string-anagram-grouping
learning_goal:
  - Expand and shrink windows dynamically based on validity conditions.
exit_criteria:
  - >-
    Can solve longest substring problems without repeating characters or with
    character constraints.
leetcode:
  - 3
  - 424
tags:
  - string
  - sliding-window
---

## Author Hints

- 核心觀念：Expand right to include elements, shrink left when conditions break.
- Pattern 辨識線索：Longest/shortest substring with specific constraints.
- Thinking：Keep track of unique elements or counts inside the current [left, right] window.
- Common Mistakes：Failing to update max length after shrinking or expanding.
- TypeScript 重點：Use Maps or frequency arrays alongside window pointers.
- Python 重點：Use dictionaries to track character indices or frequencies.
- 題號 3 為何適合此 Pattern：Finds longest substring without repeating characters.
- 題號 424 為何適合此 Pattern：Finds longest repeating character replacement with variable window.
