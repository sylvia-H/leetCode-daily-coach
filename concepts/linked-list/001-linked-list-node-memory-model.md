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
  - >-
    Understand how nodes store values and references to subsequent nodes in
    non-contiguous memory.
exit_criteria:
  - >-
    Can manually instantiate a Node class with value and next pointer in TS and
    Python
  - >-
    Can explain the difference between array contiguous layout and linked node
    reference layout
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
