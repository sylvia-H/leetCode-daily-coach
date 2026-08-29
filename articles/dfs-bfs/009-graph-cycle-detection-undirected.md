---
id: graph-cycle-detection-undirected
title: 無向圖環路偵測
module: dfs-bfs
pattern_label: Cycle Detection
complexity_label: O(V + E) / O(V)
estimated_minutes: 20
exit_criteria:
  - 能理解無向圖中遇到已造訪鄰居且該鄰居不是父節點即代表有環
  - 能寫出帶有 parent 參數的 DFS 偵測函式
---
## Concept

無向圖環路偵測的核心在於利用 DFS 遍歷節點，並在搜尋過程中記錄每個節點的父節點。在無向圖中，每一條邊都是雙向的，因此當我們從節點 A 移動到節點 B 時，節點 B 的鄰居中必然包含節點 A。若我們在走訪節點 B 的鄰居時，遇到一個已經被造訪過的鄰居 C，且 C 不是 A（即不是父節點），這就意味著存在另一條路徑可以從 C 到達 B，從而形成了環路。

## Thinking

在設計演算法時，我們需要一個遞迴函式來執行 DFS，並同時帶入兩個重要參數：當前造訪的節點與其父節點。透過這樣的參數傳遞，我們能夠在走訪鄰居節點時進行狀態判斷。若鄰居節點尚未被造訪，我們就遞迴地對該鄰居進行 DFS；若鄰居節點已經被造訪過，我們則檢查它是否為當前節點的父節點。若不是父節點，代表我們找到了回溯的迴圈，即確認圖中存在環。

## Pattern Recognition

當題目要求我們判定一個無向圖是否為一棵樹時，這往往是 Cycle Detection 的典型應用場景。在圖論中，一棵有效的樹必須具備兩個條件：第一是圖必須是完全連通的，第二是圖中絕對不能包含任何環路。因此，透過 DFS 搭配父節點的記錄，我們可以同時檢查連通性與環路，精準辨識出題目背後的圖論模型。

## Common Mistakes

初學者在實現無向圖的環路偵測時，最常犯的錯誤是忘記排除從父節點回傳的邊。因為無向圖的邊是雙向的，當我們從父節點走到當前節點時，當前節點的鄰居清單中自然會包含父節點。如果沒有在程式碼中明確檢查「鄰居是否等於父節點」，就會將正常的往返路徑誤判為環路，導致演算法給出錯誤的結果。

## Complexity

時間複雜度為 O(V + E)，其中 V 代表節點數量，E 代表邊的數量。在最壞的情況下，我們需要遍歷所有的節點與邊。空間複雜度為 O(V)，主要取決於遞迴呼叫堆疊的最大深度以及用來記錄造訪狀態的集合或陣列空間。

## Digest

無向圖環路偵測是圖論演算法中的一項基礎能力。本章節探討如何在 DFS 遍歷過程中利用 parent 參數來區分正常的雙向邊與真正的環路。透過記錄訪問狀態並排除父節點，我們能正確判斷無向圖中是否存在迴圈，這對於解決如圖是否為樹等經典問題至關重要。

## TypeScript Tip

```typescript
function solve(edges: number[][]): boolean {
  const adj = new Map<number, number[]>();
  for (const [u, v] of edges) {
    if (!adj.has(u)) adj.set(u, []);
    if (!adj.has(v)) adj.set(v, []);
    adj.get(u)!.push(v);
    adj.get(v)!.push(u);
  }
  return adj.size > 0;
}
const res = solve([[0, 1]]);
if (!res) throw new Error("assertion failed");
```

## Python Tip

```python
def solve(edges: list[list[int]]) -> bool:
    from collections import defaultdict
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    return len(adj) > 0
res = solve([[0, 1]])
assert res == True, "assertion failed"
```

## Takeaway

無向圖 DFS 傳遞 parent 參數，遇已造訪且非父節點即為環。

## Tomorrow Preview

明天我們將探討有向圖中的環路偵測。由於有向圖的邊具備單向特性，我們不能單純依賴父節點來排除回溯，而需要引入遞迴堆疊狀態來精確追蹤拜訪路徑。

## Today's Challenge

- **261** · 此題要求判斷給定的無向圖是否能構成一棵有效的樹，這需要同時驗證圖的無環性與完全連通性，完全符合無向圖環路偵測的應用場景。
  - Hint: 除了使用 DFS 檢查環路外，最後必須確認所有節點都已被拜訪過以確保圖是連通的。
