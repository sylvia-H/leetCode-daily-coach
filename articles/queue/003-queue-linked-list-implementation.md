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

Queue Linked List Implementation

## Thinking

實作 Queue 的 Linked List 核心在於維持兩個指標：head 與 tail。當進行 enqueue 時，新節點會加入至 tail 的尾端，並更新 tail 指標；當進行 dequeue 時，則從 head 移除節點，並將 head 移動至下一個節點。透過雙指標的管理，enqueue 與 dequeue 操作皆能達到 O(1) 的時間複雜度，克服了使用陣列實作時可能需要搬移元素的效能瓶頸。

## Pattern Recognition

當面對需要先進先出（FIFO）特性，且資料規模動態變化、要求所有入隊與出隊操作皆為嚴格 O(1) 時間複雜度，同時欲避免動態陣列重新配置記憶體或位移開銷時，即可採用 FIFO Queue 的 Linked List 實作模式。

## Common Mistakes

最常見的錯誤在於當佇列中最後一個節點被移除（佇列變空）時，未能正確將 tail 指標設為 null，導致下次加入新節點或讀取時產生懸空指標或 Null Pointer Exception。另一個常見問題是忽略了單一元素節點在出入隊時的邊界條件維護。

## Complexity

時間複雜度：enqueue 與 dequeue 操作均為 O(1)；空間複雜度：儲存 n 個元素需要 O(n) 的額外記憶體空間來存放節點指標。

## Digest

本單元深入探討使用 Linked List 實作 Queue 的底層原理與記憶體管理技巧。透過維護 head 與 tail 雙指標，我們能夠在常數時間 O(1) 內完成入隊與出隊操作，避開了傳統陣列實作時因記憶體搬移所造成的效能損耗。在實作過程中，特別需要注意空佇列狀態與單一元素變動時指標的正確更新。掌握此結構有助於後續處理更複雜的圖論走訪與緩衝區設計。

## TypeScript Tip

```typescript
class SafeNode<T> {
  public next: SafeNode<T> | null = null;
  constructor(public val: T) {}
}

function verifyQueueIntegrity<T>(head: SafeNode<T> | null, tail: SafeNode<T> | null): boolean {
  if ((head === null) !== (tail === null)) {
    throw new Error("assertion failed: head and tail consistency broken");
  }
  return true;
}

const node = new SafeNode(42);
if (!verifyQueueIntegrity(node, node)) throw new Error("assertion failed");
```

## Python Tip

```python
class SafeNode:
    def __init__(self, val):
        self.val = val
        self.next = None

def verify_queue_integrity(head, tail):
    if (head is None) != (tail is None):
        raise AssertionError("assertion failed: head and tail consistency broken")
    return True

node = SafeNode(100)
assert verify_queue_integrity(node, node) == True, "assertion failed"
```

## Takeaway

運用 Linked List 實作 Queue 時，必須嚴格維護 head 與 tail 指標，確保在所有邊界條件下皆能維持 O(1) 的高效能表現。

## Tomorrow Preview

明天我們將探討 Stack 與 Queue 的相互轉換及綜合應用，學習如何利用基本資料結構模擬複雜的系統行為。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
