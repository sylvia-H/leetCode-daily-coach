---
id: linked-list-reversal-iterative
title: Linked List Reversal (Iterative)
module: linked-list
topic: linked-list
difficulty: medium
estimated_minutes: 25
pattern_label: Pointer Reversal
complexity_label: O(n) / O(1)
prerequisite:
  - linked-list-cycle-start-node
next:
  - linked-list-reversal-recursive
learning_goal:
  - >-
    Master the three-pointer technique to reverse the direction of links in a
    singly linked list.
exit_criteria:
  - 'Can reverse a linked list iteratively using prev, curr, and next pointers'
  - Can return the new head correctly
leetcode:
  - 206
  - 92
tags:
  - linked-list
  - reversal
  - iterative
---

## Author Hints

- 核心觀念：Maintain prev, curr, and next pointers, flipping curr.next to point backward at each step.
- Pattern 辨識線索：Problems requiring reversing entire lists, sublists, or rearranging node directions.
- Thinking：Save next = curr.next, set curr.next = prev, advance prev = curr, then curr = next.
- Common Mistakes：Losing reference to the rest of the list by forgetting to cache curr.next before reassigning it.
- TypeScript 重點：Use temporary variables to hold reference types safely during swapping.
- Python 重點：Python tuple assignment (prev, curr, curr.next) = (curr, curr.next, prev) simplifies the swaps.
- 題號 206 為何適合此 Pattern：The canonical problem for reversing a singly linked list.
- 題號 92 為何適合此 Pattern：此題為部分反轉鏈結串列，考驗反覆迭代時指標精準翻轉與接合的控制能力。
