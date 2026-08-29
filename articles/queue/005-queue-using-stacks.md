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

Implement Queue using Stacks（id: queue-using-stacks）探討如何僅利用兩個 LIFO（Last-In-First-Out）的 Stack 資料結構，來模擬出符合 FIFO（First-In-First-Out）特性的 Queue 行為。在計算機科學中，Stack 支援在頂端進行 O(1) 的 push 與 pop 操作，而 Queue 則要求在尾端推入、在前端彈出。當系統限制僅能使用 Stack 操作時，透過巧妙地維護兩個 Stack（通常稱為 inStack 與 outStack），我們能將元素的順序倒轉，完美實現 Queue 的各項核心操作。這項技術的核心價值在於透過資料搬移的均攤分析（Amortized Analysis），讓每個操作在最壞情況下看似昂貴，但在長期平均下仍能維持高效能。

## Thinking

思考如何使用 Stack 模擬 Queue 時，必須正視兩者的根本差異：Stack 的頂端是最新加入的元素（LIFO），而 Queue 的前端卻是最早加入的元素（FIFO）。為了克服這個順序衝突，我們引入兩個 Stack：inStack 負責收集所有新推送（push）進來的元素，相當於 Queue 的尾端；outStack 則負責提供彈出（pop）與查看前端（peek）的服務，相當於 Queue的前端。當執行 pop 或 peek 操作且 outStack 為空時，我們必須將 inStack 中的所有元素依序彈出並推入 outStack 中。這個搬移動作會將元素的順序完全反轉，使得原本在 inStack 底部的最早元素，剛好落在了 outStack 的頂端，從而符合 FIFO 的特性。此時若 outStack 仍有元素，後續的 pop 或 peek 就可以直接從 outStack 取得，達到 O(1) 的直接存取。

## Pattern Recognition

當題目明確限制只能使用標準的 Stack 操作（例如 push、pop、top、empty），卻要求實作具有佇列行為（enqueue、dequeue、front）的資料結構時，這就是典型的 Stack-to-Queue Transformation Pattern。識別此 Pattern 的關鍵線索在於：資料的輸入端與輸出端需要分離，且必須透過兩個以上的 Stack 來進行順序的中繼與反轉。每當看到需要將 LIFO 轉換為 FIFO 的情境，且不允許直接使用動態陣列的隨機存取或雙向佇列時，即可立刻聯想到雙 Stack 架構。

## Common Mistakes

最常見的錯誤是在 outStack 尚未完全清空時，就直接將 inStack 的元素搬移到 outStack 中。這會破壞元素的先後順序，導致後進的元素反而比先前的元素更早被彈出，違反 FIFO 原則。正確的做法是：唯有當 outStack 為空時，才能將 inStack 的所有元素一次性全部傾倒（pour）至 outStack 之中。另一個常見的錯誤是誤以為每次 pop 都需要 O(n) 的時間，因而低估了均攤複雜度的優勢，導致在分析演算法效能時產生誤判。

## Complexity

時間複雜度：push 操作為 O(1)；pop、peek 與 empty 操作在最壞情況下為 O(n)（當需要搬移資料時），但在均攤分析（Amortized Analysis）下，每個元素最多被推入與彈出 inStack 與 outStack 各兩次，因此均攤時間複雜度（Amortized Time Complexity）為 O(1)。空間複雜度：O(n)，其中 n 為佇列中的元素總數，因為所有元素最終都會被儲存在兩個 Stack 之中。

## Digest

本單元探討如何使用兩個 Stack 實作 Queue。核心觀念在於維持 inStack 與 outStack 兩個容器：新元素一律進入 inStack；當 outStack 為空時，將 inStack 的元素全部傾倒至 outStack，藉此反轉順序達成 FIFO。此方法在均攤分析下具有 O(1) 的時間複雜度，是面試中考察資料結構轉換與均攤概念的經典題目。

## TypeScript Tip

在 TypeScript 中實作時，利用 private 方法封裝資料搬移邏輯可以大幅提升程式碼的可讀性與維護性。注意陣列彈出時可能產生的 undefined 型別，可透過非空斷言運算子（!）來處理。
```typescript
class StackQueueHelper {
    private stack: number[] = [1, 2, 3];
    public peekLast(): number {
        const val = this.stack[this.stack.length - 1];
        if (val === undefined) throw new Error("assertion failed");
        return val;
    }
}
const helper = new StackQueueHelper();
if (helper.peekLast() !== 3) throw new Error("assertion failed");
```

## Python Tip

在 Python 中，利用私有方法（如 _move_if_needed）來管理狀態轉換是良好的設計習慣。列表的 append 與 pop 操作均在尾端進行，效能為 O(1)。
```python
class PythonStackHelper:
    def __init__(self):
        self.data: list[int] = [1, 2, 3]

    def get_last(self) -> int:
        val = self.data[-1]
        assert val == 3, "assertion failed"
        return val

helper = PythonStackHelper()
assert helper.get_last() == 3, "assertion failed"
```

## Takeaway

雙 Stack 模擬 Queue 的精髓在於按需搬移與均攤 O(1)，確保出隊與入隊的高效能運作。

## Tomorrow Preview

明天我們將探討相反的經典題型：Implement Stack using Queues（id: stack-using-queues）。我們將學習如何利用佇列的 FIFO 特性來反向模擬堆疊的 LIFO 行為，並比較單一佇列與雙佇列實作在時間與空間複雜度上的差異。

## Today's Challenge

- **232** · 本題為 Stack-to-Queue Transformation 的原型題目，完全符合利用兩個 LIFO 堆疊模擬 FIFO 佇列的核心訴求。
  - Hint: 牢記只有當 outStack 完全耗盡時，才將 inStack 的所有元素一次性搬移過去。
