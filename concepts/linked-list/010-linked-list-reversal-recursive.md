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
  - 理解遞迴呼叫堆疊如何從尾到頭反轉 linked list 的指標。
exit_criteria:
  - 能寫出遞迴函式，先反轉串列的其餘部分，並在回溯（unwinding）時修正指標方向
  - 能辨識遞迴的 base case
leetcode:
  - 206
  - 25
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
- 題號 25 為何適合此 Pattern：以遞迴方式每k個節點一組進行反轉，完美體現遞迴處理鏈結結構的思維。
