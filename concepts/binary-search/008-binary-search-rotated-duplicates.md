---
id: binary-search-rotated-duplicates
title: Binary Search Rotated Array with Duplicates
module: binary-search
topic: binary-search
difficulty: medium
estimated_minutes: 20
pattern_label: Binary Search
complexity_label: O(n) worst / O(log n) average
prerequisite:
  - binary-search-rotated-array
next:
  - binary-search-find-minimum-rotated
learning_goal:
  - '處理旋轉排序陣列中造成判斷模糊的重複元素。'
exit_criteria:
  - '能偵測 nums[left] == nums[mid] == nums[right] 的情況並收縮邊界。'
leetcode:
  - 81
tags:
  - binary-search
  - duplicates
---

## Author Hints

- 核心觀念：When duplicates make it impossible to tell which half is sorted, increment left and decrement right.
- Pattern 辨識線索：Rotated array problems featuring duplicate values.
- Thinking：Fallback to linear shrinkage when bounds are ambiguous.
- Common Mistakes：Failing to handle the worst-case O(n) scenario.
- TypeScript 重點：Add check for left === mid && mid === right.
- Python 重點：Ensure pointers do not cross during shrinkage.
- 題號 81 為何適合此 Pattern：Duplicates prevent determining the sorted half directly.
