---
id: array-two-pointers-variable
title: Sliding Window Variable Size
module: array
topic: array
difficulty: medium
estimated_minutes: 25
pattern_label: Sliding Window
complexity_label: O(n) / O(k)
prerequisite:
  - array-two-pointers-sliding
  - edge-case-enumeration
next:
  - array-in-place-removal
learning_goal:
  - 掌握可變大小滑動視窗的擴張與收縮邏輯
exit_criteria:
  - 能明確分辨何時該擴張右界（right++）與何時該收縮左界（left++）
  - 能在視窗動態調整過程中正確記錄最佳解
leetcode:
  - 209
tags:
  - array
  - sliding-window
  - two-pointers
---

## Author Hints

- 核心觀念：視窗大小可變，透過擴張右界滿足條件，再收縮左界尋找最小有效視窗或滿足特定限制。
- Pattern 辨識線索：尋找符合條件的最長或最短子陣列（如和大於等於 target）。
- Thinking：外層迴圈推進 right 擴張視窗，內層 while 迴圈在滿足條件時推進 left 收縮視窗。
- Common Mistakes：在收縮左界時忘記更新統計狀態（如縂和或頻率）。
- TypeScript 重點：小心維護內部變數與當前視窗狀態的一致性。
- Python 重點：善用條件判斷維持視窗有效性。
- 題號 209 為何適合此 Pattern：尋找和大於等於 target 的最短子陣列，適合用可變大小滑動視窗。
