---
id: two-pointer-three-sum-closest
title: Three Sum Closest Search
module: two-pointer
topic: two-pointer
difficulty: medium
estimated_minutes: 15
pattern_label: Two Pointers - Closest Tracking
complexity_label: O(n^2) / O(1)
prerequisite:
  - two-pointer-three-sum-basic
next:
  - two-pointer-four-sum-extension
learning_goal:
  - 學習如何在雙指標搜尋過程中動態維護並更新「最接近目標值」的全域狀態
exit_criteria:
  - 能夠在每次指標移動時精確計算與目標值的差值絕對值
  - 掌握如何根據當前總和與 target 的大小關係決定該移動 left 還是 right
leetcode:
  - 16
tags:
  - two-pointers
  - sorting
  - greedy
---

## Author Hints

- 核心觀念：與三數之和類似，但在搜尋時不找精確相等的解，而是比較並記錄與目標值距離最小的和。
- Pattern 辨識線索：尋找最接近某個 target 的組合或總和。
- Thinking：外層固定一個數，內層利用左右指標求和；若 sum < target，left++；若 sum > target，right--；若等於 target 可直接返回。
- Common Mistakes：沒有在每次更新總和時同步更新全域的『最接近變數』。
- TypeScript 重點：利用 Math.abs 來比較當前差距與歷史最小差距。
- Python 重點：可使用 float('inf') 初始化最小差距變數。
- 題號 16 為何適合此 Pattern：要求找出最接近目標的三數和，適合在雙指標走訪時維護最佳解。
