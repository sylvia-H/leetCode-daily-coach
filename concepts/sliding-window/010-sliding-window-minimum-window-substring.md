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
  - >-
    Master the advanced variable sliding window pattern for covering all
    required characters in minimum length.
exit_criteria:
  - >-
    Can track how many unique required characters have met their target
    frequencies.
  - >-
    Can contract the left pointer greedily while maintaining full coverage of
    all required characters.
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
