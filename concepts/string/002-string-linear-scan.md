---
id: string-linear-scan
title: String Linear Scan
module: string
topic: string
difficulty: easy
estimated_minutes: 10
pattern_label: Linear Scan
complexity_label: O(n) / O(1)
prerequisite:
  - string-ascii-representation
next:
  - string-two-pointers-opposite
  - stack-valid-parentheses
  - stack-remove-adjacent-duplicates
  - string-sliding-window-fixed
  - string-anagram-grouping
  - string-pattern-matching-basic
  - string-parsing-simulation
  - two-pointer-backspace-string-compare
learning_goal:
  - '逐字元走訪字串以累積結果或檢查條件。'
exit_criteria:
  - '能寫出走訪字串索引或字元的標準迴圈，且沒有 off-by-one 錯誤。'
leetcode:
  - 387
  - 242
  - 3
tags:
  - string
  - linear-scan
---

## Author Hints

- 核心觀念：Inspect every character sequentially to extract properties.
- Pattern 辨識線索：Problems asking to validate, count, or search within a string linearly.
- Thinking：Initialize accumulators and loop through the entire string length once.
- Common Mistakes：Modifying strings in place when strings are immutable.
- TypeScript 重點：Iterate using for...of or traditional index loops.
- Python 重點：Iterate directly over string items or use enumerate().
- 題號 387 為何適合此 Pattern：Requires scanning characters to count frequencies.
- 題號 242 為何適合此 Pattern：Scans both strings to verify identical character counts.
- 題號 3 為何適合此 Pattern：透過線性掃描與雜湊表記錄字元位置，尋找不含有重複字元的最長子字串。
