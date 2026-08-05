---
id: sliding-window-find-all-anagrams
title: Find All Anagrams in a String
module: sliding-window
topic: sliding-window
difficulty: medium
estimated_minutes: 15
pattern_label: Fixed Sliding Window
complexity_label: O(n) / O(1)
prerequisite:
  - sliding-window-permutation-in-string
next:
  - sliding-window-minimum-window-substring
learning_goal:
  - >-
    Collect all starting indices where a fixed sliding window matches a target
    frequency signature.
exit_criteria:
  - >-
    Can record the starting index of the window whenever the frequency match
    condition is satisfied.
  - >-
    Can traverse the entire string while maintaining the fixed window
    efficiently.
leetcode:
  - 438
tags:
  - sliding-window
  - string
  - hash-table
---

## Author Hints

- 核心觀念：Similar to Permutation in String, but instead of returning true early, record every valid window start index.
- Pattern 辨識線索：Finding all start indices of substrings that are anagrams of a given pattern.
- Thinking：Maintain frequency match counter; when counter equals the number of unique characters, push (i - p.length + 1) to results.
- Common Mistakes：Off-by-one errors when calculating the start index of the matching window.
- TypeScript 重點：Push matching indices into an array and return at the end.
- Python 重點：Build a list of start indices efficiently during the linear scan.
- 題號 438 為何適合此 Pattern：Requires returning all starting indices of p's anagrams in s, a direct extension of fixed window frequency matching.
