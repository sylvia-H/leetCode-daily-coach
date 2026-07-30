---
id: heap-top-k-frequent-elements
title: Top K Frequent Elements
module: heap
topic: heap
difficulty: medium
estimated_minutes: 25
pattern_label: Frequency Heap
complexity_label: O(n log k) time / O(n) space
prerequisite:
  - heap-kth-largest-element
next:
  - heap-merge-k-sorted-lists
learning_goal:
  - >-
    Combine hash map frequency counting with a priority queue to find top
    frequent elements.
exit_criteria:
  - Can extract the K elements with highest frequencies using a min-heap.
leetcode:
  - 347
tags:
  - heap
  - hash-table
  - frequency
---

## Author Hints

- 核心觀念：Count element frequencies using a hash map, then push pairs into a min-heap of size k based on frequency.
- Pattern 辨識線索：Frequency-based sorting or selection where k is smaller than total unique elements.
- Thinking：Store (frequency, element) tuples in the heap to sort primarily by frequency.
- Common Mistakes：Putting elements into the heap without their frequency counts.
- TypeScript 重點：Map objects help store frequency counts before heap insertion.
- Python 重點：Collections.Counter simplifies frequency counting before heap operations.
- 題號 347 為何適合此 Pattern：Mapping frequencies and keeping a min-heap of size k isolates the most frequent elements.
