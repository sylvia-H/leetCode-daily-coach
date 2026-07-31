---
id: string-parsing-simulation
title: String Parsing and State Simulation
module: string
topic: string
difficulty: medium
estimated_minutes: 20
pattern_label: Simulation
complexity_label: O(n) / O(n)
prerequisite:
  - string-linear-scan
  - string-pattern-matching-basic
next: []
learning_goal:
  - >-
    Simulate string transformations or arithmetic evaluations using stacks or
    state flags.
exit_criteria:
  - >-
    Can parse structured string formats like run-length encodings or basic
    calculators.
leetcode:
  - 8
  - 14
  - 151
tags:
  - string
  - simulation
  - parsing
---

## Author Hints

- 核心觀念：Process characters sequentially while maintaining parsing states or stack context.
- Pattern 辨識線索：Converting strings to numbers, reversing words, or finding common prefixes.
- Thinking：Identify edge cases like leading spaces, signs, and overflow conditions.
- Common Mistakes：Missing edge cases with empty strings or unexpected characters.
- TypeScript 重點：Use trim() and split() for helper preprocessing.
- Python 重點：Use split() and strip() effectively for tokenization.
- 題號 8 為何適合此 Pattern：Parses string integers with sign and overflow handling.
- 題號 14 為何適合此 Pattern：Finds longest common prefix via horizontal or vertical scanning.
- 題號 151 為何適合此 Pattern：Reverses words in a string by cleaning spaces and tokenizing.
