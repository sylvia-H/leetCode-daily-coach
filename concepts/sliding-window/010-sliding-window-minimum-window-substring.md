---
id: sliding-window-minimum-window-substring
title: Minimum Window Substring
module: sliding-window
topic: sliding-window
difficulty: medium
estimated_minutes: 25
pattern_label: Variable Sliding Window + Requirement Counter
complexity_label: O(n + m) / O(1)
prerequisite:
  - sliding-window-variable-size-contraction
  - hash-table-frequency-counting
  - sliding-window-find-all-anagrams
next: []
learning_goal:
  - 精通進階的變動長度 Sliding Window pattern，以最短長度涵蓋所有必要字元。
exit_criteria:
  - 能追蹤有多少個必要的相異字元已達到其目標頻率。
  - 能在維持完整涵蓋所有必要字元的同時，貪婪地收縮左指標。
leetcode:
  - 76
tags:
  - sliding-window
  - string
  - hash-table
---

## Author Hints

- 核心觀念：Expand right until all required characters from t are covered, then contract left as much as possible while maintaining coverage.
- Pattern 辨識線索：Finding the smallest substring containing all characters of another string.
- Thinking：Keep a formed count matching the number of unique characters needed; update global minimum substring whenever formed equals required.
- Common Mistakes：Failing to properly decrement formed count when contracting the left pointer past a required character frequency threshold.
- TypeScript 重點：Use Map and counters to verify satisfaction in O(1) time per step.
- Python 重點：Track required unique chars using dictionaries and a formed counter.
- 題號 76 為何適合此 Pattern：The quintessential minimum sliding window problem requiring all characters of t to be present.
