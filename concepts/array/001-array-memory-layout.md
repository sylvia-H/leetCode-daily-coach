---
id: array-memory-layout
title: Array Memory Layout and Indexing
module: array
topic: array
difficulty: easy
estimated_minutes: 10
pattern_label: Direct Access
complexity_label: O(1) / O(1)
prerequisite:
  - computational-thinking-basics
  - mental-model-variables
next:
  - array-linear-scan
  - binary-search-core-concept
  - hash-table-concept-introduction
  - stack-array-implementation
learning_goal:
  - 理解陣列在記憶體中的連續配置特性與 O(1) 隨機存取原理
exit_criteria:
  - 能正確計算給定索引的記憶體位移
  - 理解為何陣列索引從 0 開始
leetcode: []
tags:
  - array
  - fundamentals
  - memory
---

## Author Hints

- 核心觀念：陣列是由連續記憶體空間組成的資料結構，透過基底位址與索引偏移量可實現 O(1) 的隨機存取。
- Pattern 辨識線索：當需要以常數時間存取任意位置的元素時使用陣列。
- Thinking：思考記憶體位址如何透過起始位置加乘上資料大小計算出來。
- Common Mistakes：混淆索引與陣列長度，導致超出邊界錯誤。
- TypeScript 重點：TypeScript 中的陣列是物件，動態大小由底層處理，但連續性可能受稀疏陣列影響。
- Python 重點：Python 中的 list 實質上是指標陣列，儲存的是物件的參考而非實際資料。
