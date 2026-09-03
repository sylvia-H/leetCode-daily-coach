---
id: graph-adjacency-matrix-representation
title: Graph Adjacency Matrix Representation
module: graph
pattern_label: Data Representation
complexity_label: O(V^2) / O(V^2)
estimated_minutes: 10
exit_criteria:
  - 能使用矩陣在 O(1) 時間內檢查邊是否存在。
---
## Concept

Adjacency matrix（相鄰矩陣）是圖的另一種存法：配置一個 V*V 的二維陣列，`matrix[u][v]` 記錄「從頂點 u 到頂點 v 有沒有邊」——無權圖填 0／1 或布林值，帶權圖填權重、無邊處填 Infinity 這類哨兵值。列索引是起點、行索引是終點，所以無向圖的每條邊 (u, v) 要同時寫入 `matrix[u][v]` 與 `matrix[v][u]`，整張矩陣沿主對角線對稱；有向圖只寫一側，矩陣一般不對稱。

它與昨天的 adjacency list 是一對取捨。矩陣為每一對頂點都預留一格，不管那條邊存不存在，所以「u 到 v 有沒有邊」只是一次索引存取，O(1)；代價是空間固定 O(V^2)，而且列舉某頂點的鄰居時得掃完整列 V 格，與它實際有幾個鄰居無關。Adjacency list 剛好相反：空間 O(V + E)、列舉鄰居 O(deg)、查邊要掃鄰居清單。哪一種好，取決於圖有多稠密，以及演算法最常問的是「有沒有邊」還是「有哪些鄰居」。

## Thinking

從邊清單建矩陣和昨天一樣是三步，只是容器換了。第一步，確定 V 與編號：頂點必須是 0 到 V-1 的連續整數才能直接當索引；若頂點以字串命名，先建一張「名稱 → 編號」的對應表。第二步，配置 V*V 的二維陣列並全部填入「無邊」值——這一步就是 O(V^2)，圖再稀疏也省不掉。第三步，走訪邊清單，把每條邊寫進對應的格子；無向圖寫兩側。

用昨天的例子：V = 4，無向邊 (0, 1) 與 (0, 2)，頂點 3 孤立。建出來的矩陣第 0 列是 `[0, 1, 1, 0]`，第 1 列與第 2 列各只有第 0 格是 1，第 3 列全為 0。孤立頂點在矩陣裡天生就有自己的一列，不像 adjacency list 要預先建空清單才保得住。之後兩種基本操作各對應一種存取：查邊 `matrix[u][v] !== 0` 是一次讀取；列舉鄰居則是掃第 u 列，把值非 0 的行索引收集起來。明天的 DFS 走訪只需要「列舉鄰居」這一個操作，所以同一套走訪碼放在矩陣上每個頂點要花 O(V)，整體變成 O(V^2)——這正是走訪類題目多半選 adjacency list 的原因。

## Pattern Recognition

選矩陣的訊號有三個。一是圖稠密：E 接近 V^2 時，adjacency list 的 O(V + E) 與矩陣的 O(V^2) 已沒有差別，矩陣反而省掉每筆鄰居紀錄的額外開銷。二是演算法反覆問「u 和 v 之間有沒有邊」——例如判斷一組頂點是否兩兩相連、或在頂點數只有幾百的圖上做動態規劃，O(1) 查邊直接決定整體複雜度。三是題目輸入本身就是 n×n 的矩陣（像 `isConnected[i][j]`），那就不必轉換，直接把它當圖用。反過來，V 上萬而邊只有幾萬條的稀疏圖，矩陣連配置都配不出來，回頭用 adjacency list。另外要分清楚：格子圖 `grid[r][c]` 的每一格是「頂點」而不是「邊」，它不是相鄰矩陣，鄰居關係藏在上下左右的位置裡，明天會處理它。

## Common Mistakes

第一，初始化時所有列共用同一個內部陣列。JavaScript 寫 `new Array(V).fill(new Array(V).fill(0))`、Python 寫 `[[0] * V] * V`，得到的 V 列其實是同一個物件；此時執行 `matrix[0][1] = 1`，`matrix[3][1]` 也會變成 1，孤立頂點 3 憑空多出一條邊。正確寫法是每列各自建立：`Array.from({ length: V }, () => new Array(V).fill(0))`、`[[0] * V for _ in range(V)]`。第二，無向圖只寫 `matrix[u][v]` 不寫 `matrix[v][u]`：以邊 (0, 1) 為例，`matrix[1][0]` 仍是 0，從頂點 1 查頂點 0 會得到「無邊」，掃第 1 列也找不到任何鄰居。第三，帶權圖用 0 代表「無邊」：若題目允許權重為 0 的邊，這條邊會被當成不存在；無邊值應改用 Infinity、-1 或 null 這類不會與合法權重撞到的哨兵。第四，對大而稀疏的圖仍配置 V^2：V = 10^5 時矩陣有 10^10 格，以每格 8 位元組計約 80 GB，程式在初始化那一步就因記憶體耗盡而失敗，不是變慢而已。

## Complexity

時間：初始化 O(V^2)，加一條邊與查一條邊各 O(1)，列舉一個頂點的鄰居 O(V)，走訪整張圖 O(V^2)。空間：固定 O(V^2)，與邊數無關。對照 adjacency list：建表與走訪 O(V + E)、空間 O(V + E)、查邊 O(deg(u))。兩者的分水嶺就是 E 相對於 V^2 的大小，以及演算法主要做的是查邊還是列舉鄰居。

## Digest

Adjacency matrix 用 V*V 的二維陣列存圖，`matrix[u][v]` 記錄 u 到 v 有沒有邊或其權重；無向圖每條邊寫兩側、矩陣對稱，有向圖只寫一側。它以 O(V^2) 的固定空間換取 O(1) 查邊，但列舉鄰居要掃整列 O(V)，整圖走訪 O(V^2)，所以適合稠密圖、頂點數不大、或反覆查「兩點間有無邊」的場景；稀疏大圖連配置都做不到，要用 adjacency list。建表三步：頂點編號成 0 到 V-1、配置並填入無邊值、逐邊寫入。最常見的 bug 是初始化時所有列共用同一個陣列，改一格牽動整欄；其次是無向圖漏寫反向格、以及用 0 當無邊值撞上權重為 0 的邊。

## TypeScript Tip

`Array.from` 讓每一列各自建立；斷言同時檢查對稱寫入，以及「改第 0 列不會牽動第 3 列」。

```typescript
import { strict as assert } from 'node:assert';

function buildMatrix(n: number, edges: [number, number][]): number[][] {
  const m: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (const [u, v] of edges) {
    m[u]![v] = 1;
    m[v]![u] = 1; // 無向圖：兩側都寫
  }
  return m;
}
const neighbors = (m: number[][], u: number): number[] =>
  (m[u] ?? []).flatMap((w, v) => (w !== 0 ? [v] : []));

const m = buildMatrix(4, [[0, 1], [0, 2]]);
assert.equal(m[1]![0], 1); // 反向格也寫到了
assert.equal(m[3]![1], 0); // 列與列之間沒有別名
assert.deepEqual(neighbors(m, 0), [1, 2]);
assert.deepEqual(neighbors(m, 3), []);
```

## Python Tip

串列乘法複製的是參照而非內容；用推導式為每一列建立獨立串列。

```python
def build_matrix(n: int, edges: list[tuple[int, int]]) -> list[list[int]]:
    m = [[0] * n for _ in range(n)]  # 每列獨立
    for u, v in edges:
        m[u][v] = 1
        m[v][u] = 1  # 無向圖：兩側都寫
    return m

m = build_matrix(4, [(0, 1), (0, 2)])
assert m[1][0] == 1 and m[3][1] == 0
assert [v for v, w in enumerate(m[0]) if w] == [1, 2]

aliased = [[0] * 4] * 4  # 四列是同一個物件
aliased[0][1] = 1
assert aliased[3][1] == 1  # 改一列，四列全變
```

## Takeaway

Adjacency matrix＝V*V 格子換 O(1) 查邊；無向邊寫兩側、每列獨立配置，稠密圖或頻繁查邊才值得。

## Tomorrow Preview

明天用今天與昨天的兩種表示法實作圖的 DFS 走訪：從一個頂點出發沿邊一路深入、走不動就回頭，並用 visited 集合擋住環。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把 V = 4 的範例矩陣親手寫出來，並只用矩陣答出「0 與 2 之間有無邊」與「頂點 3 的鄰居有哪些」。
