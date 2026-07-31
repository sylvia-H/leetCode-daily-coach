---
id: dp-linear-robber-pattern
title: Linear House Robber Pattern
module: dynamic-programming
topic: dynamic-programming
difficulty: medium
estimated_minutes: 20
pattern_label: Choice Selection
complexity_label: O(n) / O(1)
prerequisite:
  - dp-space-optimization-rolling
next:
  - dp-grid-path-counting
  - dp-knapsack-01-basic
learning_goal:
  - 掌握『選或不選』與『相鄰不能同時選』的決策型動態規劃
exit_criteria:
  - 能夠列出包含取與不取當前元素的狀態轉移方程式
  - 能夠處理邊界條件如陣列長度為 1 或 2 的情況
leetcode:
  - 198
  - 213
tags:
  - choice-selection
  - linear-dp
---

## Author Hints

- 核心觀念：每一步面臨抉擇：偷當前房屋加上大前天的總額，或跳過當前房屋保留前一天的總額
- Pattern 辨識線索：題目限制不能選擇相鄰的元素，且要求最佳總和
- Thinking：dp[i] = max(dp[i-1], dp[i-2] + nums[i])
- Common Mistakes：未考慮陣列長度小於 2 時的存取安全
- TypeScript 重點：使用區域變數記錄前一步與前兩步的結果
- Python 重點：運用 max 函式與迴圈簡潔實作狀態轉移
- 題號 198 為何適合此 Pattern：經典的打家劫舍問題，完美對應相鄰不可選的限制
- 題號 213 為何適合此 Pattern：環形打家劫舍，可拆解為兩次線性問題來解決
