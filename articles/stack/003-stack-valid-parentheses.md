---
id: stack-valid-parentheses
title: Stack Valid Parentheses
module: stack
pattern_label: Bracket Matching
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - Can write a matching algorithm using a stack for open and close symbols.
  - Can handle edge cases like unmatched closing or leftover opening symbols.
---
## Concept

Stack Valid Parentheses 概念主要在處理巢狀結構的符號匹配問題。核心運作機制是利用 LIFO 的特性，當遇到左括號時推入堆疊，當遇到右括號時則檢查堆疊頂端的元素是否與之相符。若相符則將左括號彈出，若不相符或堆疊為空，則代表該括號字串無效。

## Thinking

思考這個 Pattern 時，應將字串由左至右進行疊代。每當遇到開口符號（例如 `(`、`{`、`[`），就將其推入堆疊中。若遇到閉合符號（例如 `)`、`}`、`]`），則必須檢查堆疊是否為空，若為空則代表沒有對應的開口符號；若不為空，則彈出堆疊頂端元素並比對是否為對應的型態。在迴圈結束後，還必須檢查堆疊是否完全清空，以確保沒有多餘的未閉合左括號。

## Pattern Recognition

辨識此 Pattern 的線索在於問題涉及「巢狀」、「成對出現」且「必須以相反順序閉合」的符號或事件。常見的情境包含括號驗證、HTML 標籤配對、運算式解析，以及某些需要追蹤最近狀態的區間計算問題。

## Common Mistakes

最常見的錯誤包含在彈出堆疊元素前未檢查堆疊是否為空，導致執行時發生錯誤；或者在字串走訪完畢後，忘記檢查堆疊內是否仍殘留未閉合的左括號，導致漏掉結尾不完整的邊界條件。

## Complexity

時間複雜度為 O(n)，因為我們只需要對長度為 n 的字串進行單次線性掃描；空間複雜度在最壞的情況下（例如全部都是左括號）為 O(n)，因為堆疊需要儲存所有的開口符號。

## Digest

本次課程探討了 Stack Valid Parentheses 核心觀念與 Bracket Matching Pattern。透過 LIFO 的資料結構特性，我們能夠高效地處理成對且具巢狀關係的符號驗證。文章詳細說明了從演算法思考、複雜度分析到 TypeScript 與 Python 的具體實作，並點出常見的實作陷阱，例如未檢查空堆疊或迴圈結束後未確認堆疊是否清空。掌握此 Pattern 後，將能應付多種需要狀態追蹤與配對的演算法題型。

## TypeScript Tip

在 TypeScript 中實作 Stack 時，應避免使用 `Array.shift()` 或 `Array.unshift()` 作為主要操作，因為這會導致 O(n) 的搬移成本。務必使用 `Array.push()` 與 `Array.pop()` 來維持 O(1) 的效能。
```typescript
class Stack<T> {
  private items: T[] = [];
  push(item: T): void {
    this.items.push(item);
  }
  pop(): T | undefined {
    return this.items.pop();
  }
  get size(): number {
    return this.items.length;
  }
}
const st = new Stack<number>();
st.push(10);
if (st.pop() !== 10) throw new Error("assertion failed");
```

## Python Tip

在 Python 中，原生串列的 `append()` 與 `pop()` 方法即具備 O(1) 的尾端操作效能，適合作為堆疊使用。若需要更嚴謹的執行緒安全或效能考量，亦可考慮 `collections.deque`。
```python
from collections import deque

class Stack:
    def __init__(self):
        self._items = deque()
    def push(self, item):
        self._items.append(item)
    def pop(self):
        return self._items.pop()
    def __len__(self):
        return len(self._items)

s = Stack()
s.push(42)
assert s.pop() == 42, "assertion failed"
```

## TypeScript Corner

在 TypeScript 中，我們可以使用陣列來模擬 Stack，並搭配映射物件或 switch 敘述來驗證括號對應關係。
```typescript
function isValid(s: string): boolean {
  const stack: string[] = [];
  const map: Record<string, string> = {
    ')': '(',
    '}': '{',
    ']': '['
  };
  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else {
      const top = stack.pop();
      if (top !== map[char]) {
        return false;
      }
    }
  }
  const result = stack.length === 0;
  if (!result) throw new Error("assertion failed");
  return result;
}
if (!isValid("()[]{}")) throw new Error("assertion failed");
```

## Python Corner

在 Python 中，通常使用串列（list）作為堆疊，並透過字典（dict）來定義右括號對應的左括號，藉此簡化條件判斷邏輯。
```python
def is_valid(s: str) -> bool:
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping.values():
            stack.append(char)
        elif char in mapping:
            if not stack or stack.pop() != mapping[char]:
                return false
        else:
            pass
    result = len(stack) == 0
    assert result, "assertion failed"
    return result

assert is_valid("()[]{}")
```

## Takeaway

運用 Stack 進行括號匹配時，核心在於開口入堆疊、閉合查堆疊，最後務必確認堆疊完全清空。

## Tomorrow Preview

明天的課程將探討 Stack 的進階應用，延伸至 Monotonic Stack 單調堆疊 Pattern，學習如何在線性時間內尋找陣列中下一個更大或更小的元素。

## Today's Challenge

- **20** · 經典的 LIFO 應用，用來驗證包含多種型態括號的巢狀字串是否合法。
  - Hint: 利用字典或對應表記錄右括號與左括號的關係，並在遇到右括號時檢查堆疊頂端是否匹配。
- **32** · 屬於括號匹配 Pattern 的進階應用，利用堆疊儲存索引來計算最長有效括號子字串的長度。
  - Hint: 堆疊中預先放入 -1 作為基準基底，遇到左括號推入索引，遇到右括號則彈出並計算當前有效長度。
- **921** · 利用堆疊或計數概念來追蹤未匹配的括號數量，藉此計算最少需要補齊多少括號才能使字串合法。
  - Hint: 可以透過兩個變數分別記錄未匹配的左括號與右括號數量，或直接使用堆疊模擬匹配過程。
