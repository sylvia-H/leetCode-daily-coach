---
id: array-move-zeroes
title: Moving Zeroes to End
module: array
topic: array
difficulty: easy
estimated_minutes: 15
pattern_label: Fast-Slow Pointers
complexity_label: O(n) / O(1)
prerequisite:
  - array-in-place-deduplication
  - error-driven-refinement
next: []
learning_goal:
  - 運用快慢指標技巧將特定元素（如零）集中到陣列末端
exit_criteria:
  - 能將非零元素依序移至前方並將剩餘空間補零
  - 能確保非零元素的相對順序不變
leetcode:
  - 283
tags:
  - array
  - two-pointers
  - in-place
---

## Author Hints

- 核心觀念：透過快慢指標將所有非零元素往前搬移，最後再將慢指標之後的空間全部填零。
- Pattern 辨識線索：要求原地調整元素位置，同時保持特定元素的相對順序。
- Thinking：快指標尋找非零元素填入慢指標位置，最後用迴圈把慢指標到結尾填補 0。
- Common Mistakes：在搬移過程中打亂了非零元素的相對順序。
- TypeScript 重點：可用交換或直接賦值方式處理。
- Python 重點：注意是否需要透過兩步驟完成（先壓縮非零再補零）。
- 題號 283 為何適合此 Pattern：移動零到末尾並保持非零元素順序，快慢指標原地處理的最佳實踐。
