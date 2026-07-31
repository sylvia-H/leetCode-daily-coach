---
id: string-two-pointers-filtering
title: String Two Pointers with Preprocessing
module: string
topic: string
difficulty: medium
estimated_minutes: 15
pattern_label: Two Pointers
complexity_label: O(n) / O(1)
prerequisite:
  - string-two-pointers-opposite
next:
  - string-sliding-window-fixed
learning_goal:
  - Skip non-alphanumeric or invalid characters while running two pointers.
exit_criteria:
  - >-
    Can skip unwanted characters on-the-fly without allocating extra memory for
    filtered strings.
leetcode:
  - 125
  - 680
tags:
  - string
  - two-pointers
---

## Author Hints

- 核心觀念：Advance pointers past ignored characters before making comparisons.
- Pattern 辨識線索：Palindromic validation with special characters or single deletions allowed.
- Thinking：Nested loops or helper checks to increment/decrement pointers when characters are invalid.
- Common Mistakes：Forgetting to check left < right bounds inside the inner skip loops.
- TypeScript 重點：Write helper functions for character validation.
- Python 重點：Use isalnum() for concise character checking.
- 題號 125 為何適合此 Pattern：Skips spaces and punctuation while checking palindromes.
- 題號 680 為何適合此 Pattern：Allows skipping at most one character mismatch using two pointers.
