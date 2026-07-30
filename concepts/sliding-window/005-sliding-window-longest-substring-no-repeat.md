---
id: sliding-window-longest-substring-no-repeat
title: Longest Substring Without Repeating Characters
module: sliding-window
topic: sliding-window
difficulty: medium
estimated_minutes: 20
pattern_label: Variable Sliding Window + Hash Map
complexity_label: 'O(n) / O(min(n, charset))'
prerequisite:
  - sliding-window-variable-size-contraction
  - hash-table-existence-tracking
next:
  - sliding-window-max-consecutive-ones
  - sliding-window-fruit-into-baskets
learning_goal:
  - >-
    Combine a variable sliding window with frequency or position tracking to
    handle duplicate constraints.
exit_criteria:
  - >-
    Can use a hash map or frequency array to detect duplicate characters in O(1)
    time.
  - >-
    Can jump or contract the left pointer past the previous occurrence of a
    duplicate character.
leetcode:
  - 3
tags:
  - sliding-window
  - string
  - hash-table
---

## Author Hints

- 核心觀念：Expand right until a duplicate appears, then contract left past the duplicate's last known index.
- Pattern 辨識線索：Keywords like 'longest substring without repeating characters' or unique elements constraint.
- Thinking：Store character indices in a hash map; if a duplicate is found within the current window, jump left pointer to map[char] + 1.
- Common Mistakes：Failing to ensure the left pointer only moves forward (not backward) when using character index maps.
- TypeScript 重點：Map or JS object can store character last seen indices.
- Python 重點：Dictionary stores char-to-index mapping for fast lookups.
- 題號 3 為何適合此 Pattern：Classic variable sliding window problem finding the longest substring with all unique characters.
