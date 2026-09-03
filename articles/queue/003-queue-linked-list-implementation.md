---
id: queue-linked-list-implementation
title: Queue Linked List Implementation
module: queue
pattern_label: FIFO Queue
complexity_label: O(1) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能在 push 與 pop 時正確維護 head 與 tail 指標。
  - 能處理空佇列或只有單一元素的佇列等邊界情況。
---
## Concept

用 Linked List 實作 Queue，是把每個元素包進一個節點（node），節點帶著值 val 與指向下一個節點的 next 指標；整條佇列只靠兩個指標定位——head 指向最早入隊的元素（隊首），tail 指向最晚入隊的元素（隊尾）。enqueue 把新節點接在 tail 後面，dequeue 從 head 拔走節點，兩端操作都不需要走訪串列，因此每次都是 O(1)。這正好補上陣列實作的兩難：搬移法每次出隊都要把後續元素整批前移 O(n)；head 索引法出隊雖是 O(1)，離隊的前段格子卻回收不了，只能靠搬移或擴容清理。鏈結串列的節點分散各處、靠指標串接，出入隊各只改動常數個指標，離隊節點無人引用即交還 GC——兩種代價都不欠。

## Thinking

方向為什麼一定是「tail 進、head 出」？單向鏈結串列只能沿 next 前進。從 head 移除很便宜：head 前移一步就完成；在 tail 後附加也很便宜：把 tail.next 指向新節點、再讓 tail 前進。但反過來「從 tail 移除」就貴了——要讓倒數第二個節點成為新尾端，必須先找到它，而單向串列拿不到前驅，只能從 head 走 O(n)。FIFO 需要的兩端，恰好落在單向串列便宜的那兩個位置，這是方向選擇的結果，不是巧合。正確性可以用一條不變式講清楚：任何時刻，head 指向最早入隊且尚未出隊的元素、tail 指向最晚入隊的元素，從 head 沿 next 必能走到 tail；且佇列為空若且唯若 head 與 tail 同為 null。每個操作的指標更新都是為了讓不變式在操作結束後繼續成立：空佇列入隊時，新節點既是隊首也是隊尾，所以 head 與 tail 必須同時指向它；出隊後 head 變成 null 時佇列已空，所以 tail 也必須同步設回 null。這兩個「特例」都是不變式的直接推論，理解了就不必死背。

## Pattern Recognition

三種訊號提示你選鏈結串列實作：一、要求嚴格 worst-case O(1) 的出入隊——動態陣列的攤銷 O(1) 在擴容那一次會付出 O(n)，對延遲敏感的場景不可接受；二、資料量無法預估上限，不想預先配置或反覆重新配置記憶體；三、題目本身是設計題，要求手刻 Queue 或直接操作節點指標。反之，若容量固定且已知，環形緩衝區通常更省空間、局部性也更好。

## Common Mistakes

最典型的錯誤是出隊到空時忘了重置 tail：head 前移後變成 null，tail 卻仍指向剛移除的節點，成為懸空指標；下一次 enqueue 誤走「非空」分支，把新節點接在早已離隊的節點後面，元素靜默遺失。判空對外一律以 head 為準；enqueue 之所以看 tail，問的是「有沒有尾端可以接」——正因為兩處看的是不同指標，head 清空時必須同步把 tail 設回 null，兩者才不會分歧。第二是空佇列入隊只更新其中一個指標，讓另一個留在 null。第三與記憶體有關：在 TypeScript 與 Python 這類有 GC 的語言，出隊後舊節點只要無人引用就會被回收；但若外部仍握著舊節點，它的 next 還串著整條串列，會讓後面所有節點都無法回收——必要時把移除節點的 next 斷開。最後，若另外維護 size 計數器卻沒在每個分支同步更新，判空就會與指標狀態矛盾。

## Complexity

時間複雜度：enqueue 與 dequeue 皆為嚴格 O(1)（worst-case，非攤銷），每次操作只改動常數個指標。空間複雜度：n 個元素需 O(n) 空間，且每個節點比陣列實作多存一個 next 指標的固定開銷。

## Digest

用單向鏈結串列實作 Queue：head 指向隊首、tail 指向隊尾，enqueue 接在 tail 後、dequeue 從 head 拔除，兩端都不需走訪，達成嚴格 O(1)——單向串列拿不到前驅，所以「tail 進、head 出」是唯一便宜的方向。核心不變式：佇列為空若且唯若 head 與 tail 同為 null。兩個必考邊界都由它推出：空佇列入隊要同時設 head 與 tail；出隊後 head 變 null 時 tail 必須同步重置，否則懸空的 tail 會讓下一次入隊接錯位置、元素靜默遺失。空間 O(n)，每節點多付一個 next 指標。

## TypeScript Tip

用 `QNode<T> | null` 表達「可能為空」，讓編譯器逼你處理空佇列分支。

```typescript
class QNode<T> { next: QNode<T> | null = null; constructor(public val: T) {} }
class LinkedQueue<T> {
  head: QNode<T> | null = null; tail: QNode<T> | null = null;
  enqueue(v: T) { const n = new QNode(v); if (this.tail) this.tail.next = n; else this.head = n; this.tail = n; }
  dequeue(): T | undefined {
    if (!this.head) return undefined;
    const v = this.head.val; this.head = this.head.next;
    if (!this.head) this.tail = null; // 清空時重置 tail
    return v;
  }
}
const q = new LinkedQueue<number>(); q.enqueue(1); q.enqueue(2);
if (q.dequeue() !== 1 || q.dequeue() !== 2) throw new Error("bad order");
q.enqueue(3); if (q.dequeue() !== 3) throw new Error("tail not reset");
```

## Python Tip

Python 沒有指標型別，節點間的連結就是物件參考；判空用 `is None` 最明確。

```python
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

class LinkedQueue:
    def __init__(self):
        self.head = self.tail = None

    def enqueue(self, v):
        n = Node(v)
        if self.tail is None:
            self.head = n
        else:
            self.tail.next = n
        self.tail = n

    def dequeue(self):
        if self.head is None:
            return None
        v = self.head.val
        self.head = self.head.next
        if self.head is None:
            self.tail = None  # 清空時同步重置 tail
        return v

q = LinkedQueue()
q.enqueue(1)
q.enqueue(2)
assert q.dequeue() == 1 and q.dequeue() == 2
assert q.dequeue() is None
q.enqueue(3)
assert q.dequeue() == 3
```

## Takeaway

「tail 進、head 出」讓單向串列兩端皆 O(1)；守住不變式「空 ⇔ head 與 tail 同為 null」，出隊清空時記得同步重置 tail。

## Tomorrow Preview

明天將探討 Circular Buffer：用固定大小的陣列搭配讀寫索引循環使用空間，在不做動態配置的前提下實作容量已知的佇列。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請動手把 LinkedQueue 完整實作一次，並用「入隊、清空、再入隊」的序列驗證 tail 有被正確重置。
