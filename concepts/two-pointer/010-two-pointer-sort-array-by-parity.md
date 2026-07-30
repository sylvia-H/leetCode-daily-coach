---
id: two-pointer-sort-array-by-parity
title: Sort Array by Parity Partition
module: two-pointer
topic: two-pointer
difficulty: easy
estimated_minutes: 10
pattern_label: Two Pointers - Partitioning
complexity_label: O(n) / O(1)
prerequisite:
  - array-two-pointers-opposite
  - two-pointer-valid-palindrome-ii
next: []
learning_goal:
  - 掌握基於條件的雙指標原地交換分割技巧（Partitioning）
exit_criteria:
  - 能夠正確使用相向或同向指標將陣列依奇偶或特定條件分為兩群
  - 理解指標交會時迴圈即告結束的原則
leetcode:
  - 905
  - 75
tags:
  - two-pointers
  - array
  - sorting
---

## Author Hints

- 核心觀念：利用左右雙指標，左邊找奇數、右邊找偶數，雙方交會時進行原地交換以達成條件分割。
- Pattern 辨識線索：要求將陣列元素依照某種奇偶或屬性分群並原地重排。
- Thinking：left=0, right=n-1；若 left 指向偶數則 left++，若 right 指向奇數則 right--，否則交換兩者。
- Common Mistakes：忘記在交換後同時推進左右指標。
- TypeScript 重點：使用解構賦值進行快速元素交換 [arr[left], arr[right]] = [arr[right], arr[left]]。
- Python 重點：Python 同樣支援 tuple unpacking 進行元素交換。
- 題號 905 為何適合此 Pattern：最基礎的雙指標條件分割與交換應用。
- 題號 75 為何適合此 Pattern：使用分區雙指標將陣列元素依照規則重新排列，是基礎 Partitioning 的進階延伸。
