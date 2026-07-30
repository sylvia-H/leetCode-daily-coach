---
id: string-ascii-representation
title: String ASCII and Character Codes
module: string
topic: string
difficulty: easy
estimated_minutes: 10
pattern_label: Character Mapping
complexity_label: O(1) / O(1)
prerequisite:
  - hash-table-concept-introduction
next:
  - string-linear-scan
learning_goal:
  - >-
    Understand how characters are represented numerically via ASCII or Unicode
    codes in memory.
exit_criteria:
  - >-
    Can convert characters to integer codes and vice versa in both Python and
    TypeScript.
leetcode:
  - 387
  - 8
tags:
  - string
  - ascii
  - basics
---

## Author Hints

- 核心觀念：Characters are fundamentally integers under the hood.
- Pattern 辨識線索：When problems require mapping lowercase letters a-z to fixed-size arrays.
- Thinking：Determine the zero-based index by subtracting the ASCII value of 'a'.
- Common Mistakes：Forgetting to handle uppercase vs lowercase sensitivity.
- TypeScript 重點：Use charCodeAt() and String.fromCharCode().
- Python 重點：Use ord() and chr().
- 題號 387 為何適合此 Pattern：Uses direct character frequency counting via ASCII offsets.
- 題號 8 為何適合此 Pattern：將字串轉為整數牽涉到字元 ASCII 碼的加減運算與位數處理，是字元對映的進階應用。
