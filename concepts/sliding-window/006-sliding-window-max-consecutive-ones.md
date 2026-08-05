---
id: sliding-window-max-consecutive-ones
title: Max Consecutive Ones with Replacements
module: sliding-window
topic: sliding-window
difficulty: medium
estimated_minutes: 20
pattern_label: Variable Sliding Window
complexity_label: O(n) / O(1)
prerequisite:
  - sliding-window-variable-size-contraction
  - sliding-window-longest-substring-no-repeat
next:
  - sliding-window-fruit-into-baskets
learning_goal:
  - >-
    Solve window problems allowing a limited number of invalid element
    conversions (k replacements).
exit_criteria:
  - >-
    Can track the count of the most frequent element or invalid elements within
    the window.
  - Can maintain window validity based on (window_length - max_freq <= k).
leetcode:
  - 1004
tags:
  - sliding-window
  - array
---

## Author Hints

- 核心觀念：Allow the window to contain up to k zeros by contracting the left pointer whenever zeros count exceeds k.
- Pattern 辨識線索：Problems allowing up to k modifications, flips, or replacements in a subarray.
- Thinking：Track max frequency of 1s in the window; window size minus max frequency represents the number of flipped zeros needed.
- Common Mistakes：Recalculating max frequency from scratch on every contraction instead of maintaining a running maximum.
- TypeScript 重點：Keep a simple count variable for zeros or frequency map for element counts.
- Python 重點：Use a frequency dictionary to track element counts inside the active window.
- 題號 1004 為何適合此 Pattern：Allows flipping at most k zeros, matching the pattern of bounded invalid elements in a sliding window.
