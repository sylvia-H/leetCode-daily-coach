---
id: array-prefix-sum-basic
title: Basic Prefix Sum Construction
module: array
topic: array
difficulty: easy
estimated_minutes: 15
pattern_label: Prefix Sum
complexity_label: O(n) / O(n)
prerequisite:
  - array-linear-scan
  - spacetime-tradeoff-awareness
next:
  - array-range-sum-query
  - hash-table-prefix-sum-frequency
learning_goal:
  - 學會預先計算並建立前綴和陣列以加速後續查詢
exit_criteria:
  - 能獨立推導並實作前綴和的遞迴關係式
  - 理解空間換取時間的概念
leetcode:
  - 1480
  - 560
tags:
  - array
  - prefix-sum
---

## Author Hints

- 核心觀念：前綴和陣列 P[i] 代表原陣列從 0 到 i 的元素總和，可用來將範圍查詢優化。
- Pattern 辨識線索：當需要頻繁計算陣列中某個區間的總和時。
- Thinking：定義 P[i] = P[i-1] + A[i]，透過一次線性掃描預先算好所有前綴。
- Common Mistakes：沒有處理好陣列索引對齊或忽略空陣列邊界。
- TypeScript 重點：初始化指定大小的數字陣列時確保型別安全。
- Python 重點：可使用 itertools.accumulate 簡化前綴和的建立過程。
- 題號 1480 為何適合此 Pattern：經典的一維陣列執行前綴和累加。
- 題號 560 為何適合此 Pattern：結合前綴和與雜湊表，在線性時間內找出和為目標值的子陣列數量。
