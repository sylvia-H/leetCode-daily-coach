---
id: heap-kth-largest-element
title: Finding Kth Element with Heap
module: heap
topic: heap
difficulty: medium
estimated_minutes: 20
pattern_label: Bounded Priority Queue
complexity_label: O(n log k) time / O(k) space
prerequisite:
  - heapify-linear-time-construction
next:
  - heap-top-k-frequent-elements
learning_goal:
  - 使用固定大小的 heap，高效地找出第 K 大或第 K 小的元素。
exit_criteria:
  - 能維護大小為 k 的 heap 來追蹤極值。
leetcode:
  - 215
  - 703
tags:
  - heap
  - top-k
---

## Author Hints

- 核心觀念：Maintain a min-heap of size k. When size exceeds k, pop the smallest element so only the k largest remain.
- Pattern 辨識線索：Problems asking for the Kth largest/smallest element in an unsorted stream or array.
- Thinking：Compare current element with heap root before deciding to push and pop.
- Common Mistakes：Using a max-heap of full size instead of a min-heap of bounded size k.
- TypeScript 重點：Keep track of queue size explicitly during iterations.
- Python 重點：heapq allows pushing and popping efficiently when bound to size k.
- 題號 215 為何適合此 Pattern：Min-heap of size k keeps the k largest elements, with the kth largest at the root.
- 題號 703 為何適合此 Pattern：Streaming data requires maintaining a bounded heap for dynamic kth score queries.
