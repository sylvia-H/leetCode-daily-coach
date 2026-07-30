---
id: hash-table-existence-tracking
title: Existence Tracking and Set Membership
module: hash-table
topic: hash-table
difficulty: easy
estimated_minutes: 10
pattern_label: HashSet Membership
complexity_label: O(n) / O(n)
prerequisite:
  - hash-table-concept-introduction
  - hash-table-complement-lookup
next:
  - hash-table-sliding-window-distinct
  - hash-table-longest-consecutive-sequence
  - sliding-window-longest-substring-no-repeat
learning_goal:
  - Use hash sets to track whether elements have been seen before in O(1) time.
exit_criteria:
  - >-
    Can choose between a hash map and a hash set based on whether values need to
    be stored
  - Can detect duplicates during iteration using a set
leetcode:
  - 217
  - 219
  - 128
tags:
  - hash-table
  - hash-set
---

## Author Hints

- 核心觀念：Use a set when you only care about membership testing rather than key-value mapping.
- Pattern 辨識線索：Problem asks if duplicates exist or if an element has been encountered previously.
- Thinking：Add elements to a set as you traverse; if an element is already in the set, a condition is met.
- Common Mistakes：Using a full hash map when a simple hash set is sufficient.
- TypeScript 重點：Use Set<T> in TypeScript for storing unique values.
- Python 重點：Use set() for O(1) average time membership queries.
- 題號 217 為何適合此 Pattern：Contains Duplicate checks if an element is already in the set.
- 題號 219 為何適合此 Pattern：Contains Duplicate II checks set membership within a fixed window size.
- 題號 128 為何適合此 Pattern：使用雜湊集合追蹤數字存在性，以 O(n) 時間完成連續區間的尋找。
