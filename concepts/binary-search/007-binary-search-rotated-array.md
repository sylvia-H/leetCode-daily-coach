---
id: binary-search-rotated-array
title: Binary Search in Rotated Sorted Array
module: binary-search
topic: binary-search
difficulty: medium
estimated_minutes: 25
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
prerequisite:
  - binary-search-upper-bound
next:
  - binary-search-rotated-duplicates
learning_goal:
  - >-
    Identify which half of a rotated sorted array is normally sorted and apply
    binary search.
exit_criteria:
  - 'Determine sorted half using nums[left] <= nums[mid].'
  - Check if target falls within the sorted half range.
leetcode:
  - 33
  - 153
tags:
  - binary-search
  - rotated-array
---

## Author Hints

- 核心觀念：At least one half of a rotated array is always strictly sorted.
- Pattern 辨識線索：Array is sorted but rotated at an unknown pivot.
- Thinking：Find the sorted half first, check if target is in it, otherwise search the other half.
- Common Mistakes：Incorrect boundary checks when target lies on the boundary values.
- TypeScript 重點：Handle strict inequalities carefully.
- Python 重點：Use clean conditional blocks for readability.
- 題號 33 為何適合此 Pattern：Classic search problem in a rotated sorted array.
- 題號 153 為何適合此 Pattern：此題為旋轉排序陣列的變形題，需透過二分搜尋找出最小值。
