---
id: linked-list-reversal-recursive
title: Linked List Reversal (Recursive)
module: linked-list
topic: linked-list
difficulty: medium
estimated_minutes: 20
pattern_label: Recursion
complexity_label: O(n) / O(n)
prerequisite:
  - linked-list-reversal-iterative
next:
  - linked-list-merge-two-sorted
learning_goal:
  - >-
    Understand how recursive call stacks can reverse linked list pointers from
    tail to head.
exit_criteria:
  - >-
    Can write a recursive function that reverses the rest of the list and fixes
    pointer directions on unwinding
  - Can identify base cases for recursion
leetcode:
  - 206
tags:
  - linked-list
  - reversal
  - recursion
---

## Author Hints

- 核心觀念：Recursively dive to the end of the list, then adjust head.next.next = head and head.next = null as the stack unwinds.
- Pattern 辨識線索：Alternative recursive solutions for reversing lists or processing structures from the tail up.
- Thinking：Base case: if head is null or head.next is null, return head. Recurse on head.next, then fix pointers.
- Common Mistakes：Forgetting to set head.next = null on the original head, creating a permanent cycle of length 2.
- TypeScript 重點：Watch out for call stack size limits on very long linked lists.
- Python 重點：Ensure proper return of the new head propagated from the deep tail call.
- 題號 206 為何適合此 Pattern：Can be solved elegantly using recursive stack unwinding to reverse links.
