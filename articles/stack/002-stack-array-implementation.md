---
id: stack-array-implementation
title: Stack Array Implementation
module: stack
pattern_label: Dynamic Array Wrapper
complexity_label: O(1) amortized
estimated_minutes: 15
exit_criteria:
  - 'Can implement push, pop, top, and isEmpty operations using an array.'
  - Understand why push/pop at the end of an array is O(1) amortized.
---
## Concept

Stack Array Implementation 是一種透過封裝底層動態陣列（Dynamic Array），將操作限制在線性結構末端以實現 LIFO（Last-In, First-Out）特性的資料結構。Stack 的核心精神在於僅允許對堆疊頂端（Top）進行存取，所有插入（push）與刪除（pop）操作皆發生於陣列尾端，藉此維持高效能表現。在記憶體管理中，利用動態陣列實作 Stack 能夠以 O(1) 的均攤時間複雜度（Amortized Time Complexity）完成常數級別的元素增刪，是理解更階層資料結構與演算法設計的基礎。

## Thinking

當我們需要從頭打造一個 Stack 資料結構時，首要任務是決定資料的儲存媒介與堆疊頂端（Top）的對應關係。在思考過程中，我們應將陣列的尾端（Tail）視為 Stack 的頂端。如此一來，新增元素（push）與移除元素（pop）皆直接對應到陣列尾端的操作，避免動態陣列因在前端或中間插入、刪除元素所需進行的大規模記憶體搬移。同時，我們需要維護一個指標或追蹤變數來記錄當前堆疊的大小或頂端索引，確保 isEmpty、top 等基本操作能在正確的時間與空間限制內完成。

## Pattern Recognition

當題目要求我們從零開始實作一個受限制的線性資料結構，或是需要自訂具備特定行為的堆疊容器（例如要求在常數時間內取得最小值、限制容量等），我們即可辨識出此時適用 Dynamic Array Wrapper 模式。此 Pattern 的關鍵特徵在於不需要複雜的指標節點連結，而是透過現有的動態陣列進行邊界與存取行為的約束，將一般的陣列操作包裝成符合 LIFO 規範的介面。

## Common Mistakes

最常見的錯誤是將 Stack 的頂端誤設為陣列的開頭（Index 0）。若在陣列開頭進行 push 或 pop 操作，每次新增或移除元素都會迫使後續的所有元素向右或向左平移，導致時間複雜度從 O(1) 惡化為 O(n)。另一個常見錯誤則是未妥善處理邊界條件，例如在堆疊為空時執行 pop 或 top 操作卻未進行防禦性檢查，導致系統拋出索引超出範圍的例外錯誤。

## Complexity

時間複雜度：push、pop、top 與 isEmpty 操作在均攤情況下皆為 O(1)。雖然動態陣列在容量不足時需要進行擴容並重新配置記憶體（此時單次操作為 O(n)），但透過倍增策略（Doubling Strategy），擴容的成本可以被均攤到後續的多次 push 操作中，因此均攤時間複雜度維持 O(1)。空間複雜度：O(n)，其中 n 為堆疊中儲存的元素數量。

## Digest

本篇探討了 Stack Array Implementation 的核心概念，學習如何利用 Dynamic Array Wrapper 建立符合 LIFO 特性的堆疊。重點在於將陣列尾端作為堆疊頂端，確保 push 與 pop 操作能達到 O(1) 的均攤時間複雜度。透過 TypeScript 與 Python 的實作演練，我們掌握了基本的邊界處理與類別封裝技巧。

## TypeScript Tip

```typescript
class SafeStack<T> {
  private data: T[] = [];
  push(val: T): void { this.data.push(val); }
  pop(): T | undefined { return this.data.pop(); }
  peek(): T | undefined { return this.data[this.data.length - 1]; }
  get size(): number { return this.data.length; }
}
const st = new SafeStack<string>();
st.push("hello");
if (st.size !== 1) throw new Error("assertion failed");
```

## Python Tip

```python
class SafeStack:
    def __init__(self) -> None:
        self._data: list[int] = []
    def push(self, val: int) -> None:
        self._data.append(val)
    def pop(self) -> int | None:
        return self._data.pop() if self._data else None
    def peek(self) -> int | None:
        return self._data[-1] if self._data else None

st = SafeStack()
st.push(42)
assert st.peek() == 42, "assertion failed"
```

## TypeScript Corner

```typescript
class ArrayStack<T> {
  private items: T[] = [];

  public push(item: T): void {
    this.items.push(item);
  }

  public pop(): T {
    if (this.isEmpty()) {
      throw new Error("Stack Underflow");
    }
    return this.items.pop()!;
  }

  public top(): T {
    if (this.isEmpty()) {
      throw new Error("Stack is empty");
    }
    return this.items[this.items.length - 1];
  }

  public isEmpty(): boolean {
    return this.items.length === 0;
  }
}

const stack = new ArrayStack<number>();
stack.push(10);
stack.push(20);
if (stack.top() !== 20) throw new Error("assertion failed");
if (stack.pop() !== 20) throw new Error("assertion failed");
if (stack.isEmpty() !== false) throw new Error("assertion failed");
```

## Python Corner

```python
class ArrayStack:
    def __init__(self) -> None:
        self._items: list[int] = []

    def push(self, item: int) -> None:
        self._items.append(item)

    def pop(self) -> int:
        if self.isEmpty():
            raise IndexError("Stack Underflow")
        return self._items.pop()

    def top(self) -> int:
        if self.isEmpty():
            raise IndexError("Stack is empty")
        return self._items[-1]

    def isEmpty(self) -> bool:
        return len(self._items) == 0

s = ArrayStack()
s.push(10)
s.push(20)
assert s.top() == 20, "assertion failed"
assert s.pop() == 20, "assertion failed"
assert not s.isEmpty(), "assertion failed"
```

## Takeaway

Stack Array Implementation 以陣列尾端作為頂端，封裝出 O(1) 均攤時間複雜度的 LIFO 結構。

## Tomorrow Preview

明天我們將探討經典的 Monotonic Stack（單調堆疊）樣式，學習如何在維持堆疊單調性的同時，於 O(n) 時間內解決尋找下一個更大或更小元素的高階問題。

## Today's Challenge

- **155** · Min Stack 需要在標準的 Stack Array Implementation 基礎上額外維護一個輔助追蹤結構，以確保取得最小值時的時間複雜度為 O(1)，完美契合 Dynamic Array Wrapper 的設計哲學。
  - Hint: 可以考慮使用兩個獨立的動態陣列，一個用於儲存所有元素，另一個用於同步追蹤當前堆疊中的最小值。
