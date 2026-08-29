---
id: stack-sum-of-subarray-minimums
title: Stack Sum of Subarray Minimums
module: stack
topic: stack
difficulty: medium
estimated_minutes: 25
pattern_label: Monotonic Stack Boundary Extension
complexity_label: O(n) / O(n)
prerequisite:
  - stack-daily-temperatures
  - stack-online-stock-span
next:
  - stack-maximal-rectangle-foundation
learning_goal:
  - 利用左右邊界，找出每個元素在所有 subarray 中作為最小值的貢獻。
exit_criteria:
  - 能判斷每個元素在維持最小值的前提下，向左與向右可延伸多遠。
  - 能利用邊界與 modulo 運算計算總貢獻。
leetcode:
  - 907
tags:
  - stack
  - monotonic-stack
  - subarray
---

## Author Hints

- 核心觀念：Use a monotonic increasing stack to find the previous less element and next less element for each position, defining its range as a subarray minimum.
- Pattern 辨識線索：Problems asking for sums of minimums or maximums across all subarrays.
- Thinking：Calculate left and right boundaries where the current element is the minimum.
- Common Mistakes：Double counting duplicates when elements are equal; handle strict vs non-strict inequality carefully.
- TypeScript 重點：Use BigInt if necessary to prevent overflow during modulo arithmetic multiplications.
- Python 重點：Python handles large integers automatically, but apply modulo at each step to keep numbers manageable.
- 題號 907 為何適合此 Pattern：Requires finding ranges where each element is the minimum using monotonic boundaries.
