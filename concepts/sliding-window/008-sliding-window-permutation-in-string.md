---
id: sliding-window-permutation-in-string
title: Permutation in String (Exact Frequency Match)
module: sliding-window
topic: sliding-window
difficulty: medium
estimated_minutes: 20
pattern_label: Fixed/Variable Window + Frequency Comparison
complexity_label: O(n) / O(1)
prerequisite:
  - sliding-window-fixed-size
  - hash-table-frequency-counting
  - sliding-window-fruit-into-baskets
next:
  - sliding-window-find-all-anagrams
learning_goal:
  - >-
    Use a fixed-size sliding window with frequency arrays to check for exact
    anagram matches.
exit_criteria:
  - >-
    Can initialize frequency arrays for both the target pattern and the sliding
    window.
  - >-
    Can compare frequency structures efficiently in O(1) time by tracking
    matched character counts.
leetcode:
  - 567
tags:
  - sliding-window
  - string
  - hash-table
---

## Author Hints

- 核心觀念：Maintain a fixed window of size len(s1) and compare its character frequency count with s1's frequency count.
- Pattern 辨識線索：Checking if any permutation (anagram) of string s1 exists as a substring in string s2.
- Thinking：Use an array of size 26 for frequencies; slide the window of length len(s1), updating counts and matching states incrementally.
- Common Mistakes：Comparing entire frequency arrays of size 26 inside the loop instead of tracking a match count variable.
- TypeScript 重點：Use fixed-size Int32Array for fast O(1) frequency checks.
- Python 重點：Compare list or Counter objects, or maintain a match counter for optimal O(n) performance.
- 題號 567 為何適合此 Pattern：Directly asks whether a permutation of s1 is present as a substring in s2.
