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
  - '追蹤 Sliding Window 內的字元頻率，以滿足複雜的子字串限制條件。'
exit_criteria:
  - '能在視窗邊界移動時更新 frequency map'
  - '能依據頻率條件判斷視窗是否合法'
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
