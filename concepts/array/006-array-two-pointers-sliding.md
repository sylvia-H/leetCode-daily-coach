---
id: array-two-pointers-sliding
title: Sliding Window Fixed Size
module: array
topic: array
difficulty: medium
estimated_minutes: 20
pattern_label: Sliding Window
complexity_label: O(n) / O(1)
prerequisite:
  - array-two-pointers-opposite
  - tracing-execution-flow
next:
  - array-two-pointers-variable
  - hash-table-sliding-window-distinct
learning_goal:
  - 學會固定大小滑動視窗的維護與更新技巧
exit_criteria:
  - 能正確建立第一個視窗並在視窗移動時只做 O(1) 的增量更新
  - 能正確控制視窗邊界不超出陣列範圍
leetcode:
  - 643
  - 1052
  - 1456
tags:
  - array
  - sliding-window
---

## Author Hints

- 核心觀念：維持一個固定長度的視窗，當視窗向右滑動時，減去移出視窗的元素並加上新進入的元素。
- Pattern 辨識線索：要求尋找長度為固定 k 的子陣列極值或平均值。
- Thinking：先計算前 k 個元素的初始狀態，然後用迴圈讓視窗右移，每次拔除舊元素、加入新元素。
- Common Mistakes：更新視窗時漏掉減去最左邊的舊元素或加上新元素順序錯誤。
- TypeScript 重點：注意型別溢位與浮點數精確度問題。
- Python 重點：確保視窗邊界計算清晰，避免索引越界。
- 題號 643 為何適合此 Pattern：尋找固定長度 k 的子陣列最大平均數，標準的固定大小滑動視窗。
- 題號 1052 為何適合此 Pattern：使用固定大小的滑動視窗來找出特定條件下的最大滿意顧客數。
- 題號 1456 為何適合此 Pattern：在固定長度的字串視窗中統計母音字元的數量，符合固定大小滑動視窗。
