---
id: matrix-bfs-multi-directional
title: 二維網格的 BFS 擴散
module: dfs-bfs
pattern_label: Grid BFS
complexity_label: O(R * C) / O(R * C)
estimated_minutes: 20
exit_criteria:
  - 能使用 Queue 在網格中進行多方向的廣度優先擴散
  - 能處理多源起點同時開始的擴散問題
---
## Concept

二維網格的 BFS 擴散（Grid BFS）是一種處理網格擴散、波紋蔓延以及最短路徑問題的經典圖論演算法。當問題涉及多個起點同時向外擴散，且每步移動的代價均等時，透過廣度優先搜尋（Breadth-First Search）結合佇列（Queue）結構，可以確保所有節點均依據距離起點的步數由近及遠被依序訪問，從而求出全域的最佳解。

## Thinking

在面對多起點擴散情境時，若對每個起點分別獨立執行一次 BFS，會導致重複拜訪相同節點，時間複雜度暴增。正確的思考方式是將所有的起始狀態（例如所有初始腐爛的橘子、水源或是障礙物）在初始化階段同時放入同一個 Queue 中。這樣一來，BFS 能夠在同一層級中同時向四個方向（上、下、左、右）向外推進，模擬出類似波紋擴散的物理過程，確保每一個格子都只被訪問一次。

## Pattern Recognition

當題目具備以下特徵時，即可辨識為 Grid BFS 多起點擴散 Pattern：1. 問題發生在二維網格（Matrix / Grid）上；2. 狀態涉及擴散、蔓延、腐爛、水流或尋找距離最近的特定目標；3. 允許從多個來源同時開始；4. 每一步的權重相同（通常為 1）。經典代表題包含 LeetCode 994、542、1162 等。

## Common Mistakes

最常見的錯誤是使用迴圈對每個起點分別呼叫單一源頭的 BFS 函式，這會使最壞情況下的時間複雜度退化至 O(R^2 * C^2)。另一個常見錯誤是在將節點加入 Queue 時未立即標記為已訪問（Visited），導致同一個節點被多個起點重複加入，引發無限迴圈或記憶體溢出。

## Complexity

時間複雜度為 O(R * C)，其中 R 為網格的列數，C 為網格的行數。每個格子最多被加入 Queue 一次並被訪問一次。空間複雜度同為 O(R * C)，用於儲存 Queue 中的節點以及訪問狀態標記陣列（Visited Matrix）。

## Digest

今日重點聚焦於 Grid BFS 多源同步擴散觀念。相較於單一起點的 BFS，多源擴散的核心技巧在於『初始化時將所有源頭同時入隊』。在 TypeScript 實作中，我們使用陣列模擬 Queue 並透過指標優化效能；在 Python 中則使用 collections.deque 確保高效的左右側操作。只要掌握層級擴散與狀態更新，即可完美解決各類網格傳播與最短距離問題。

## TypeScript Tip

```typescript
// TypeScript 效能優化技巧：使用指標替代 shift()
function efficientQueueExample(): number {
    const queue: number[] = [1, 2, 3];
    let head = 0;
    while (head < queue.length) {
        const current = queue[head++];
        // 處理節點
    }
    if (head !== 3) throw new Error("assertion failed");
    return head;
}
efficientQueueExample();
```

## Python Tip

```python
# Python 效能優化技巧：使用 collections.deque
from collections import deque


def deque_example() -> int:
    q = deque([1, 2, 3])
    while q:
        val = q.popleft()
    assert len(q) == 0, "assertion failed"
    return 0


deque_example()
```

## Takeaway

多源 Grid BFS 的關鍵在於將所有起點同時加入 Queue，透過層級推進實現 O(R * C) 的全域擴散模擬。

## Tomorrow Preview

明天我們將探討「二維網格的 DFS 迴圈與區域計算（Flood Fill）」，學習如何利用深度優先搜尋找出封閉區域或計算網格中島嶼的面積，進一步深化對二維陣列走訪的掌握。

## Today's Challenge

- **994** · 此題要求計算所有新鮮橘子完全腐爛所需的最小分鐘數，且腐爛源頭可能有多個，完美對應多源 Grid BFS 同步擴散的 Pattern。
  - Hint: 先將所有值為 2 的格子加入 Queue，並記錄新鮮橘子總數。每次從 Queue 取出時向四個方向擴散，將值為 1 的格子轉為 2 並遞減新鮮橘子數。
