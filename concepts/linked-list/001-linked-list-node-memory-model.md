---
id: linked-list-node-memory-model
title: Linked List Node Memory Model
module: linked-list
topic: linked-list
difficulty: easy
estimated_minutes: 15
pattern_label: Pointer Structure
complexity_label: O(1) / O(1)
prerequisite:
  - mental-model-variables
next:
  - linked-list-traversal-basics
  - tree-core-concept-introduction
learning_goal:
  - 理解節點如何在非連續記憶體中儲存值與指向後續節點的參照。
exit_criteria:
  - 能在 TS 與 Python 中手動建立含 value 與 next 指標的 Node class
  - 能說明 array 連續記憶體配置與 linked list 節點參照式配置的差異
leetcode: []
tags:
  - linked-list
  - memory-model
  - pointers
---

## Author Hints

- 核心觀念：A linked list is a chain of independent node objects connected via reference pointers rather than contiguous memory slots.
- Pattern 辨識線索：Recognize that elements do not have direct index access and require traversing from the head.
- Thinking：Visualize memory as discrete boxes where each box contains a payload and a sticky note pointing to the next box.
- Common Mistakes：Forgetting to initialize the next pointer to null, resulting in dangling or undefined references.
- TypeScript 重點：Define a class with generic type <T> for value and a nullable next pointer property.
- Python 重點：Use a simple class with self.val and self.next initialized to None.
