---
id: tree-core-concept-introduction
title: Tree Core Concept Introduction
module: tree
topic: tree
difficulty: easy
estimated_minutes: 15
pattern_label: Hierarchical Data Structure
complexity_label: O(n) / O(h)
prerequisite:
  - linked-list-node-memory-model
next:
  - tree-binary-tree-node-representation
  - graph-core-concept-introduction
  - heap-core-concept-introduction
learning_goal:
  - Understand the terminology and recursive nature of tree structures.
exit_criteria:
  - 'Define root, parent, child, leaf, depth, and height correctly.'
leetcode: []
tags:
  - tree
  - fundamentals
---

## Author Hints

- 核心觀念：Trees are hierarchical data structures consisting of nodes connected by directed edges, embodying a natural recursive definition.
- Pattern 辨識線索：When data exhibits parent-child relationships rather than linear sequences.
- Thinking：Map out the root node and trace how children branch out, identifying recursive substructures.
- Common Mistakes：Confusing tree depth with height, or forgetting that a tree can have cycles if not strictly structured.
- TypeScript 重點：Use custom interfaces to define node structures with value and child pointers.
- Python 重點：Define node classes with lists for children or specific left/right pointers for binary trees.
