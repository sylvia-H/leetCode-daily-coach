---
id: string-palindrome-expansion
title: Center Expansion for Palindromes
module: string
topic: string
difficulty: medium
estimated_minutes: 15
pattern_label: Two Pointers
complexity_label: O(n^2) / O(1)
prerequisite:
  - string-two-pointers-opposite
  - string-anagram-grouping
next:
  - string-pattern-matching-basic
learning_goal:
  - Find palindromic substrings by expanding outward from all possible centers.
exit_criteria:
  - >-
    Can write a helper function to expand around single and double character
    centers.
leetcode:
  - 5
tags:
  - string
  - two-pointers
  - palindromes
---

## Author Hints

- 核心觀念：Every palindrome has a center; expand outward while characters match.
- Pattern 辨識線索：Finding longest palindromic substring.
- Thinking：Iterate through each index as a center (both odd and even lengths) and expand.
- Common Mistakes：Off-by-one errors when setting up center boundaries.
- TypeScript 重點：Write a helper function returning the length of the palindrome from a given center.
- Python 重點：Return the slice or bounds from the expansion helper.
- 題號 5 為何適合此 Pattern：Finds longest palindromic substring by expanding from centers.
