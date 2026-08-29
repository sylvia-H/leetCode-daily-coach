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
  - 結合變動長度 Sliding Window 與頻率或位置追蹤，處理重複元素的限制。
exit_criteria:
  - 能使用 hash map 或頻率陣列在 O(1) 時間內偵測重複字元。
  - 能將左指標跳過或收縮到重複字元前一次出現位置之後。
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
