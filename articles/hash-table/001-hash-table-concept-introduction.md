---
id: hash-table-concept-introduction
title: Introduction to Hash Table and Key-Value Mapping
module: hash-table
pattern_label: Hash Map
complexity_label: O(1) / O(n)
estimated_minutes: 10
exit_criteria:
  - 能說明為何平均查找時間是 O(1)
  - 能寫出基本的 map 插入與取值操作
---
## Concept

Hash Table 是一種以鍵值對（Key-Value Pair）為單位儲存資料的結構，提供平均 O(1) 的查找、插入與刪除。它的底層仍然是陣列：陣列之所以能 O(1) 存取，是因為連續記憶體加上整數索引可以直接算出位址；Hash Table 則透過 Hash Function 把任意型別的鍵（字串、數字、物件）轉換成一個固定範圍內的整數索引，等於把「整數索引才有的 O(1) 直達能力」擴展到任意鍵上。也因此，同一個 Hash Table 中鍵必須唯一（重複插入同鍵會覆寫舊值），而值可以重複。

## Thinking

理解 Hash Table 的核心是想清楚「平均 O(1)」從哪裡來、又在何時失效。查找一個鍵時，只需計算它的雜湊值並換算成索引，這個成本與資料量 n 完全無關，所以是常數時間。但不同的鍵可能被雜湊到同一個位置，稱為 Hash Collision（雜湊碰撞）；實作上會用鏈結串列或開放定址把碰撞的項目掛在同一個桶（bucket）裡。只要 Hash Function 分佈均勻，且結構在負載因子（Load Factor，元素數除以桶數）過高時自動擴容，每個桶平均只有常數個元素，查找便維持平均 O(1)。反之，最壞情況是大量鍵擠進同一個桶，查找退化成 O(n) 的線性搜尋——這就是「平均 O(1)、最壞 O(n)」的完整由來。

## Pattern Recognition

當題目需要「把獨特的鍵關聯到某個值」並且「頻繁查詢」時，就該想到 Hash Map / Hash Set：確認某元素是否存在或重複、統計出現頻率、在走訪時尋找與當前值配對的互補數、把資料依某種特徵分組。判斷用 Map 還是 Set 的準則很單純：查詢時需要附帶資訊（索引、次數）就用 Map；只需要「有沒有出現過」的成員資格就用 Set。

## Common Mistakes

最常見的迷思是把「平均 O(1)」當成「任何情況都 O(1)」——碰撞嚴重時單次操作可退化為 O(n)，擴容當下也需要 O(n) 搬移（由後續操作攤提）。第二個誤區是忽略雜湊本身的成本：以很長的字串當鍵，每次雜湊都要走訪整個字串，成本是字串長度而非常數。第三是語言層面的陷阱：在 TypeScript 用普通物件當字典，鍵會被強制轉成字串，還可能與原型屬性衝突，應優先使用 Map；Python 的 dict 則要求鍵是可雜湊（不可變）型別，list 不能當鍵，必要時得改用 tuple。

## Complexity

時間複雜度：查找、插入、刪除平均 O(1)，最壞 O(n)（碰撞嚴重或觸發擴容時）；空間複雜度：O(n)，用於儲存全部鍵值對與內部桶陣列。

## Digest

Hash Table 以 Hash Function 把任意鍵轉成內部陣列索引，把陣列的 O(1) 直達能力擴展到任意鍵上，將查找從線性搜尋的 O(n) 降到平均 O(1)。代價是必須面對雜湊碰撞：靠均勻的雜湊分佈與負載因子控制，平均效能才得以成立，最壞情況仍會退化為 O(n)。鍵唯一、值可重複。掌握這個心智模型後，存在性判斷、頻率統計、互補數配對等問題都有了共同的高效解法基礎。

## TypeScript Tip

使用 TypeScript 開發時，應優先採用 Map<K, V> 而非普通物件。Map 允許任何型別作為 Key，且內建 size 屬性與高效的迭代方法。

```typescript
function tsTipDemo(): void {
  const scores = new Map<string, number>();
  scores.set("Alice", 95);
  scores.set("Bob", 88);
  scores.set("Alice", 97);

  if (scores.size !== 2) throw new Error("assertion failed: size mismatch");
  if (scores.get("Alice") !== 97) throw new Error("assertion failed: overwrite");
}

tsTipDemo();
```

## Python Tip

Python 的 dict 具有高度優化的內部實作，是雜湊表的直接對應；成員判斷用 in 運算子即可。

```python
def py_tip_demo() -> None:
    scores = {"Alice": 95, "Bob": 88}
    scores["Alice"] = 97

    assert len(scores) == 2, "assertion failed: length mismatch"
    assert "Bob" in scores, "assertion failed: membership"
    assert scores["Alice"] == 97, "assertion failed: overwrite"

py_tip_demo()
```

## Takeaway

Hash Table 用雜湊函數把任意鍵變成陣列索引，以平均 O(1) 的查找換取 O(n) 空間。

## Tomorrow Preview

明天將學習 Frequency Counting with Hash Map：把元素本身當作鍵、出現次數當作值，用一次走訪統計整個集合的頻率分佈，是雜湊表最常見的實戰起手式。

## Today's Challenge

- **1** · 走訪陣列的同時，用 Hash Map 以 O(1) 查詢目標值減去當前值的互補數是否出現過。
  - Hint: 邊走訪邊把數值與索引存入 Map，先查互補數、再存當前值，一趟即可完成。
- **217** · 用 Hash Set 記錄看過的元素，以 O(1) 成員判斷快速偵測重複值。
  - Hint: 逐一放入 Set 前先檢查是否已存在，存在即代表有重複。
- **128** · 用 Hash Set 提供 O(1) 存在性查詢，只從每段連續序列的起點開始延伸，整體 O(n)。
  - Hint: 全部放入 Set 後，僅當某數減 1 不存在時才把它當作起點向右延伸計數。
