---
id: stack-core-concept-introduction
title: Stack Core Concept Introduction
module: stack
pattern_label: Last-In-First-Out (LIFO)
complexity_label: O(1) push/pop
estimated_minutes: 10
exit_criteria:
  - Can explain why elements are retrieved in reverse order of insertion.
  - Can trace push and pop operations manually.
---
## Concept

Stack 是一種線性資料結構，遵循後進先出（Last-In-First-Out, LIFO）的原則。在 Stack 中，最後加入的元素會被最先移除。這個資料結構的主要操作包含 push（將元素推入頂端）、pop（將頂端元素彈出）、peek（檢視頂端元素但不移除），以及檢查 Stack 是否為空。由於所有的插入與刪除操作都發生在同一端（稱為頂端 Top），因此這些操作的執行效率極高。

## Thinking

思考 Stack 時，可以將其視覺化為一疊垂直堆疊的盤子。當你放置盤子時，你只能放在最上方；當你拿取盤子時，也只能從最上方拿取。最後放上去的盤子，必然是第一個被拿走的盤子。在程式設計中，當我們需要追蹤最近發生的狀態、實作遞迴調用、或是處理巢狀結構時，這種 LIFO 的特性提供了一個非常直觀且高效的思考模型，讓我們能夠依序處理與還原狀態。

## Pattern Recognition

當問題需要存取和處理「最近」加入的項目時，通常就是識別 Stack Pattern 的關鍵線索。常見的情境包含括號匹配、瀏覽器的上一頁與下一頁歷史紀錄、深度優先搜尋（DFS）的疊代實作，以及表達式的求值。只要看到「最近的優先處理」或是需要反轉處理順序的需求，就應該優先考慮使用 Stack。

## Common Mistakes

最常見的錯誤是將 Stack 的 LIFO（Last-In-First-Out）原則與 Queue 的 FIFO（First-In-First-Out）原則搞混。Stack 像是疊盤子，最後進去的最先出來；而 Queue 像是排隊，最先排隊的最先離開。另一個常見錯誤是在對空的 Stack 執行 pop 或 peek 操作時，未先進行邊界檢查，導致程式拋出例外或引發未定義行為。

## Complexity

Stack 的主要操作包含 push、pop 與 peek。在標準的陣列或鏈結串列（Linked List）實作中，這些操作只需要常數時間複雜度 O(1)。空間複雜度方面，若 Stack 中儲存了 n 個元素，則空間複雜度為 O(n)。

## Digest

Stack 是一種核心的線性資料結構，遵循 LIFO 原則。主要的 push 與 pop 操作皆維持在 O(1) 的時間複雜度，非常適合用於處理需要追蹤最近狀態的問題。掌握 Stack 的運作機制是解決複雜演算法題目的重要基石。

## TypeScript Tip

```typescript
const stack: number[] = [];
stack.push(1);
stack.push(2);
const top = stack.pop();
if (top !== 2) throw new Error("assertion failed");
```

## Python Tip

```python
stack = []
stack.append(1)
stack.append(2)
top = stack.pop()
assert top == 2, "assertion failed"
```

## TypeScript Corner

```typescript
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

const stack = new Stack<number>();
stack.push(10);
stack.push(20);
if (stack.peek() !== 20) throw new Error("assertion failed");
if (stack.pop() !== 20) throw new Error("assertion failed");
if (stack.pop() !== 10) throw new Error("assertion failed");
if (!stack.isEmpty()) throw new Error("assertion failed");
```

## Python Corner

```python
class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)

    def pop(self):
        if not self.isEmpty():
            return self.items.pop()
        return None

    def peek(self):
        if not self.isEmpty():
            return self.items[-1]
        return None

    def isEmpty(self):
        return len(self.items) == 0

s = Stack()
s.push(10)
s.push(20)
assert s.peek() == 20, "assertion failed"
assert s.pop() == 20, "assertion failed"
assert s.pop() == 10, "assertion failed"
assert s.isEmpty() == True, "assertion failed"
```

## Takeaway

Stack 遵循 LIFO原則，所有核心操作皆為 O(1)。當需要優先處理最近加入的項目時，Stack 是最佳選擇。

## Tomorrow Preview

明天我們將探討 Stack 的進階應用，學習如何運用 Monotonic Stack（單調堆疊）來解決尋找下一個更大元素的經典問題。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
