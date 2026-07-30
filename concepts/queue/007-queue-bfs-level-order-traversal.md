---
id: queue-bfs-level-order-traversal
title: Queue BFS Level Order Traversal
module: queue
topic: queue
difficulty: medium
estimated_minutes: 20
pattern_label: Breadth-First Search
complexity_label: O(n) / O(n)
prerequisite:
  - queue-core-concept-introduction
  - stack-using-queues
next:
  - queue-shortest-path-unweighted
learning_goal:
  - >-
    Use a queue to traverse tree or graph nodes level by level in Breadth-First
    Search.
exit_criteria:
  - Process nodes level by level using queue size snapshots.
  - Store child nodes into the queue for subsequent levels.
leetcode:
  - 102
tags:
  - queue
  - bfs
  - tree
---

## Author Hints

- 核心觀念：Queue stores nodes level by level, ensuring nodes closer to the root are processed first.
- Pattern 辨識線索：Problems asking for level-by-level traversal or shortest distance in unweighted graphs.
- Thinking：Record current queue length at the start of each level to group nodes cleanly.
- Common Mistakes：Not capturing queue size before entering the inner loop, leading to mixed levels.
- TypeScript 重點：Push children into array queue and shift parent out.
- Python 重點：Use collections.deque and popleft for O(1) queue extraction.
- 題號 102 為何適合此 Pattern：Canonical BFS problem requiring level-order grouping using a queue.
