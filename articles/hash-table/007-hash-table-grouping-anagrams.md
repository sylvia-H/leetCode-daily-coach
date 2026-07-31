---
id: hash-table-grouping-anagrams
title: Grouping Elements by Canonical Hash Key
module: hash-table
pattern_label: Canonical Key Grouping
complexity_label: O(n * k log k) / O(n * k)
estimated_minutes: 15
exit_criteria:
  - Can generate a canonical representation for items that share properties
  - Can store and append items to lists inside a hash map
---
## Concept

Grouping Elements by Canonical Hash Key 是一種透過將資料轉換成「標準化鍵值」（Canonical Hash Key）來進行分類與分組的核心演算法模式。當我們面對需要將具備相同本質但外觀不同的資料（例如字位變異詞 Anagrams、位移字串 Shifted Strings、或是具有相同頻率分佈的結構）聚合在一起時，若直接進行兩兩比較，時間複雜度往往會高達 O(n^2) 甚至更高。透過 Hash Map 的輔助，我們能夠將每個元素映射到一個唯一的標準化鍵值上，進而將查詢與插入的時間複雜度優化至 O(1)。這種模式的核心精神在於「特徵萃取」，即過濾掉不影響分組結果的表面差異（例如字元順序），萃取出決定性的本質特徵（例如排序後的字元序列或相對差值元組），作為雜湊表的鍵值。

## Thinking

在思考這類分組問題時，首要任務是定義「什麼是相同」。以 Group Anagrams 為例，'eat'、'tea' 和 'ate' 雖然字元順序不同，但它們包含相同的字元與各自的數量。因此，我們的思考邏輯會經歷以下步驟：第一步，辨識分組依據：題目要求將互為 Anagrams 的字串歸納至同一個集合中。第二步，決定 Canonical Form：我們需要將每一個字串轉化為一個不因排列順序而改變的唯一簽章（Signature）。最直覺的做法是將字串的字元進行排序，例如將 'eat' 排序後得到 'aet'。第三步，建構 Hash Map：以這個排序後的字串作為 Key，而原本的字串陣列作為 Value。第四步，走訪輸入陣列：對於每個字串，計算其 Canonical Key，檢查 Hash Map 中是否存在該 Key。若存在，則將原字串推入對應的陣列中；若不存在，則建立一個包含該字串的新陣列並放入 Hash Map 中。最後，將 Hash Map 中的所有 Value 集合回傳即可。

## Pattern Recognition

當題目要求「將具有相同特徵、相同屬性、或經過某種對稱轉換後等價的元素進行分組或歸類」時，即可強烈懷疑此問題適用 Canonical Key Grouping 模式。常見的辨識線索包括：第一，題目出現關鍵字如 group、categorize、anagram、shifted strings、isomorphic；第二，元素之間存在某種等價關係（Equivalence Relation），且這種等價關係可以透過某種標準化函數（Normalization Function）消除雜訊（如順序、大小寫、相對位移量）；第三，輸出結果通常為一個二維陣列或分組集合（List of Lists）。若符合上述特徵，通常不需要考慮複雜的圖論演算法，直接運用 Hash Map 結合標準化鍵值即可在線性或對數時間內完美解開。

## Common Mistakes

開發者在實作此模式時最常犯的錯誤，是直接將未經標準化的原始資料或不可雜湊（Un-hashable）的結構作為 Hash Map 的 Key。具體錯誤包括：第一，直接使用未排序的字串作為 Key，導致實際上互為 Anagrams 的字串因為順序不同而被分到不同的桶子中。第二，嘗試直接使用 JavaScript 的 Array 作為物件的 Key，由於 JavaScript 物件鍵值預設會將其隱式轉換為字串，或是因為參考相等性（Reference Equality）導致無法正確命中。第三，在 Python 中使用 List 作為字典的 Key，由於 List 是可變動（Mutable）且不可雜湊的，會直接引發 TypeError。第四，誤用字元ASCII總和作為 Key，這會忽略字元組合的差異而導致嚴重的雜湊碰撞（Hash Collision），例如 'ab' 和 'ba' 的總和相同，但 'ac' 和 'bb' 的總和也可能相同，無法正確區分。

## Complexity

時間複雜度為 O(n * k log k)，其中 n 是陣列中元素的總個數，k 是字串的最大長度。主要的開銷來自於對每個字串進行排序（k log k），共需要處理 n 個字串；若使用計數排序（Counting Sort）則可將單一字串處理時間優化至 O(k)。空間複雜度為 O(n * k)，用於儲存 Hash Map 中的所有字串及其對應的鍵值，在最壞情況下所有字串皆不相同時，需要完整保留所有原始資料。

## Digest

今日課程深入探討了 Canonical Key Grouping 模式，核心在於將複雜且具備對稱關係的資料轉換為標準化簽章，並以此作為 Hash Map 的鍵值進行高效分組。我們剖析了以字串排序或頻率元組作為 Key 的原理，並強調了避免雜湊碰撞與處理語言特性的重要性。透過實作題號 49 Group Anagrams 與題號 249 Group Shifted Strings，我們學會了如何萃取資料本質，將原本需要兩兩比較的 O(n^2) 問題優化至 O(n * k log k)。掌握此模式後，面對各類型的分類與聚合題目將能游刃有餘。

## TypeScript Tip

```typescript
import assert from 'node:assert';
function groupShiftedStrings(strings: string[]): string[][] {
  const map = new Map<string, string[]>();
  for (const s of strings) {
    const key = s
      .split('')
      .map((c, i, arr) =>
        i === 0 ? 0 : (c.charCodeAt(0) - arr[i - 1].charCodeAt(0) + 26) % 26
      )
      .join(',');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.values());
}
const res = groupShiftedStrings(['abc', 'bcd', 'acef', 'xyz', 'az', 'ba', 'a']);
assert.strictEqual(res.length, 4);
```

## Python Tip

```python
import collections

def group_shifted_strings(strings: list[str]) -> list[list[str]]:
    groups = collections.defaultdict(list)
    for s in strings:
        key = tuple(
            (ord(s[i]) - ord(s[i-1])) % 26 
            for i in range(1, len(s))
        )
        groups[key].append(s)
    return list(groups.values())

res = group_shifted_strings(["abc", "bcd", "acef", "xyz", "az", "ba", "a"])
assert len(res) == 4
```

## TypeScript Corner

```typescript
function groupAnagrams(strs: string[]):
string[][] {
  const map = new Map<string, string[]>();
  for (const str of strs) {
    const sortedKey = str.split('').sort().join('');
    if (!map.has(sortedKey)) {
      map.set(sortedKey, []);
    }
    map.get(sortedKey)!.push(str);
  }
  const result = Array.from(map.values());
  if (result.length === 0 && strs.length > 0) {
    throw new Error('Assertion failed: Result should not be empty');
  }
  return result;
}
const output = groupAnagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']);
if (output.length !== 3) {
  throw new Error('Assertion failed: Expected 3 groups');
}
```

## Python Corner

```python
from collections import defaultdict

def group_anagrams(strs: list[str]) -> list[list[str]]:
    map_groups = defaultdict(list)
    for s in strs:
        sorted_key = ''.join(sorted(s))
        map_groups[sorted_key].append(s)
    result = list(map_groups.values())
    assert len(result) == 3 or len(strs) == 0, "Assertion failed: Expected groups"
    return result

output = group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"])
assert len(output) == 3
```

## Takeaway

萃取本質特徵為標準化鍵值，善用 Hash Map 消除重複比較，將分組複雜度由 O(n^2) 降至線性對數級別。

## Tomorrow Preview

明天我們將探討 Sliding Window 模式，學習如何在連續子陣列或子字串的問題中，利用雙指標動態維護視窗狀態，進一步將暴力解的 O(n^2) 降至 O(n)。

## Today's Challenge

- **49** · 題目要求將互為字位變異詞的字串歸類在一起，完美對應以排序後字串作為 Canonical Hash Key 的分組模式。
  - Hint: 將每個字串的字元重新排序作為 Dictionary 的 Key，原字串附加到對應的 List 中。
- **249** · 字串透過相對位移量等價，可以透過計算相鄰字元間的字元差值序列作為標準化鍵值進行分組。
  - Hint: 計算相鄰字元差值並處理負數環繞問題，將差值元組或字串作為 Map 的 Key。
