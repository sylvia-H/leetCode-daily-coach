---
id: graph-adjacency-list-representation
title: Graph Adjacency List Representation
module: graph
pattern_label: Data Representation
complexity_label: O(V + E) / O(V + E)
estimated_minutes: 12
exit_criteria:
  - 能從邊的列表成功建立 adjacency list。
---
## Concept

Adjacency list（相鄰串列）是把圖存進記憶體最常用的方式：為每個頂點準備一個容器，裡面放所有與它直接相連的鄰居。整個結構就是一個「頂點 → 鄰居集合」的映射，頂點編號是 0 到 V-1 的連續整數時用陣列實作，編號不連續或以字串命名時用雜湊表實作。

它的關鍵性質是「只存實際存在的邊」。對照 adjacency matrix：矩陣不管圖裡有幾條邊，一律配置 V*V 個格子；當 V 是十萬時就是一百億格，記憶體根本放不下。而多數題目的圖是稀疏的（E 遠小於 V^2），adjacency list 只需要 V 個表頭加上 E 筆鄰居紀錄（無向圖每條邊存兩筆），空間 O(V + E)，這正是它成為預設選擇的原因。代價是「查任兩點之間有無邊」必須掃描鄰居清單，不像矩陣是 O(1)——但走訪類演算法要的是「列舉某頂點的所有鄰居」，這件事 adjacency list 恰好最快。

## Thinking

題目給的圖幾乎都是邊清單（edge list）形式：一組 (u, v) 配對。轉成 adjacency list 的流程固定三步。第一步，確認圖的性質：有向還是無向？這決定每條邊要寫入一側還是兩側。第二步，選容器：連續整數編號用「長度為 V 的陣列，每格放一個清單」；編號稀疏或是字串就用 Map 或 dict。第三步，先為所有頂點建立空清單，再走訪邊清單逐條寫入——無向圖的每條邊 (u, v) 要同時執行「u 的清單加入 v」與「v 的清單加入 u」。

為什麼要「先建空清單」而不是邊讀邊建？因為圖裡可能有度數為零的孤立頂點，它不會出現在任何一條邊裡；若只在讀到邊時才建立表項，這些頂點就從結構中消失了，之後統計連通元件或列舉全部頂點時就會少算。

## Pattern Recognition

看到這些訊號，就先把輸入轉成 adjacency list：輸入是邊清單，而接下來要走訪（DFS／BFS）、找路徑、數連通元件；圖的規模大而邊相對稀疏；需要反覆查詢「某個頂點的所有鄰居」。也有題目直接以鄰居指標的形式給圖——節點物件內含 neighbors 清單——那就是 adjacency list 的物件版，列舉鄰居的手法完全相同，差別只在索引鍵從整數編號換成節點本身。

## Common Mistakes

第一名的錯誤是無向圖漏掉反向邊：只寫了「u 的清單加 v」，忘了對稱地在 v 的清單加 u。走訪時只會查「目前頂點自己的清單」，少了那一筆，從 v 出發就看不到 u，連通的圖會被誤判成斷裂。第二是對還沒初始化的容器直接寫入：JavaScript 對 `map.get(u)` 取回的 undefined 呼叫 push 會拋 TypeError，Python 對一般 dict 不存在的鍵取值會拋 KeyError——解法是先建好空清單，或改用 defaultdict(list) 這類預設容器。第三是前面說過的孤立頂點消失問題。最後提醒：adjacency list 不會替你過濾重複邊或自環，若題目允許它們出現，寫入前要想清楚是否需要去重。

## Complexity

時間複雜度 O(V + E)：初始化 V 個空清單花 O(V)；走訪邊清單，每條邊在端點的清單尾端寫入一到兩次，每次均攤 O(1)，共 O(E)。空間複雜度 O(V + E)：V 個表頭加上每條邊的一到兩筆紀錄。對照組 adjacency matrix 的空間與初始化都是 O(V^2)，只有在圖很稠密、或需要 O(1) 查詢兩點間有無邊時才值得。

## Digest

Adjacency list 把每個頂點對應到它的鄰居清單，只存實際存在的邊，空間 O(V + E)，是稀疏圖的預設表示法。從邊清單建表三步驟：判斷有向或無向、依編號型態選陣列或 Map 當容器、先建空清單再逐邊寫入。無向圖每條邊必須寫入兩側，漏掉反向邊是最常見的 bug；孤立頂點要靠預先初始化才不會消失。建表時間 O(V + E)；它換走的是 O(1) 查邊能力，換來最快的鄰居列舉。

## TypeScript Tip

頂點是 0 到 n-1 時，用 `Array.from` 一次建好 n 個空清單，孤立頂點自然保留。

```typescript
import { strict as assert } from 'node:assert';

function buildAdj(n: number, edges: [number, number][]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u]!.push(v);
    adj[v]!.push(u); // 無向圖：反向邊不可漏
  }
  return adj;
}

const adj = buildAdj(4, [[0, 1], [0, 2]]);
assert.deepEqual(adj[0], [1, 2]);
assert.deepEqual(adj[1], [0]);
assert.deepEqual(adj[3], []); // 孤立頂點仍有自己的空清單
```

## Python Tip

`defaultdict(list)` 免去初始化判斷；但列舉所有頂點時，記得孤立頂點不在其中。

```python
from collections import defaultdict

def build_adj(edges: list[tuple[int, int]]) -> dict[int, list[int]]:
    adj: dict[int, list[int]] = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)  # 無向圖：反向邊不可漏
    return adj

adj = build_adj([(0, 1), (0, 2)])
assert adj[0] == [1, 2]
assert adj[1] == [0]
assert 3 not in adj  # 孤立頂點不會自動出現在 defaultdict 裡
```

## Takeaway

Adjacency list＝頂點到鄰居清單的映射；無向邊寫兩側、先建空清單保住孤立頂點，空間 O(V + E)。

## Tomorrow Preview

明天我們將認識另一種表示法 adjacency matrix，比較它與 adjacency list 在空間與查詢上的取捨，接著用今天建好的結構實作圖的 DFS 走訪。

## Today's Challenge

- **133** · 題目直接以「節點物件＋neighbors 清單」的形式給圖，正是 adjacency list 的物件版；複製整張圖必須沿著鄰居關係走訪，並為每個節點重建對應的鄰接結構。
  - Hint: 用 Hash Map 記錄「原節點 → 複製節點」的對應，遇到已複製過的節點直接取用，環才不會讓你無限複製下去。
