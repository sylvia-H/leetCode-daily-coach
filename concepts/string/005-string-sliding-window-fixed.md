---
id: string-sliding-window-fixed
title: Fixed-Size Sliding Window on Strings
module: string
topic: string
difficulty: medium
estimated_minutes: 15
pattern_label: Sliding Window
complexity_label: O(n) / O(k)
prerequisite:
  - string-linear-scan
  - hash-table-sliding-window-frequency
  - string-two-pointers-filtering
next:
  - string-sliding-window-variable
learning_goal:
  - Maintain a fixed window of characters to find patterns like anagrams.
exit_criteria:
  - >-
    Can slide a window of size k across a string while updating frequency maps
    efficiently.
leetcode:
  - 438
  - 567
tags:
  - string
  - sliding-window
---

## Author Hints

- 核心觀念：Add incoming character and remove outgoing character as window slides.
- Pattern 辨識線索：Find all permutations or fixed-length patterns in a string.
- Thinking：Maintain frequency counts and compare with target counts in O(1) time per shift.
- Common Mistakes：Rebuilding the frequency map from scratch at every window shift.
- TypeScript 重點：Use fixed array of size 26 for frequency tracking.
- Python 重點：Use collections.Counter or fixed frequency arrays.
- 題號 438 為何適合此 Pattern：Finds all anagram start indices using a fixed-size window.
- 題號 567 為何適合此 Pattern：Checks permutation existence using a fixed window length.
