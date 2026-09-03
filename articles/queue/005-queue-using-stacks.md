---
id: queue-using-stacks
title: Implement Queue using Stacks
module: queue
pattern_label: Stack-to-Queue Transformation
complexity_label: O(1) amortized / O(n)
estimated_minutes: 15
exit_criteria:
  - 能正確管理 input 與 output 兩個堆疊。
  - 能理解為何攤銷分析能保證每次操作為 O(1)。
---
## Concept

Implement Queue using Stacks 要解的問題是：手上只有支援 push、pop、top、empty 的 Stack（LIFO），卻要做出行為完全符合 Queue（FIFO）的資料結構。關鍵洞察只有一句話：把一個 Stack 的元素逐一 pop 出來、push 進另一個 Stack，順序會整個倒轉；而「倒轉兩次等於恢復原狀」。於是我們維護兩個 Stack——inStack 專門收新元素（第一次倒轉了進入順序），outStack 專門供出隊（第二次倒轉，恢復進入順序）。搬移完成後，outStack 的頂端正是最早入隊的元素。搬移只在 outStack 空了才整批進行，這個「按需搬移」讓單次 pop 最壞是 O(n)，但攤銷（amortized，又稱均攤）之後每個操作只需 O(1)。

## Thinking

先寫下這個設計的不變式（invariant）：佇列由舊到新的完整順序＝outStack 從頂到底、接著 inStack 從底到頂；且 outStack 裡任何元素都比 inStack 裡任何元素更早入隊。push 時把新元素壓進 inStack 頂端（最新端），不變式保持。pop 或 peek 時，若 outStack 非空，頂端就是全佇列最舊的元素，直接取用；若 outStack 為空，就把 inStack 全部倒過去——因為此刻沒有更舊的元素擋路，倒完後 inStack 最底（最舊）的元素恰好停在 outStack 頂端，不變式重新成立。攤銷分析為什麼保證 O(1)：每個元素一生最多經歷「進出 inStack 各一次、進出 outStack 各一次」共四次 O(1) 動作，也就是最多被搬移一次；n 個元素的總成本是 O(n)，平均到每次操作自然是 O(1)。那次看似昂貴的 O(n) 搬移，成本其實是先前多次便宜的 push 預先「存」下來的。

## Pattern Recognition

辨識線索：題目限制只能用標準 Stack 介面，卻要求 FIFO 行為（enqueue、dequeue、front）；或者資料的寫入端與讀取端天然分離、允許讀取端「批次補貨」。看到「用 LIFO 結構做出 FIFO 行為」就該想到雙 Stack 倒轉。反過來的「用 FIFO 做 LIFO」是明天的鏡像題，但兩者成本結構並不對稱——Stack 倒進另一個 Stack 順序就反了，Queue 倒進另一個 Queue 順序不變，這正是本題能攤銷 O(1)、鏡像題卻做不到的根本原因。

## Common Mistakes

第一個經典錯誤：outStack 還有元素時就把 inStack 倒過去。用實例看它為何錯——入隊 1、2 後出隊得到 1，outStack 剩下 2；此時入隊 3 又立刻搬移，3 會壓在 2 上面，下一次出隊吐出 3 而不是 2，FIFO 被破壞。第二個錯誤：把「最壞 O(n)」誤讀成「平均也慢」，於是每次 push 或 pop 都急著搬移——結構會退化成 LIFO、製造上述的插隊錯誤：付出的成本並沒有比較高，壞掉的是正確性。第三個錯誤：empty 只檢查其中一個 Stack——佇列為空的條件是 inStack 與 outStack「同時」為空。最後，peek 不需要把元素 pop 出來再塞回去，outStack 頂端本來就能直接讀。

## Complexity

push 為 O(1)。pop 與 peek 最壞為 O(n)（觸發整批搬移時），但攤銷為 O(1)：每個元素一生最多被搬移一次，搬移成本由先前的操作平均分攤。empty 為 O(1)。空間複雜度 O(n)，n 為佇列元素數，兩個 Stack 合計恰好存放全部元素各一份。

## Digest

用兩個 Stack 模擬 Queue：inStack 收新元素、outStack 供出隊。Stack 倒進另一個 Stack 順序會倒轉，倒轉兩次即恢復入隊順序，所以只要在 outStack 空了才把 inStack 整批倒過去，outStack 頂端永遠是最舊元素。單次搬移最壞 O(n)，但每個元素一生最多被搬移一次，攤銷後每個操作 O(1)。關鍵紀律：outStack 非空時絕不搬移，否則新元素會插隊、破壞 FIFO。

## TypeScript Tip

用兩個 `number[]` 當 Stack。`pop()` 回傳 `number | undefined`，搬移迴圈內長度已檢查、可用非空斷言 `!` 收斂型別；對外介面則明確丟出錯誤。

```typescript
class MyQueue {
  private inS: number[] = [];
  private outS: number[] = [];
  push(x: number): void { this.inS.push(x); }
  pop(): number {
    if (this.outS.length === 0)
      while (this.inS.length > 0) this.outS.push(this.inS.pop()!);
    const v = this.outS.pop();
    if (v === undefined) throw new Error("empty queue");
    return v;
  }
}
const q = new MyQueue();
q.push(1); q.push(2);
if (q.pop() !== 1) throw new Error("assertion failed");
q.push(3);
if (q.pop() !== 2 || q.pop() !== 3) throw new Error("assertion failed");
```

## Python Tip

兩個 list 就夠：`append` 與 `pop()` 都作用在尾端、都是 O(1)。不要用 `pop(0)`——那是 O(n)，而且等於偷用了 Queue 的前端操作。

```python
class MyQueue:
    def __init__(self) -> None:
        self.in_s: list[int] = []
        self.out_s: list[int] = []

    def push(self, x: int) -> None:
        self.in_s.append(x)

    def pop(self) -> int:
        if not self.out_s:
            while self.in_s:
                self.out_s.append(self.in_s.pop())
        return self.out_s.pop()

q = MyQueue()
q.push(1); q.push(2)
assert q.pop() == 1, "assertion failed"
q.push(3)
assert q.pop() == 2 and q.pop() == 3, "assertion failed"
```

## Takeaway

倒轉兩次即恢復順序：inStack 收、outStack 出、空了才搬，攤銷 O(1)。

## Tomorrow Preview

明天進入鏡像題 Implement Stack using Queues（stack-using-queues）：改用 FIFO 的 Queue 模擬 LIFO 的 Stack。你會看到成本結構完全不對稱——Queue 倒進另一個 Queue 不會倒轉順序，只能在 push 時逐一旋轉舊元素，付出 O(n) 才換得 O(1) 的 pop 與 top。

## Today's Challenge

- **232** · 本題就是雙 Stack 模擬 Queue 的原型：介面被限制成只能用標準 Stack 操作，卻要交出 push、pop、peek、empty 的 FIFO 行為，攤銷分析正是本題的核心考點。
  - Hint: 只在 outStack 為空時才把 inStack 整批倒過去；empty 要同時檢查兩個 Stack。
