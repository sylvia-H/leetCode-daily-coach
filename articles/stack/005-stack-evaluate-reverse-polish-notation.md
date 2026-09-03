---
id: stack-evaluate-reverse-polish-notation
title: Stack Evaluate Reverse Polish Notation
module: stack
pattern_label: Expression Evaluation
complexity_label: O(n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能將運算元推入 stack，並將運算子套用到 stack 頂端的兩個元素。
  - 理解 postfix 表示法中運算子優先順序的處理方式。
---
## Concept

後綴表達式（Postfix Expression，又稱 Reverse Polish Notation，RPN）把運算子寫在它的兩個運算元之後：中綴的 `(3 + 4) * 5` 寫成 `3 4 + 5 *`。這種寫法把「先算哪裡」完整編碼進符號的排列順序——運算子一出現，它需要的運算元必定已經就緒，因此不需要括號，也不需要優先級規則。求值只要一趟線性掃描搭配一個 stack：數字進來就推入，運算子進來就取出最近的兩個值計算、把結果推回。stack 在這裡扮演「等待被使用的值」的暫存區：每個還沒遇到自己運算子的運算元（或已折疊完成的子結果）都排隊在裡面，LIFO 的順序恰好對應「最近完成的值最先被使用」。

## Thinking

流程本身很短：由左而右掃描 token，遇到數字就推入 stack；遇到運算子，先彈出的是右運算元 r、後彈出的是左運算元 l，計算 `l op r` 後把結果推回；掃描結束時 stack 剩下的唯一值就是答案。

為什麼這樣是對的？關鍵不變式：掃描到任何位置時，stack 由底到頂存放的，正是已讀前綴中「尚未被使用的子運算式的值」，順序與它們完成的先後一致。RPN 的定義保證每個運算子緊跟在它的兩個運算元（各自可能是一段已完成的子表達式）之後，所以運算子出現的那一刻，右運算元是最近完成的值——正好在頂端；左運算元是次近完成的值——正好在頂端下方。彈出兩個、推回一個，不變式繼續成立。

再看結束狀態：合法的 RPN 裡，運算元個數恰比運算子多一，而每個運算子淨消耗一個值（彈二推一），因此掃描完畢時 stack 恰好剩一個值，這也說明了為什麼答案就是最後留在裡面的那個。

## Pattern Recognition

三個訊號指向 Expression Evaluation：輸入是被線性化的運算序列（後綴，或需改由右至左掃描的前綴）；運算子與它的運算元在序列中緊鄰（緊跟其後或緊接其前）；每一步只依賴「最近完成的值」。這正是 stack 的 LIFO 能直接對應的結構。反過來說，若輸入是帶括號與優先級的中綴表達式，單一運算元 stack 不夠用——那需要再配一個運算子 stack 的進階解法；本課先把最乾淨的後綴版本練熟，讓「彈二推一」成為反射動作。

## Common Mistakes

一、非交換律運算的順序顛倒：先彈出的是右運算元，減法與除法必須寫成「後彈出減（除以）先彈出」。寫反的話 `6 2 -` 會算成 -4 而不是 4。二、截斷方向錯誤：題目通常要求除法向零截斷。JavaScript 的 `/` 是浮點除法，要套 `Math.trunc`；Python 的 `//` 是向負無限大的地板除，`-5 // 2` 得 -3 而非 -2，必須改用 `int(a / b)`。三、把負數 token 誤判成運算子：判斷減號必須用「整個 token 恰等於 `-`」，而不是「開頭是減號」——`-5` 是數字。四、忘記把運算結果推回 stack：結果是折疊後的子運算式的值，之後可能再被別的運算子當成運算元，不推回，運算鏈就斷了。

## Complexity

時間複雜度 O(n)：每個 token 恰被處理一次，數字至多推入、彈出各一次，運算子只做常數次操作。空間複雜度 O(n)：最壞情況（例如所有運算元都排在前面）stack 需同時容納約 (n + 1) / 2 個值。

## Digest

RPN 求值：數字推入 stack，運算子彈出兩值（先出為右、後出為左）計算後推回。以 `3 4 + 5 *` 為例：推 3、推 4，遇 `+` 彈出 4 與 3 得 7 推回，推 5，遇 `*` 彈出 5 與 7 得 35，結束時 stack 恰剩一值即答案。正確性來自不變式：stack 存的是所有尚未被使用的子運算式的值，運算子出現時它的兩個運算元剛好在頂端。實作上注意除法向零截斷（JS 用 `Math.trunc`、Python 用 `int(a / b)`），且負數 token 不是減號。O(n) 時間、O(n) 空間。

## TypeScript Tip

JS 的 `/` 是浮點除法，向零截斷用 `Math.trunc`；`pop()` 回傳 `number | undefined`，確定非空時用 `!` 收斂型別。

```typescript
function evalRPN(tokens: string[]): number {
  const st: number[] = [];
  for (const t of tokens) {
    if (t === "+" || t === "-" || t === "*" || t === "/") {
      const r = st.pop()!, l = st.pop()!;
      st.push(t === "+" ? l + r : t === "-" ? l - r : t === "*" ? l * r : Math.trunc(l / r));
    } else {
      st.push(Number(t));
    }
  }
  return st.pop()!;
}
if (evalRPN(["4", "13", "5", "/", "+"]) !== 6) throw new Error("assertion failed");
if (evalRPN(["-5", "2", "/"]) !== -2) throw new Error("assertion failed");
```

## Python Tip

Python 的 `//` 向負無限大取整（`-5 // 2 == -3`），向零截斷要用 `int(a / b)`；運算子表用字典配 lambda 最簡潔。

```python
def eval_rpn(tokens: list[str]) -> int:
    ops = {"+": lambda a, b: a + b, "-": lambda a, b: a - b,
           "*": lambda a, b: a * b, "/": lambda a, b: int(a / b)}
    stack: list[int] = []
    for t in tokens:
        if t in ops:
            r = stack.pop()
            stack.append(ops[t](stack.pop(), r))
        else:
            stack.append(int(t))
    return stack.pop()

assert eval_rpn(["4", "13", "5", "/", "+"]) == 6, "assertion failed"
assert eval_rpn(["-5", "2", "/"]) == -2, "assertion failed"
```

## Takeaway

數字推入、運算子彈二推一；先彈出的是右運算元，除法向零截斷——順序與截斷是最容易踩的兩個坑。

## Tomorrow Preview

明天進入 Remove Adjacent Duplicates：同樣是「目前元素與 stack 頂端互動」，但規則從「運算子消耗運算元」變成「相同字元互相抵銷」，並觀察消除後新相鄰對自動浮現的連鎖效應。

## Today's Challenge

- **150** · 原型題：運算子緊跟運算元之後，stack 頂端永遠就是它需要的兩個值，是 Expression Evaluation 最乾淨的展示。
  - Hint: 先彈出的是右運算元；除法向零截斷（Math.trunc 或 int(a / b)），並以整個 token 等於 "-" 來區分減號與負數。
