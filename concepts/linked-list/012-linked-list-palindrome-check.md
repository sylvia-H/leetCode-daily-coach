---
id: linked-list-palindrome-check
title: Palindrome Linked List Check
module: linked-list
topic: linked-list
difficulty: medium
estimated_minutes: 25
pattern_label: Composite Pattern (Midpoint + Reverse + Compare)
complexity_label: O(n) / O(1)
prerequisite:
  - linked-list-merge-two-sorted
next: []
learning_goal:
  - 透過找出中點、反轉後半段並比較，以 O(1) 空間檢查 linked list 是否為 palindrome。
exit_criteria:
  - 能找出中點、反轉後半段、對稱地比較值，並可選擇性地還原串列
  - 能說明為何 O(1) 空間需要修改結構
leetcode:
  - 234
  - 143
tags:
  - linked-list
  - palindrome
  - two-pointers
---

## Author Hints

- 核心觀念：Find the middle of the list, reverse the second half, and compare nodes from both halves head-on.
- Pattern 辨識線索：Checking symmetry or palindromic properties in linked lists without using O(n) extra stack or array space.
- Thinking：Find mid with slow/fast, reverse second half, compare first half and reversed second half values, then restore list if required.
- Common Mistakes：Failing to handle odd vs even length lists correctly during midpoint splitting.
- TypeScript 重點：Structure helper functions cleanly or break the problem into clear phases.
- Python 重點：Pointers make half-list traversal and comparison straightforward.
- 題號 234 為何適合此 Pattern：Requires O(1) space palindrome validation, combining midpoint finding and list reversal.
- 題號 143 為何適合此 Pattern：需要結合尋找中點、反轉後半部鏈結串列以及合併的綜合性複合模式。
