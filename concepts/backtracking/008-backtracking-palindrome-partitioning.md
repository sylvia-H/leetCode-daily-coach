---
id: backtracking-palindrome-partitioning
title: Backtracking Palindrome Partitioning
module: backtracking
topic: backtracking
difficulty: medium
estimated_minutes: 20
pattern_label: String Partitioning Pattern
complexity_label: O(n * 2^n) / O(n)
prerequisite:
  - backtracking-core-concept-introduction
  - backtracking-permutation-with-duplicates
next:
  - backtracking-word-search
learning_goal:
  - >-
    Learn how to partition a string into segments at every possible index and
    explore valid configurations using backtracking.
exit_criteria:
  - Can slice strings at different cut points during recursion.
  - Can integrate palindrome validation as a pruning condition.
leetcode:
  - 131
tags:
  - backtracking
  - string
  - palindrome
---

## Author Hints

- 核心觀念：At each step, take prefixes of varying lengths from the remaining string. If the prefix is a palindrome, add it to the path and recursively partition the rest of the string.
- Pattern 辨識線索：The problem asks to partition a string such that every substring of the partition is a palindrome.
- Thinking：Iterate end index from start to string length, check if substring(start, end) is palindrome, then recurse with end as the new start.
- Common Mistakes：Re-evaluating palindrome status repeatedly without precomputation or efficient two-pointer checks.
- TypeScript 重點：Use string.slice(start, end) to extract substring partitions.
- Python 重點：Use string slicing like s[start:end] and a helper function to verify palindrome conditions.
- 題號 131 為何適合此 Pattern：Classic string partitioning problem solved by trying cuts and validating palindromes at each step.
