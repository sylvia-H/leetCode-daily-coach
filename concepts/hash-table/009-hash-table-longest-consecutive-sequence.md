---
id: hash-table-longest-consecutive-sequence
title: Set-Based Sequence Building and Boundary Check
module: hash-table
topic: hash-table
difficulty: medium
estimated_minutes: 15
pattern_label: Sequence Hash Set
complexity_label: O(n) / O(n)
prerequisite:
  - hash-table-existence-tracking
  - hash-table-prefix-sum-frequency
next:
  - hash-table-design-lru-cache
learning_goal:
  - >-
    Find the longest consecutive sequence in an unsorted array in O(n) time
    using a hash set.
exit_criteria:
  - Can insert all array elements into a hash set
  - >-
    Can check if an element is the start of a sequence by verifying the absence
    of element - 1
leetcode:
  - 128
  - 217
tags:
  - hash-table
  - hash-set
---

## Author Hints

- 核心觀念：Only start counting sequence length if num - 1 is not in the set, ensuring each sequence is processed in O(n) total time.
- Pattern 辨識線索：Find longest consecutive elements sequence in an unsorted array.
- Thinking：Put all numbers in a set. Iterate through set elements, check if num - 1 exists. If not, count consecutive numbers upward.
- Common Mistakes：Iterating and building sequences from non-starting elements, leading to O(n^2) time complexity.
- TypeScript 重點：Iterate over the Set elements directly using for...of loop.
- Python 重點：Check num - 1 in set before starting the inner counting loop.
- 題號 128 為何適合此 Pattern：Longest Consecutive Sequence uses set membership and boundary checks for O(n) solution.
- 題號 217 為何適合此 Pattern：Contains Duplicate can also be solved with a simple set.
