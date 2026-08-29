---
id: heap-task-scheduler
title: Task Scheduler with Cooldown
module: heap
topic: heap
difficulty: medium
estimated_minutes: 30
pattern_label: Greedy Frequency Heap
complexity_label: O(n log k) time / O(k) space
prerequisite:
  - heap-find-median-from-data-stream
next: []
learning_goal:
  - 使用頻率 max-heap 與等待佇列，排程具有 cooldown 期間的任務。
exit_criteria:
  - 能以 Greedy 方式處理當前可用且頻率最高的任務，同時遵守 cooldown 計時。
leetcode:
  - 621
tags:
  - heap
  - greedy
  - scheduling
---

## Author Hints

- 核心觀念：Always greedily execute the most frequent remaining task, holding cooling tasks in a queue until their timer expires.
- Pattern 辨識線索：Scheduling problems with frequency constraints and cooldown intervals.
- Thinking：Use a max-heap for frequencies and a FIFO queue paired with timestamps for cooling items.
- Common Mistakes：Forgetting to re-add tasks back to the heap once their cooldown period elapses.
- TypeScript 重點：Manage timer objects or timestamp pairs alongside heap items.
- Python 重點：deque can act as the cooling queue alongside heapq.
- 題號 621 為何適合此 Pattern：Prioritizing the most frequent tasks first minimizes idle time in a greedy fashion.
