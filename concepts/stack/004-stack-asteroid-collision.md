---
id: stack-asteroid-collision
title: Stack Asteroid Collision
module: stack
topic: stack
difficulty: medium
estimated_minutes: 20
pattern_label: Collision Resolution
complexity_label: O(n) / O(n)
prerequisite:
  - stack-array-implementation
  - array-linear-scan
  - stack-valid-parentheses
next:
  - stack-evaluate-reverse-polish-notation
learning_goal:
  - 使用 stack 解決依序發生的碰撞或交互作用。
exit_criteria:
  - 能模擬目前元素會影響先前已儲存元素的連續交互過程。
  - 能在修改 stack 的同時管理迴圈條件。
leetcode:
  - 735
tags:
  - stack
  - simulation
---

## Author Hints

- 核心觀念：Maintain a stack of surviving elements and resolve collisions with incoming elements.
- Pattern 辨識線索：Elements moving towards each other where only the dominant survivor remains.
- Thinking：Compare incoming negative values with positive values at the top of the stack.
- Common Mistakes：Forgetting that a collision can destroy multiple previous stack elements.
- TypeScript 重點：Use a while loop inside the iteration to handle chain reactions.
- Python 重點：Use a list as a stack and pop iteratively until collision condition resolves.
- 題號 735 為何適合此 Pattern：Asteroids collide based on direction, making stack-based elimination ideal.
