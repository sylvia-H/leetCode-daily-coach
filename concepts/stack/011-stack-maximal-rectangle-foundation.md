---
id: stack-maximal-rectangle-foundation
title: Stack Maximal Rectangle Foundation
module: stack
topic: stack
difficulty: medium
estimated_minutes: 25
pattern_label: Largest Rectangle in Histogram Core
complexity_label: O(n) / O(n)
prerequisite:
  - stack-sum-of-subarray-minimums
next: []
learning_goal:
  - >-
    Calculate the largest rectangular area in a histogram using a monotonic
    stack.
exit_criteria:
  - Can find left and right boundary limits for each histogram bar height.
  - Can compute maximum rectangular area efficiently in linear time.
leetcode:
  - 84
tags:
  - stack
  - monotonic-stack
  - matrix
---

## Author Hints

- 核心觀念：For each bar, find the first shorter bar to its left and right to determine the maximum width for that height.
- Pattern 辨識線索：Finding maximum rectangular areas or bounding box dimensions in histograms or grids.
- Thinking：Maintain an increasing stack of bar indices; when a smaller bar appears, pop and calculate area.
- Common Mistakes：Failing to include a sentinel value or handle stack drainage at the end of the array.
- TypeScript 重點：Pad the histogram array with 0 at both ends to flush out remaining stack elements automatically.
- Python 重點：Appending 0 to the heights array simplifies boundary clearing.
- 題號 84 為何適合此 Pattern：Directly solved by finding left and right bounds for each bar height using a monotonic stack.
