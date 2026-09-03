---
id: array-memory-layout
title: Array Memory Layout and Indexing
module: array
pattern_label: Direct Access
complexity_label: O(1) / O(1)
estimated_minutes: 10
exit_criteria:
  - 能正確計算給定索引的記憶體位移
  - 理解為何陣列索引從 0 開始
---
## Concept

陣列（Array）是一塊**連續的記憶體空間**，依序存放型別相同、大小固定的元素。「連續」與「等寬」這兩個條件正是陣列一切效能特性的來源：只要知道起始位置（基底位址，Base Address）與每個元素佔用的位元組數，第 i 個元素的位址就能直接算出——`位址 = 基底位址 + i * 元素大小`。這個計算只需一次乘法加一次加法，跟陣列裡有多少元素完全無關，所以按索引存取任意元素是 O(1) 的隨機存取（Random Access）。對照組是鏈結串列（Linked List）：節點散落在記憶體各處，要到第 i 個節點只能從頭沿著指標走 i 步。索引為什麼從 0 開始？因為索引的本質不是「第幾個」，而是「距離起點幾個元素寬」的**偏移量（Offset）**：第一個元素就落在起點上，偏移量是 0，索引自然從 0 起算。

## Thinking

用具體數字把公式走一遍：假設一個 32 位元整數陣列的基底位址是 1000，每個元素佔 4 bytes，那麼索引 3 的元素位址就是 `1000 + 3 * 4 = 1012`。注意公式成立的前提：若元素大小不固定，偏移量就無法用乘法算出，只能逐一累加——這解釋了為什麼傳統陣列要求元素同型別、等寬。再往硬體層想一步：CPU 從主記憶體讀資料時，是以快取行（Cache Line，通常 64 bytes）為單位整批載入的。因為陣列元素相鄰，讀取 `arr[0]` 時，後面十幾個元素多半已被一併搬進快取，循序存取幾乎不必再等主記憶體。這種快取區域性（Cache Locality）是「走訪陣列比走訪鏈結串列快得多」的真正原因——兩者同為 O(n)，每一步的常數成本卻差了一個數量級。

## Pattern Recognition

當你能「用一個已知的整數直接指出資料的位置」時，就是 Direct Access 的主場：動態規劃的填表法（Tabulation）用索引代表子問題編號；計數陣列用字元編碼當索引統計出現次數；雜湊表底層用雜湊值換算出桶（Bucket）的索引。共同特徵是——不必搜尋，位置本身就是答案的一部分。反過來說，若操作以「在中間插入或刪除」為主，陣列必須搬移後方所有元素、成本是 O(n)，此時連續配置反而成了包袱。

## Common Mistakes

最常見的錯誤是混淆索引與長度：長度為 n 的陣列，合法索引是 0 到 n - 1，迴圈條件誤寫成 `i <= n` 就會試圖存取不存在的第 n 格，觸發越界錯誤（Index Out of Bounds）或拿到 undefined。第二個誤區是把高階語言的「陣列」直接等同於底層連續記憶體：JavaScript 的 Array 是物件，遇到稀疏元素或混合型別時，引擎可能改用非連續的內部表示；Python 的 list 存的是**指向各物件的參考**，連續的是參考本身，資料實體仍散落各處。第三是忽略動態擴容（Dynamic Resizing）：附加元素超出容量時，整塊資料要搬到更大的新空間，單次成本 O(n)，只是攤銷（Amortized）之後平均仍是 O(1)。

## Complexity

按索引隨機存取為 O(1)：位址由一次乘法與一次加法直接算出，與元素數量無關。走訪或線性搜尋為 O(n)。空間上，n 個元素佔用 O(n) 的連續儲存；動態擴容的單次搬遷為 O(n)，攤銷後每次附加平均 O(1)。

## Digest

陣列以連續記憶體存放等寬元素，位址公式「基底位址 + 索引 * 元素大小」讓按索引存取只需一次乘加運算、與資料量無關，這就是 O(1) 隨機存取的全部祕密；索引是「距起點幾個元素寬」的偏移量，所以從 0 開始。連續配置還帶來快取區域性：相鄰元素隨快取行整批載入，讓循序走訪遠快於鏈結串列。代價是中間插入刪除要搬移 O(n) 個元素、擴容要整塊搬遷。高階語言另有細節：JavaScript 的 Array 是物件、Python 的 list 存參考，未必是底層意義的連續陣列。

## TypeScript Tip

JavaScript 的 Array 不保證底層連續；要真正等寬連續的數值儲存請用 TypedArray。把位址公式寫成函式，再拿實測的 `byteLength` 驗證它。

```typescript
import assert from "node:assert";
const buf = new Int32Array([10, 20, 30, 40]);
const S = Int32Array.BYTES_PER_ELEMENT;
const offsetOf = (i: number): number => i * S;
assert.strictEqual(offsetOf(3), 12);
assert.strictEqual(offsetOf(buf.length), buf.byteLength);
assert.strictEqual(buf[offsetOf(2) / S] ?? 0, 30);
```

## Python Tip

Python 的 list 是「參考的陣列」，元素實體散落各處；需要 C 語言等級的同質連續儲存時，標準函式庫的 `array` 模組（或第三方的 NumPy）才是真正的等寬陣列，每個元素只佔固定位元組數。

```python
import array

arr = array.array("i", [10, 20, 30, 40])
assert arr.itemsize == 4      # 每個元素固定佔 4 bytes
assert arr[2] == 30           # 索引 2 = 距起點 2 * 4 bytes 的偏移
assert len(arr) == 4          # 合法索引為 0 到 3
```

## Takeaway

陣列＝連續等寬儲存；位址 = 基底 + 索引 * 元素大小，一次乘加即達，故隨機存取 O(1)、索引從 0 起算。

## Tomorrow Preview

明天進入 Array Linear Scan：學會用一條迴圈安全走訪整個陣列，並在過程中累積狀態——這是所有陣列演算法的第一塊積木。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。建議動手驗證今天的公式：宣告一個小陣列，親手算出每個索引的位元組偏移量，並想清楚為什麼合法索引止於 n - 1。
