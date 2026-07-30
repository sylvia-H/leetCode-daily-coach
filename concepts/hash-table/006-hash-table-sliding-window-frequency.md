---
id: hash-table-sliding-window-frequency
title: Sliding Window with Hash Map Frequency Balancing
module: hash-table
topic: hash-table
difficulty: medium
estimated_minutes: 15
pattern_label: Sliding Window Frequency Map
complexity_label: O(n) / O(k)
prerequisite:
  - hash-table-frequency-counting
  - hash-table-sliding-window-distinct
next:
  - hash-table-grouping-anagrams
  - string-sliding-window-fixed
learning_goal:
  - >-
    Track character frequencies inside a sliding window to satisfy complex
    substring constraints.
exit_criteria:
  - Can update frequency map when sliding window boundaries move
  - Can evaluate window validity based on frequency conditions
leetcode:
  - 438
  - 76
tags:
  - hash-table
  - sliding-window
---

## Author Hints

- 核心觀念：Maintain a frequency map of elements inside a sliding window and adjust counts as pointers move.
- Pattern 辨識線索：Anagram search or substring containing all characters of another string with counts.
- Thinking：Increment count for incoming right element, decrement count for outgoing left element.
- Common Mistakes：Deleting keys from the map incorrectly when counts drop to zero, affecting match checks.
- TypeScript 重點：Keep track of matched conditions count to avoid scanning the entire map on every step.
- Python 重點：Compare frequency dictionaries or counter objects efficiently.
- 題號 438 為何適合此 Pattern：Find All Anagrams in a String uses a fixed-size sliding window frequency map.
- 題號 76 為何適合此 Pattern：Minimum Window Substring expands and shrinks a window based on character frequency matches.
