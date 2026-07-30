---
id: problem-simplification-strategy
title: Problem Simplification Strategy
module: programming-mindset
topic: programming-mindset
difficulty: easy
estimated_minutes: 15
pattern_label: Reduction
complexity_label: O(1) / O(1)
prerequisite:
  - loop-invariant-thinking
next:
  - edge-case-enumeration
  - array-in-place-removal
learning_goal:
  - 學會將大型複雜問題簡化成極小規模的範例來求解
exit_criteria:
  - 能把抽象問題化為長度為 1 或 2 的具體案例進行推導
leetcode: []
tags:
  - mindset
  - strategy
---

## Author Hints

- 核心觀念：如果無法解決大規模問題，就先解決它的極小版本
- Pattern 辨識線索：當題目敘述抽象繁雜讓人沒有頭緒時
- Thinking：代入最簡單的測資，觀察規律後再逐步推廣
- Common Mistakes：一開始就嘗試寫出涵蓋所有特殊狀況的通用解
- TypeScript 重點：先寫出通過基本案例的直覺解再進行重構
- Python 重點：利用互動式環境快速測試小規模測資
