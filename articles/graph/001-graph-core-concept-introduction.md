---
id: graph-core-concept-introduction
title: Graph Core Concept Introduction
module: graph
pattern_label: Graph Modeling
complexity_label: O(V + E) / O(V + E)
estimated_minutes: 10
exit_criteria:
  - 能區分有向邊與無向邊。
---
## Concept

圖（Graph）是描述「物件之間成對關係」的資料結構，由頂點（Vertex，或稱 Node）與邊（Edge）組成：頂點代表獨立的實體，邊代表兩個實體之間的關係。形式上，一張圖就是「頂點集合＋邊集合」，除此之外沒有任何附加限制——這正是它比陣列（線性）與樹（階層）更一般化的原因。你先前學過的樹其實是圖的特例：連通、無環、每個節點至多一個父節點。把這三個限制逐一拿掉，就得到一般的圖：可以有環（A 連 B、B 連 C、C 又連回 A）、一個頂點可以被多個頂點指到（不再有唯一父節點）、整張圖也可以拆成互不相連的好幾塊（非連通）。

邊有兩個互相獨立的屬性維度。第一是方向：無向邊（Undirected）代表對稱關係，如「互為好友」；有向邊（Directed）代表單向關係，如「甲追蹤乙」，箭頭指向哪邊，關係就只在那個方向成立。第二是權重（Weight）：邊可以附帶數值表示距離、成本或容量，也可以不帶。方向與權重可以自由組合，建模時要分開判斷兩次。

## Thinking

拿到問題後，建模只需回答三個問題。第一：誰是頂點？找出問題中的獨立實體——人、城市、課程、狀態。第二：什麼是邊？找出實體之間的成對關係——認識、道路、先修、轉換。第三：這個關係是否對稱、是否帶數值？對稱用無向邊，單向用有向邊；有距離或成本就掛上權重。

要特別留意「隱式圖（Implicit Graph）」：許多題目不會給你邊清單，而是給一個初始狀態與一組轉換規則。此時每個狀態就是一個頂點、每次合法轉換就是一條邊，整張圖在走訪過程中即時展開。能不能看出「這其實是一張圖」，往往比會不會走訪更關鍵。

## Pattern Recognition

出現以下訊號時，優先考慮 Graph Modeling：題目描述網路（社交、電腦、交通）、相依關係（先修課、工作排程）或任何多對多的連結；輸入直接給出成對關係的清單；題目問「能否到達」「最少幾步」「是否成環」「分成幾群」。反之，若關係嚴格是一對多且保證無環（每個節點只有一個上層），樹的工具就夠用，不必動用一般圖的機制。

## Common Mistakes

最大的陷阱是把圖當樹處理。樹保證無環，所以走訪不需要記錄去過哪裡；圖沒有這個保證，走訪時若不維護 visited 集合，環會讓你在 A、B、C 之間無限繞圈。同理，樹保證連通，從根出發走一遍就能碰到所有節點；圖可能有多個連通元件，必須對每個尚未造訪的頂點都發起一次走訪才算走完。另一個常見錯誤是方向處理不一致：把對稱關係建成單向、或把單向關係當雙向走，兩者都會得到一張語意錯誤的圖，後續演算法再正確也救不回來。

## Complexity

時間複雜度：建立圖需要處理每個頂點與每條邊各一次，為 O(V + E)；之後多數走訪演算法也是 O(V + E)，因為 visited 讓每個頂點至多展開一次、每條邊至多被檢查常數次。空間複雜度：以 adjacency list 儲存需要 V 個表頭加上每條邊的鄰居紀錄（無向邊在兩側各存一筆），為 O(V + E)；adjacency matrix 則不論邊多寡都要 O(V^2)，只適合稠密圖（Dense Graph）。

## Digest

圖由頂點與邊組成：頂點是實體，邊是成對關係。樹是圖的特例——拿掉「無環、連通、唯一父節點」三個限制就是一般圖。邊有方向與權重兩個獨立維度：對稱關係用無向邊、單向關係用有向邊，是否帶權另外判斷。建模三問：誰是頂點、什麼是邊、關係是否對稱與帶權。走訪一般圖必須記錄 visited，否則環會造成無限迴圈；也別忘了圖可能不連通，要對每個連通元件各走一次。建圖與走訪的時間都是 O(V + E)。

## TypeScript Tip

用 `Map<number, number[]>` 感受有向與無向的差別：無向邊要寫入兩側，有向邊只寫起點那側。

```typescript
import { strict as assert } from 'node:assert';

function addEdge(g: Map<number, number[]>, u: number, v: number, directed: boolean): void {
  if (!g.has(u)) g.set(u, []);
  g.get(u)!.push(v);
  if (!directed) addEdge(g, v, u, true);
}

const g = new Map<number, number[]>();
addEdge(g, 1, 2, false); // 無向：兩側都要記
addEdge(g, 1, 3, true); // 有向：只記起點那側
assert.deepEqual(g.get(1), [2, 3]);
assert.deepEqual(g.get(2), [1]);
assert.equal(g.get(3), undefined); // 有向邊的終點不會自動出現
```

## Python Tip

`defaultdict(list)` 讓第一次遇到某頂點時自動生出空清單，省去初始化判斷。

```python
from collections import defaultdict

def add_edge(g: dict[int, list[int]], u: int, v: int, directed: bool) -> None:
    g[u].append(v)
    if not directed:
        g[v].append(u)

g: dict[int, list[int]] = defaultdict(list)
add_edge(g, 1, 2, directed=False)
add_edge(g, 1, 3, directed=True)
assert g[1] == [2, 3]
assert g[2] == [1]
assert 3 not in g  # in 判斷不會觸發 defaultdict 建鍵
```

## Takeaway

圖＝頂點（實體）＋邊（成對關係）；先分清有向或無向，走訪時記得 visited 與非連通的可能。

## Tomorrow Preview

明天起我們把圖真正放進程式：先學 adjacency list 這個最常用的圖表示法，隨後進入 DFS 與 BFS 的走訪核心觀念。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請找一個生活中的網路（捷運路線、課程先修關係），口頭回答建模三問：誰是頂點、什麼是邊、有向還是無向。
