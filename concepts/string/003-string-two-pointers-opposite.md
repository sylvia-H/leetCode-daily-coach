---
id: string-two-pointers-opposite
title: 'String Two Pointers: Opposite Direction'
module: string
topic: string
difficulty: easy
estimated_minutes: 15
pattern_label: Two Pointers
complexity_label: O(n) / O(1)
prerequisite:
  - string-linear-scan
  - array-two-pointers-opposite
next:
  - string-two-pointers-filtering
  - string-palindrome-expansion
  - two-pointer-valid-palindrome-ii
learning_goal:
  - >-
    Use left and right pointers moving inward to process symmetric string
    properties.
exit_criteria:
  - Can implement palindrome checks efficiently using two pointers.
leetcode:
  - 125
tags:
  - string
  - two-pointers
---

## Author Hints

- 核心觀念：Meet in the middle to compare or reverse components.
- Pattern 辨識線索：Palindromes or symmetric string checks.
- Thinking：Set left at 0 and right at n - 1, moving them towards each other.
- Common Mistakes：Failing to handle pointer crossing termination conditions.
- TypeScript 重點：Use while(left < right) loops.
- Python 重點：Use while left < right idioms.
- 題號 125 為何適合此 Pattern：Validates palindromes by comparing characters from both ends inward.
