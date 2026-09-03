---
id: heap-find-median-from-data-stream
title: Find Median from Data Stream
module: heap
topic: heap
difficulty: medium
estimated_minutes: 30
pattern_label: Two Heaps Balance
complexity_label: O(log n) insert / O(1) median / O(n) space
prerequisite:
  - heap-merge-k-sorted-lists
next:
  - heap-task-scheduler
learning_goal:
  - 同時使用一個 max-heap 與一個 min-heap，動態追蹤資料流的中位數。
exit_criteria:
  - 能維持兩個 heap 之間的平衡，使兩者的根能直接給出中位數。
leetcode:
  - 295
tags:
  - heap
  - two-heaps
  - stream
---

## Author Hints

- 核心觀念：Split numbers into a max-heap for the lower half and a min-heap for the upper half, keeping sizes balanced.
- Pattern 辨識線索：Problems requiring continuous tracking of percentiles or medians in a data stream.
- Thinking：Always insert into max-heap first, balance roots, then migrate to min-heap if sizes drift.
- Common Mistakes：Failing to maintain size invariant where max-heap size equals or exceeds min-heap by at most 1.
- TypeScript 重點：Requires two separate heap instances configured with opposite comparators.
- Python 重點：Python heapq is min-heap by default; invert values to simulate max-heap.
- 題號 295 為何適合此 Pattern：Two heaps divide the data stream into lower and upper halves for O(1) median access.
