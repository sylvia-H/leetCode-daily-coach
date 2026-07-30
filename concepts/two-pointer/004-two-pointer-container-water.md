---
id: two-pointer-container-water
title: Container With Most Water
module: two-pointer
topic: two-pointer
difficulty: medium
estimated_minutes: 15
pattern_label: Two Pointers - Greedy Shrinking
complexity_label: O(n) / O(1)
prerequisite:
  - array-two-pointers-opposite
  - two-pointer-four-sum-extension
next:
  - two-pointer-trapping-rain-water
learning_goal:
  - 學會利用貪婪策略與相向雙指標解決最大面積或容量的尋找問題
exit_criteria:
  - 理解為什麼總是移動高度較小的指標是正確的貪婪選擇
  - 能夠正確計算每次移動時的容量並更新最大值
leetcode:
  - 11
  - 344
tags:
  - two-pointers
  - greedy
  - array
---

## Author Hints

- 核心觀念：兩端設置指標，容量由「寬度乘以兩者較小高度」決定，每次必定移動較短的那端以尋求更高板子的可能。
- Pattern 辨識線索：尋找兩條邊界組成的最大區域或容器容量。
- Thinking：left=0, right=n-1；計算 area = (right - left) * min(h[left], h[right])；若 h[left] < h[right] 則 left++，反之 right--。
- Common Mistakes：誤以為移動較高的指標有機會得到更大面積。
- TypeScript 重點：使用 Math.min 與 Math.max 簡化計算。
- Python 重點：利用簡潔的賦值語法更新最大面積。
- 題號 11 為何適合此 Pattern：經典的雙指標夾擊且依賴貪婪策略決定移動方向的代表題。
- 題號 344 為何適合此 Pattern：利用左右雙指標向內收斂的貪婪策略來處理陣列邊界問題。
