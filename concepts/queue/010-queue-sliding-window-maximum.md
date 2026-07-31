---
id: queue-sliding-window-maximum
title: Sliding Window Maximum with Monotonic Queue
module: queue
topic: queue
difficulty: medium
estimated_minutes: 25
pattern_label: Monotonic Queue
complexity_label: O(n) / O(k)
prerequisite:
  - queue-core-concept-introduction
  - sliding-window-variable-size-expansion
  - queue-matrix-multi-source-bfs
next: []
learning_goal:
  - >-
    Maintain a monotonic decreasing queue to find the maximum in each sliding
    window in O(n) time.
exit_criteria:
  - >-
    Remove elements from the back of the queue that are smaller than the
    incoming element.
  - >-
    Remove elements from the front of the queue that fall out of the sliding
    window.
leetcode:
  - 239
tags:
  - queue
  - monotonic-queue
  - sliding-window
---

## Author Hints

- 核心觀念：Keep queue elements strictly decreasing in value, storing indices so expired elements can be purged.
- Pattern 辨識線索：Finding maximum or minimum in a sliding window of fixed size efficiently.
- Thinking：Pop smaller elements from back before pushing new index; pop index from front if outside window range.
- Common Mistakes：Storing values instead of indices in the queue, making it impossible to check window bounds.
- TypeScript 重點：Use a double-ended queue data structure simulation or array indices.
- Python 重點：Use collections.deque storing indices.
- 題號 239 為何適合此 Pattern：Classic application of monotonic queue for sliding window maximum.
