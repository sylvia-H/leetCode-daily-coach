---
id: linked-list-node-memory-model
title: Linked List Node Memory Model
module: linked-list
pattern_label: Pointer Structure
complexity_label: O(1) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能在 TS 與 Python 中手動建立含 value 與 next 指標的 Node class
  - 能說明 array 連續記憶體配置與 linked list 節點參照式配置的差異
---
## Concept

Linked List Node Memory Model 是基礎資料結構的核心概念。與陣列將元素儲存在連續記憶體空間的配置方式不同，Linked List 透過獨立的 Node 物件組成鏈結結構。每個 Node 同時保存資料（Payload）與指向下一個節點的參考指標（Reference Pointer）。這種記憶體非連續配置的特性，使資料結構在動態擴充與插入、刪除操作時表現出獨特的效能特徵。

## Thinking

當我們在記憶體中建立 Linked List 時，可以將其視覺化為一條由獨立箱子組成的鏈子。每個箱子包含兩個部分：存放實際數值的欄位，以及一張指向下一個箱子位置的便條紙。因為記憶體位址不具備連續性，我們無法像陣列一樣透過索引值（Index）在 O(1) 時間內直接存取任意元素，而是必須從頭節點（Head）開始，沿著參考指標逐一走訪，直到找到目標節點為止。

## Pattern Recognition

辨識 Pointer Structure 模式的關鍵在於識別資料是否呈現動態、非連續且需要透過參考指標逐一串接的特徵。當題目涉及節點的動態增刪、指標反轉、或是無法預先知道資料長度且不支援隨機存取（Random Access）時，通常就需要運用 Linked List Node Memory Model 的概念來建構與操作資料。

## Common Mistakes

初學者在操作 Linked List Node 時，最常見的錯誤是遺漏將新節點的 next 指標初始化為 null，導致產生懸空參考（Dangling Reference）或未定義參考。另一個常見失誤是在走訪節點時，直接覆寫了 head 指標，導致遺失整條鏈結串列的起點，進而引發記憶體流失或程式執行崩潰。

## Complexity

時間複雜度：存取節點為 O(N)，建立單一節點為 O(1)。空間複雜度：儲存 N 個節點所需的額外記憶體指標為 O(N)。

## Digest

Linked List Node Memory Model 改變了我們對資料儲存的認知。陣列依賴連續記憶體，而 Linked List 透過獨立 Node 與指標互連。這種設計代價是失去 O(1) 隨機存取能力，換取 O(1) 的動態插入與刪除彈性。掌握節點的記憶體配置與指標指向，是精通鏈結串列演算法的基石。

## TypeScript Tip

```typescript
interface NodeItem<T> {
  val: T;
  next: NodeItem<T> | null;
}

function createNode<T>(val: T): NodeItem<T> {
  return { val, next: null };
}

const node = createNode(42);
if (node.val !== 42 || node.next !== null) {
  throw new Error("TypeScript node creation assertion failed");
}
```

## Python Tip

```python
class Node:
    __slots__ = ('val', 'next')
    def __init__(self, val: int):
        self.val = val
        self.next = None

node = Node(42)
assert node.val == 42 and node.next is None, "Python slot node assertion failed"
```

## Takeaway

理解 Linked List 非連續記憶體配置與 Node 參考指標的運作機制，是解決指標類題目的核心能力。

## Tomorrow Preview

明天我們將探討 Two Pointers 技巧在 Linked List 中的應用，學習如何利用快慢指標尋找中點與判斷環狀結構。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
