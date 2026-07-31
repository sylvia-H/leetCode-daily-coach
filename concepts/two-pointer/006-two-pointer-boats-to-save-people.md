---
id: two-pointer-boats-to-save-people
title: Boats to Save People Matching
module: two-pointer
topic: two-pointer
difficulty: medium
estimated_minutes: 15
pattern_label: Two Pointers - Greedy Pairing
complexity_label: O(n log n) / O(1)
prerequisite:
  - array-two-pointers-opposite
  - two-pointer-trapping-rain-water
next:
  - two-pointer-interval-merging-check
learning_goal:
  - 學會如何利用排序加相向雙指標解決資源配對與極值優化問題
exit_criteria:
  - 能夠理解為何最重的乘客必須優先考慮與最輕的乘客共乘
  - 正確計算所需的最少載具數量
leetcode:
  - 881
tags:
  - two-pointers
  - greedy
  - sorting
---

## Author Hints

- 核心觀念：將陣列排序後，讓最重的人嘗試與最輕的人配對，若超重則最重的人只能單獨搭乘。
- Pattern 辨識線索：給定重量限制，將元素兩兩配對以使用最少容器或載具。
- Thinking：排序後，left=0, right=n-1；若 weight[left] + weight[right] <= limit，則兩人共乘，left++ 且 right--；否則僅最重的人上船，right--。
- Common Mistakes：誤以為可以隨意配對，忽略了排序與極端值貪婪的搭配邏輯。
- TypeScript 重點：先對陣列進行數值排序。
- Python 重點：使用標準 sorted() 配合雙指標進行迭代。
- 題號 881 為何適合此 Pattern：標準的排序加相向雙指標貪婪配對題。
