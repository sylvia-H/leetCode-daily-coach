---
id: string-pattern-matching-basic
title: Basic Substring Search
module: string
topic: string
difficulty: easy
estimated_minutes: 15
pattern_label: Linear Scan
complexity_label: O(n * m) / O(1)
prerequisite:
  - string-linear-scan
  - string-palindrome-expansion
next:
  - string-parsing-simulation
learning_goal:
  - >-
    Understand how substring search works by scanning potential match starting
    points.
exit_criteria:
  - Can implement indexOf or find a needle in a haystack using nested loops.
leetcode:
  - 28
  - 686
tags:
  - string
  - matching
---

## Author Hints

- 核心觀念：Check every possible starting position in the haystack for a match with the needle.
- Pattern 辨識線索：Finding the first occurrence of a substring.
- Thinking：Outer loop for haystack index, inner loop to check needle characters.
- Common Mistakes：Looping past the remaining length where the needle can possibly fit.
- TypeScript 重點：Can use built-in indexOf or manual loop for practice.
- Python 重點：Can use find() or slice comparisons.
- 題號 28 為何適合此 Pattern：Implements basic substring search.
- 題號 686 為何適合此 Pattern：透過重複字串來檢查子字串匹配，考驗基礎字串搜尋與線性掃描邏輯。
