---
id: graph-connected-components
title: Graph Connected Components
module: graph
pattern_label: Connected Components
complexity_label: O(V + E) / O(V)
estimated_minutes: 12
exit_criteria:
  - >-
    Iterate through all nodes, launching DFS/BFS on unvisited nodes to count
    components.
---
## Concept

Graph Connected Components 探討如何將無向圖（undirected graph）劃分為多個獨立的子網路。在圖論中，一個 Connected Component 是一個極大的頂點集合，集合中的任意兩個頂點皆存在路徑相連，且該集合與外部頂點無邊相連。透過圖的遍布演算法（如 Depth-First Search 或 Breadth-First Search），我們能夠識別並計算圖中所有獨立的區塊，這在社群網路分析、影像處理（如計算島嶼數量）等領域有廣泛的應用。

## Thinking

要找出圖中的 Connected Components，核心思路在於系統性地遍布整張圖。演算法步驟如下：首先，初始化一個全域的走訪狀態追蹤結構（如 visited Set 或陣列），大小為總頂點數 V，初始值皆為未造訪。接著，透過迴圈迭代從 0 到 V-1 的每一個頂點。當遇到一個尚未被造訪的頂點時，代表我們發現了一個新的 Connected Component。此時將計數器加一，並立即以此頂點作為起點，發動 Depth-First Search 或 Breadth-First Search，將該子網路中所有可達的頂點標記為已造訪。當迴圈結束時，計數器的總數即為圖中 Connected Components 的總數。

## Pattern Recognition

當題目要求計算島嶼數量（Number of Islands）、省份數量（Number of Provinces）或識別獨立子網路時，即可直接對應至 Connected Components Pattern。此 Pattern 的辨識線索通常包含：圖結構為無向圖、題目關注全域的連通區塊總數、或者需要將圖中的節點分組。無論節點是以 adjacency list、adjacency matrix 或是座標矩陣形式呈現，其本質皆是將尋找互通區域的問題轉化為圖的遍布問題。

## Common Mistakes

最常見的錯誤包含：第一，未完整走訪所有頂點。部分開發者僅從頂點 0出發，忽略了圖可能包含多個互相不連通的子圖，導致遺漏孤立節點（isolated nodes）。第二，迴圈中未確實檢查 visited 狀態，導致重複發動遍布而造成無窮迴圈或計數錯誤。第三，將有向圖（directed graph）的強連通分量（Strongly Connected Components）與無向圖的連通分量混淆，導致採用錯誤的演算法（如 Kosaraju 或 Tarjan 演算法）而過度複雜化簡單問題。

## Complexity

Time Complexity: O(V + E)，其中 V 為頂點（Vertices）數量，E 為邊（Edges）數量。因為每個頂點與每條邊在走訪過程中最多被訪問常數次。Space Complexity: O(V)，主要取決於走訪時使用的 visited 資料結構以及遞本呼叫堆疊或佇列所佔用的記憶體空間。

## Digest

Graph Connected Components 是圖論的基礎。本單元重點在於利用 DFS 或 BFS 計算無向圖中的連通區塊數。我們透過外層迴圈確保所有節點皆被檢查，並以 visited 集合避免重複走訪。時間複雜度為 O(V + E)，空間複雜度為 O(V)。掌握此模式能有效解決多數關於子網路分組與島嶼計算的 LeetCode 題目。

## TypeScript Tip

```typescript
// TypeScript 技巧：利用 Set 與遞迴函式處理圖遍布
function helper(n: number): void {
  const visited = new Set<number>();
  if (visited.size !== 0) throw new Error("assertion failed");
}
helper(1);
```

## Python Tip

```python
# Python 技巧：使用串列生成式建立鄰接串列
def helper(n: int) -> None:
    adj = [[] for _ in range(n)]
    assert len(adj) == n, "assertion failed"
helper(3)
```

## Takeaway

掌握以全域迴圈配合 visited 狀態啟動 DFS/BFS 的標準樣板，即可輕鬆解決所有無向圖連通分量計算問題。

## Tomorrow Preview

明天我們將進一步探討 Directed Acyclic Graph 及其相關的拓樸排序（Topological Sort）演算法，學習如何處理具有相依關係的任務排程問題。

## Today's Challenge

- **323** · 本題直接要求計算無向圖中的連通分量數量，完美對應 Graph Connected Components 核心 Pattern。
  - Hint: 建立鄰接串列後，利用迴圈檢查每個未造訪的節點，並透過 DFS 擴展同一個 Component。
