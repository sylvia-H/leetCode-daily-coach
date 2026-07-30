---
id: sliding-window-fixed-size
title: Fixed-Size Sliding Window
module: sliding-window
topic: sliding-window
difficulty: easy
estimated_minutes: 15
pattern_label: Fixed-Size Sliding Window
complexity_label: O(n) / O(1)
prerequisite:
  - sliding-window-concept-intro
next:
  - sliding-window-variable-size-expansion
  - sliding-window-permutation-in-string
learning_goal:
  - >-
    Implement a sliding window of a strictly fixed length k to find optimal
    subarray metrics.
exit_criteria:
  - Can write the loop structure to initialize the first window of size k.
  - Can correctly slide the window across the rest of the array in O(n) time.
leetcode:
  - 643
  - 1343
  - 2090
tags:
  - sliding-window
  - array
---

## Author Hints

- 核心觀念：Maintain a window of constant width k, sliding both left and right pointers together step by step.
- Pattern 辨識線索：The problem explicitly asks for subarrays or substrings of a fixed length k.
- Thinking：Compute the first window of size k, then loop from k to n, adding nums[i] and subtracting nums[i - k].
- Common Mistakes：Off-by-one errors when computing the initial window boundary indices.
- TypeScript 重點：Ensure loop bounds correctly handle arrays of length less than k.
- Python 重點：Use slice summation for the initial window if appropriate, then transition to incremental updates.
- 題號 643 為何適合此 Pattern：Requires finding the maximum average of a contiguous subarray of fixed length k.
- 題號 1343 為何適合此 Pattern：同樣使用固定長度為 k 的視窗來計算子陣列平均值大於或等於閾值的數量。
- 題號 2090 為何適合此 Pattern：利用固定大小的滑動視窗計算半徑為 k 的子陣列平均值。
