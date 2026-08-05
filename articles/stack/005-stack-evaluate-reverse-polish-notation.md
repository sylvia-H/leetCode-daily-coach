---
id: stack-evaluate-reverse-polish-notation
title: Stack Evaluate Reverse Polish Notation
module: stack
pattern_label: Expression Evaluation
complexity_label: O(n) / O(n)
estimated_minutes: 20
exit_criteria:
  - Can push operands and apply operators to the top two stack elements.
  - Understand operator precedence handling in postfix notation.
---
## Concept

Stack Evaluate Reverse Polish Notation 是一種利用 Stack 資料結構來計算後綴表達式（Postfix Expression，又稱 Reverse Polish Notation, RPN）數值的核心演算法。在 RPN 表達式中，運算子會置於運算元的後面（例如 3 4 + 代表 3 + 4），這項特性消除了對括號的需求，並使電腦能夠透過單一線性掃描與 Stack 來精確地執行運算。

## Thinking

當我們面對表達式求值問題時，傳統的中綴表達式（Infix Expression）需要處理複雜的運算子優先級與括號配對。然而，在 RPN 中，運算子的出現順序即代表了執行的順序。因此，我們可以將 Stack 視為一個暫存尚未處理之運算元的容器。當我們從左到右掃描表達式時：若遇到數字（運算元），則直接將其 Push 進 Stack 中；若遇到運算子，則從 Stack 中 Pop 出兩個運算元，進行運算後再將結果 Push 回 Stack 中。當掃描結束時，Stack 頂端留下的唯一數值即為最終的計算結果。

## Pattern Recognition

當題目描述涉及「後綴表達式」、「逆波蘭表達式」、或任何「運算子緊跟在運算元之後」的求值情境時，應立即識別出 Expression Evaluation 的 Pattern。此 Pattern 的核心特徵在於不需要考慮運算子優先級（Precedence），因為表達式的順序已經明確界定了計算次序，透過 Stack 的 LIFO（Last-In, First-Out）特性剛好能夠完美對應運算元與運算子的消耗關係。

## Common Mistakes

在實作此演算法時，最常見的錯誤是混淆了 Pop 出來的前後運算元順序。對於非交換律運算（Non-commutative Operations）如減法（-）與除法（/），從 Stack 中彈出的第一個元素實際上是右運算元（Right Operand），而彈出的第二個元素才是左運算元（Left Operand）。若順序顛倒，會導致運算結果錯誤。此外，未正確處理整數除法向零截斷（Truncation towards Zero）也是常見的細節失誤。

## Complexity

時間複雜度為 O(n)，其中 n 為表達式中的元素數量。我們對陣列進行了一次線性掃描，每個元素最多被 Push 與 Pop 各一次，因此時間開銷是線性的。空間複雜度亦為 O(n)，在最壞的情況下（例如全部都是運算元），Stack 需要儲存所有的數字。

## Digest

Stack Evaluate Reverse Polish Notation 是利用 Stack 解決後綴表達式求值的經典演算法。透過線性掃描，遇數字則入棧，遇運算子則彈出兩個運算元計算並將結果推回棧中。此方法巧妙地利用 LIFO 特性解決了計算順序問題，時間與空間複雜度均為 O(n)。

## TypeScript Tip

```typescript
// JavaScript/TypeScript 中的除法預設為浮點數運算，整數除法需使用 Math.trunc() 來實現向零截斷。
const a = -5;
const b = 2;
const result = Math.trunc(a / b); // -2
if (result !== -2) throw new Error("Assertion failed");
```

## Python Tip

```python
# Python 的地板除法 // 會向負無限大靠攏（例如 -5 // 2 為 -3），
# 為了符合題目要求的向零截斷（Truncation towards Zero），應使用 int(a / b)。
a = -5
b = 2
result = int(a / b) # -2
assert result == -2, "Assertion failed"
```

## TypeScript Corner

```typescript
function evalRPN(tokens: string[]): number {
  const stack: number[] = [];
  for (const token of tokens) {
    if (token === "+" || token === "-" || token === "*" || token === "/") {
      const b = stack.pop()!;
      const a = stack.pop()!;
      let res = 0;
      if (token === "+") res = a + b;
      else if (token === "-") res = a - b;
      else if (token === "*") res = a * b;
      else if (token === "/") res = Math.trunc(a / b);
      stack.push(res);
    } else {
      stack.push(Number(token));
    }
  }
  const result = stack.pop()!;
  if (result !== 9) throw new Error("Assertion failed");
  return result;
}
evalRPN(["2", "1", "+", "3", "*"]);
```

## Python Corner

```python
def evalRPN(tokens: list[str]) -> int:
    stack: list[int] = []
    for token in tokens:
        if token in ("+", "-", "*", "/"):
            b = stack.pop()
            a = stack.pop()
            if token == "+":
                stack.append(a + b)
            elif token == "-":
                stack.append(a - b)
            elif token == "*":
                stack.append(a * b)
            elif token == "/":
                stack.append(int(a / b))
        else:
            stack.append(int(token))
    result = stack.pop()
    assert result == 9, "Assertion failed"
    return result

evalRPN(["2", "1", "+", "3", "*"])
```

## Takeaway

運用 Stack 暫存運算元，遇到運算子即時彈出計算，注意非交換律運算的左右運算元順序及截斷方向。

## Tomorrow Preview

明天我們將探討 Stack 在單調性質（Monotonic Stack）上的應用，學習如何在線性時間內尋找陣列中下一個更大或更小的元素。

## Today's Challenge

- **150** · RPN 表達式的結構天然契合 Stack 的運作邏輯，運算子總是緊隨其所需的兩個運算元之後，透過 Stack 能夠完美模擬這一求值過程。
  - Hint: 注意當從 Stack 彈出兩個數字進行減法或除法時，先彈出的為右運算元，後彈出的為左運算元。
