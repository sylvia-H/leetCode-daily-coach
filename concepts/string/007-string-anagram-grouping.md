---
id: string-anagram-grouping
title: String Anagram Grouping and Hashing
module: string
topic: string
difficulty: medium
estimated_minutes: 15
pattern_label: Hash Map
complexity_label: O(n * k log k) / O(n * k)
prerequisite:
  - string-linear-scan
  - hash-table-grouping-anagrams
  - string-sliding-window-variable
next:
  - string-palindrome-expansion
learning_goal:
  - >-
    Group strings that share identical character compositions using canonical
    keys.
exit_criteria:
  - >-
    Can use sorted string or character counts as hash map keys to group
    anagrams.
leetcode:
  - 49
tags:
  - string
  - hash-table
---

## Author Hints

- 核心觀念：Transform anagrams into a uniform signature key.
- Pattern 辨識線索：Grouping or categorizing words by their character content.
- Thinking：Sort each string or build a frequency tuple to use as a hash map key.
- Common Mistakes：Using mutable arrays as keys directly in languages that don't support it.
- TypeScript 重點：Convert keys to strings like character count arrays joined by delimiters.
- Python 重點：Use tuples of character counts as dictionary keys.
- 題號 49 為何適合此 Pattern：Groups anagrams by sorting characters or frequency signatures.
