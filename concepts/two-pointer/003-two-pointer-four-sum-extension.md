---
id: two-pointer-four-sum-extension
title: Four Sum Nested Reduction
module: two-pointer
topic: two-pointer
difficulty: medium
estimated_minutes: 20
pattern_label: Two Pointers - Multi-layer Fixed Pointers
complexity_label: O(n^3) / O(1)
prerequisite:
  - two-pointer-three-sum-basic
  - two-pointer-three-sum-closest
next:
  - two-pointer-container-water
learning_goal:
  - 學會透過多層迴圈與剪枝技巧將更高維度的 k-sum 問題降維處理
exit_criteria:
  - 能夠正確處理四個數字的巢狀迴圈與重複值略過邏輯
  - 理解剪枝優化（Pruning）在多重迴圈中的應用時機
leetcode:
  - 18
tags:
  - two-pointers
  - sorting
  - nesting
---

## Author Hints

- 核心觀念：延伸三數之和的概念，使用雙層固定迴圈搭配內層相向雙指標來解決四數之和。
- Pattern 辨識線索：尋找四個數相加等於指定目標值的獨特組合。
- Thinking：排序後用雙層迴圈固定前兩個數 i 和 j，內層再用 left 和 right 夾擊；加入適當的 break 與 continue 剪枝。
- Common Mistakes：迴圈層級較多時，漏掉對第二層變數的去重檢查。
- TypeScript 重點：注意 JavaScript 在處理超過安全整數範圍時的相加風險，但多數 LeetCode 測資在範圍內。
- Python 重點：善用條件提早結束（early stopping）來節省不必要的運算時間。
- 題號 18 為何適合此 Pattern：四數之和需要雙層固定外加雙指標，是三數之和的自然延伸。
