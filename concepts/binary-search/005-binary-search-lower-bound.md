---
id: binary-search-lower-bound
title: Binary Search Lower Bound
module: binary-search
topic: binary-search
difficulty: medium
estimated_minutes: 20
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
prerequisite:
  - binary-search-exclusive-bounds
next:
  - binary-search-upper-bound
learning_goal:
  - Find the first occurrence or first element greater than or equal to target.
exit_criteria:
  - 'Correctly identify lower bound conditions when nums[mid] >= target.'
leetcode:
  - 34
tags:
  - binary-search
  - bound
---

## Author Hints

- 核心觀念：When nums[mid] >= target, move right down to mid to search left half.
- Pattern 辨識線索：Phrases like 'first position', 'lower bound', or duplicate elements.
- Thinking：Do not stop at the first match; continue searching left to find earlier occurrences.
- Common Mistakes：Returning immediately upon finding any match.
- TypeScript 重點：Ensure pointer updates preserve the potential answer.
- Python 重點：Keep conditions strict to avoid skipping the boundary.
- 題號 34 為何適合此 Pattern：Requires finding the starting and ending positions of a target.
