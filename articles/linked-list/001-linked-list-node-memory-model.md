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

陣列能以 O(1) 隨機存取，靠的是一條位址算式：元素連續且等寬地排在記憶體裡（在 Python 與 JavaScript 這類高階語言中，連續排列的是等寬的參照槽，算式同樣成立），第 i 個元素的位址就是「起始位址 + i * 元素大小」，一次乘加即可直達。Linked List 放棄了這個前提：它由一顆顆獨立配置的 Node 物件組成，每個 Node 帶著兩樣東西——存放實際資料的欄位（payload，慣稱 `val`），以及指向下一個節點的參照（`next`）。節點彼此在記憶體中可以相距任意遠，「誰接在誰後面」這個順序資訊不再由位址決定，而是完整記錄在每個節點的 `next` 指標裡；最後一個節點的 `next` 為 null，作為整條鏈的終點訊號。在 TypeScript 與 Python 這類語言中沒有裸指標，所謂「指標」就是物件參照（reference）——變數存的不是物件本身，而是找到該物件的門牌。

## Thinking

把記憶體想成一堆散落各處的獨立盒子：每個盒子裝一份資料，外加一張寫著「下一個盒子在哪」的便條紙。這個模型能同時解釋兩個看似矛盾的效能特徵。其一，為什麼存取第 i 個節點要 O(n)：順序只存在於指標鏈上，沒有任何算式能從 i 推出位址，唯一的辦法是從 head 沿著便條紙一張張走，走 i 步才知道第 i 個盒子在哪——這不是實作不夠好，而是結構上的必然。其二，為什麼在已知節點旁插入或刪除是 O(1)：只需要改寫一兩張便條紙（重接指標），完全不必搬動任何資料；反觀陣列在中間插入，得把後面所有元素整批往後挪，代價 O(n)。兩種結構是一組取捨：陣列用「連續」換隨機存取，Linked List 用「指標」換動態改鏈的彈性。

## Pattern Recognition

看到以下特徵就該想到 Pointer Structure：題目直接給你一個 head 節點而不是陣列；資料需要頻繁地在中間插入、刪除或重新接線（反轉、合併、攤平）；以及不需要（或無法）按索引隨機存取。反過來說，若題目大量依賴「取第 i 個元素」，陣列才是對的容器。後續整個 linked-list 模組的題型——走訪、插入、刪除、快慢指標——全部建立在今天這個節點模型之上。

## Common Mistakes

第一，忘記把新節點的 `next` 初始化為 null，留下 undefined 之類的未定狀態，之後以「是否為 null」判斷鏈尾時就會失準。第二，直接拿 head 變數當走訪指標往前推：迴圈結束後 head 已指向 null，整條串列的入口遺失；在具垃圾回收的語言中，失去所有參照的節點會被回收，資料是真的拿不回來。第三，誤以為 Linked List 比陣列省記憶體——恰好相反，每個節點都要額外付出一個指標欄位與物件配置的開銷，且節點分散使 CPU 快取命中率變差；它換來的是改鏈的彈性，不是空間。

## Complexity

時間複雜度：建立單一節點 O(1)、在已知節點旁重接指標 O(1)；存取或搜尋任意節點則需沿鏈走訪，為 O(n)。空間複雜度：儲存 n 個節點需 O(n)，其中每個節點額外攜帶一個 next 指標欄位。

## Digest

Linked List 把「順序」從記憶體位址搬進節點內部：每個 Node 獨立配置，攜帶 val 與指向下一個節點的 next 參照，鏈尾以 null 收束。因為位址無法從索引算出，隨機存取退化為 O(n)；作為交換，在已知節點旁插入或刪除只需重接指標，O(1) 完成且不搬移任何資料。這與陣列「連續記憶體、O(1) 直達、中間插入 O(n) 搬移」正好互補。在 TypeScript 與 Python 中，指標的實體就是物件參照。先把節點模型建穩，之後的走訪、插入、刪除都只是在這個模型上改寫便條紙。

## TypeScript Tip

用 class 搭配泛型 `<T>` 定義節點；`next` 的型別必須顯式包含 `null`，鏈尾才有合法的終點值。

```typescript
class ListNode<T> {
  next: ListNode<T> | null = null;
  constructor(public val: T) {}
}

const a = new ListNode<number>(1);
const b = new ListNode<number>(2);
a.next = b;
if (a.next.val !== 2 || b.next !== null) {
  throw new Error("node link assertion failed");
}
```

## Python Tip

Python 沒有型別層的 null 保護，慣例是在 `__init__` 就把 `next` 設為 `None`，讓「尚未接上」成為明確狀態。

```python
class ListNode:
    def __init__(self, val: int):
        self.val = val
        self.next = None

a = ListNode(1)
b = ListNode(2)
a.next = b
assert a.next is b and a.next.val == 2
assert b.next is None, "tail must end with None"
```

## Takeaway

節點＝val＋next 參照；順序記在指標鏈上而非位址裡，因此隨機存取是 O(n)，重接指標是 O(1)。

## Tomorrow Preview

明天進入 Linked List Traversal Basics：用 current = current.next 的標準 while 迴圈安全走訪每個節點而不遺失參照——這是所有鏈結串列操作的共同地基。

## Today's Challenge

本課是純觀念課，沒有指定的 LeetCode 題目。請動手在 TypeScript 與 Python 各寫一次 Node class，串起三個節點並畫出記憶體示意圖，確認自己能說清楚陣列連續配置與節點參照式配置的差異。
