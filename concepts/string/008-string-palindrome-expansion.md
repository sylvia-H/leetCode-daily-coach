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
  - '從所有可能的中心向外擴展，找出回文子字串。'
exit_criteria:
  - '能寫出對單字元與雙字元中心進行擴展的輔助函式。'
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
