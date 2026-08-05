---
id: hash-table-concept-introduction
title: Introduction to Hash Table and Key-Value Mapping
module: hash-table
pattern_label: Hash Map
complexity_label: O(1) / O(n)
estimated_minutes: 10
exit_criteria:
  - Can explain why average lookup time is O(1)
  - Can write a basic map insertion and retrieval
---
## Concept

Hash Table 是一種透過 Hash Function 將鍵 (Key) 對應至值 (Value) 的資料結構，能夠提供平均時間複雜度為 O(1) 的快速查找、插入與刪除操作。傳統陣列使用連續整數作為索引，而 Hash Table 則允許使用字串、物件或其他型別作為鍵，透過雜湊演算法計算出資料在記憶體中的儲存位置。

## Thinking

思考 Hash Table 時，可以將其視為傳統陣列的延伸。傳統陣列以連續的整數作為索引來存取元素，而 Hash Table 允許我們將任意型別的鍵轉換為整數索引。當我們需要建立鍵與值之間的關聯，並且需要頻繁地進行查找、確認是否存在或更新數值時，Hash Table 是最直覺且高效的資料結構選擇。

## Pattern Recognition

當題目要求我們將獨特的鍵與值進行關聯，並需要進行頻繁的 O(1) 查找時，即可辨識出應使用 Hash Map 或 Hash Set Pattern。常見的線索包含：尋找陣列中是否存在某個元素、計算元素出現的頻率、尋找兩數之和的配對，或是偵測重複出現的資料。

## Common Mistakes

常見的迷思是假設 Hash Table 的所有操作在任何情況下都是嚴格的 O(1)。在最壞情況下，當發生嚴重的 Hash Collision (雜湊碰撞) 時，時間複雜度可能會退化至 O(n)。此外，未考慮記憶體配置與載載因子 (Load Factor)，或是錯誤地在迴圈內部進行高成本的雜湊計算，也是常見的效能瓶頸。

## Complexity

時間複雜度：平均 O(1)，最壞 O(n)（發生碰撞時）；空間複雜度：O(n)，用於儲存鍵值對。

## Digest

Hash Table 透過 Hash Function 實現了高效的 Key-Value 對應，核心優勢在於將查找時間從線性搜尋的 O(n) 降低至平均 O(1)。在實作時，我們必須理解雜湊碰撞的本質，並妥善運用 TypeScript 的 Map 與 Python 的 dict 來處理資料。掌握此 Pattern 後，我們能夠有效解決包含尋找互補數、元素去重及連續序列查找等經典演算法問題。

## TypeScript Tip

使用 TypeScript 開發時，應優先採用 Map<K, V> 而非 Record<string, V> 或普通物件。Map 允許任何型別作為 Key（例如物件或數字），且內建 size 屬性與高效的迭代方法。

```typescript
function tsTipDemo(): void {
  const scores = new Map<string, number>();
  scores.set("Alice", 95);
  scores.set("Bob", 88);
  
  if (scores.size !== 2) throw new Error("assertion failed: size mismatch");
}

tsTipDemo();
```

## Python Tip

Python 的 dict 具有高度優化的內部實作。在進行頻率計算時，建議使用 collections.defaultdict 或 collections.Counter 來簡化程式碼並提升可讀性。

```python
from collections import Counter

def py_tip_demo() -> None:
    items = ["apple", "banana", "apple", "orange"]
    counts = Counter(items)
    
    assert counts["apple"] == 2, "assertion failed: count mismatch"

py_tip_demo();
```

## TypeScript Corner

在 TypeScript 中，建議使用內建的 Map 物件來實作 Hash Table，而非使用原生 JavaScript 物件。這樣可以避免原型污染 (Prototype Pollution) 並支援任意型別的鍵。

```typescript
function testMap(): void {
  const map = new Map<string, number>();
  map.set("apple", 1);
  map.set("banana", 2);
  
  if (!map.has("apple")) throw new Error("assertion failed: key missing");
  if (map.get("apple") !== 1) throw new Error("assertion failed: value mismatch");
}

testMap();
```

## Python Corner

在 Python 中，標準的 dict() 字典結構即是基於雜湊表實作，提供高效的平均 O(1) 查找效能。針對只需要追蹤存在性的場景，亦可使用 set()。

```python
def test_dict() -> None:
    d: dict[str, int] = {}
    d["apple"] = 1
    d["banana"] = 2
    
    assert "apple" in d, "assertion failed: key missing"
    assert d["apple"] == 1, "assertion failed: value mismatch"

test_dict()
```

## Takeaway

Hash Table 提供平均 O(1) 的查找能力，是解決關聯性與頻率統計問題的核心工具。

## Tomorrow Preview

明日將深入探討 Two Pointers 技巧，學習如何在排序或未排序陣列中利用雙指標縮小搜尋範圍，進一步優化演算法的時間複雜度。

## Today's Challenge

- **1** · 利用 Hash Map 在走訪陣列的同時，以 O(1) 時間檢查目標數的互補數是否存在。
  - Hint: 邊走訪邊將數值及其索引存入 Hash Map，並檢查 target 減去當前數值後的結果是否已存在於 Map 中。
- **217** · 利用 Hash Set 紀錄已經訪問過的元素，快速確認是否有重複值出現。
  - Hint: 將陣列元素逐一放入 Set 中，若在放入前發現元素已存在於 Set 內，則代表有重複。
- **128** · 利用雜湊集合進行 O(1) 查找，尋找每個連續序列的起點，從而達到整體 O(n) 的時間複雜度。
  - Hint: 將所有數字放入 Hash Set 中，僅當數字減 1 不存在時才開始計算連續序列的長度。
