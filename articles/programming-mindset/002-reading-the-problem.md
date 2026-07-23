<!-- F5 stub fixture Article：F7 內容產線上線後由生成物取代（FR-027、research R8） -->
---
id: reading-the-problem
title: Reading the Problem
module: programming-mindset
pattern_label: Problem Framing
complexity_label: N/A
estimated_minutes: 10
exit_criteria:
  - 能用自己的話重述題目
  - 能列出至少一組邊界測資
---

## Concept

在動手寫程式之前，先把題目拆成三塊：**輸入**（型別、範圍、是否可能為空）、**輸出**（型別、格式）、
**限制條件**（資料量上限、是否有重複、是否已排序）。跳過這一步直接寫程式，是解題卡關最常見的原因。

## Thinking

讀完題目後，先用自己的話重述一次：「給我一個 ______，我要回傳 ______，條件是 ______。」如果講不出來，
代表題目還沒讀懂，此時去看程式碼只會越寫越亂。

## Pattern Recognition

留意題目裡的關鍵字：「已排序」暗示可以用 Two Pointer 或 Binary Search；「找出所有組合」暗示要
Backtracking；「連續子陣列 / 子字串」暗示 Sliding Window 或 Prefix Sum。

## Common Mistakes

最常見的疏漏是忽略邊界情況：空陣列、只有一個元素、全部元素相同、數值為負。沒有先想好這些情況，
程式碼即使邏輯正確，也可能在邊界測資上出錯。

## Complexity

本節不涉及演算法複雜度，重點在於「花多少時間釐清題目」——通常這是決定解題速度的關鍵，而非打字速度。

## Digest

寫程式前先做三件事：抽出輸入 / 輸出 / 限制、用自己的話重述題目、列出至少一組邊界測資（空輸入、
單一元素、極端值）。這個習慣會讓後面每一個 Pattern 都更容易對上題目。

## TypeScript Tip

```typescript
// 讀題時先寫出型別簽名，強迫自己想清楚輸入輸出
function solve(nums: number[]): number {
  if (nums.length === 0) return 0; // 邊界情況：空陣列
  // ...
  return 0;
}
```

## Python Tip

```python
# 同樣先想邊界：輸入可能是空 list
def solve(nums: list[int]) -> int:
    if not nums:
        return 0
    return 0
```

## TypeScript Corner

```typescript
interface ParsedProblem {
  inputShape: string;
  outputShape: string;
  constraints: string[];
}

function frameProblem(description: string): ParsedProblem {
  // 示意：實務上這一步是在腦中或紙上完成，而非真的寫程式解析題目敘述
  return { inputShape: "number[]", outputShape: "number", constraints: [] };
}
```

## Python Corner

```python
from dataclasses import dataclass, field

@dataclass
class ParsedProblem:
    input_shape: str
    output_shape: str
    constraints: list[str] = field(default_factory=list)
```

## Takeaway

先讀懂，再動手；讀題的三分鐘常常省下寫程式的三十分鐘。

## Tomorrow Preview

明天進入 Array Traversal：把「讀懂題目」的習慣套用到最基本的陣列走訪題型。

## Today's Challenge

- **1** · 暖身用：練習用「輸入 / 輸出 / 限制」的框架重新描述 Two Sum，而不急著寫程式碼。
  - Hint: 輸入陣列可能有負數嗎？同一個元素可以用兩次嗎？
