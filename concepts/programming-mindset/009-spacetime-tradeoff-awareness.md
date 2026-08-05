---
id: spacetime-tradeoff-awareness
title: Space-Time Tradeoff Awareness
module: programming-mindset
topic: programming-mindset
difficulty: medium
estimated_minutes: 20
pattern_label: Tradeoff Analysis
complexity_label: O(n) / O(n)
prerequisite:
  - edge-case-enumeration
next:
  - error-driven-refinement
  - array-prefix-sum-basic
learning_goal:
  - 理解時間複雜度與空間複雜度的權衡與取捨
exit_criteria:
  - 能說明何時該用額外記憶體換取運算速度
leetcode: []
tags:
  - mindset
  - complexity
---

## Author Hints

- 核心觀念：時間與空間往往是魚與熊掌，優化其中一方通常需要犧牲另一方
- Pattern 辨識線索：當發現暴力解會超時或記憶體爆掉時
- Thinking：評估資料規模，思考能否用雜湊表或快取空間加速
- Common Mistakes：盲目追求極致效能而寫出難以維護的複雜程式碼
- TypeScript 重點：在 JavaScript 中注意物件查找與陣列搜尋的效能差異
- Python 重點：善用內建 dict 與 set 的 O(1) 查找特性
