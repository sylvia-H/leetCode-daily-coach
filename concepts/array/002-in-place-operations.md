<!-- F2 stub seed，F7 內容產線上線後由生成物取代（FR-027） -->
---
id: in-place-operations
title: In-place Operations
module: array
topic: array
difficulty: medium
estimated_minutes: 15
pattern_label: In-place Rewrite
complexity_label: O(n) / O(1)
prerequisite: [array-traversal]
next: [prefix-sum]
learning_goal:
  - 能以 O(1) 額外空間就地修改陣列
  - 能用寫入指標壓縮 / 移除元素
exit_criteria:
  - 能就地移除指定元素並回傳新長度
  - 能說明就地操作省下的空間成本
leetcode: [27, 283]
tags: [array, in-place]
---

## Author Hints

（F2 stub：F7 產線展開用，F2 不解析。）

- 引入「寫入指標」概念，銜接 Two Pointer。
