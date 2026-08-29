---
id: heapify-linear-time-construction
title: Linear Time Heap Construction (Heapify)
module: heap
topic: heap
difficulty: medium
estimated_minutes: 25
pattern_label: Bottom-up Heapify
complexity_label: O(n) time / O(1) space
prerequisite:
  - heap-sift-down-extraction
next:
  - heap-kth-largest-element
learning_goal:
  - 從最後一個非葉節點開始，以 O(n) 時間從任意陣列建出 heap。
exit_criteria:
  - 能說明為何 bottom-up 建構 heap 是 O(n) 而非 O(n log n)。
leetcode: []
tags:
  - heap
  - heapify
---

## Author Hints

- 核心觀念：Start from the last non-leaf node and run sift-down in reverse order down to the root.
- Pattern 辨識線索：Converting an unordered list into a heap efficiently without individual insertions.
- Thinking：Identify the first parent node index and iterate backwards to index 0.
- Common Mistakes：Starting heapify from index 0 instead of the last non-leaf node.
- TypeScript 重點：Loop backwards from Math.floor(n / 2) - 1.
- Python 重點：Use range(n // 2 - 1, -1, -1) for reverse traversal.
