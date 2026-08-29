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

Canonical Key Grouping 是把「本質相同、外觀不同」的資料聚成一組的核心模式。互為 Anagram 的字串、位移後等價的字串，若靠兩兩比較來分組，成本至少 O(n^2)。更好的做法是替每個元素計算一個標準化鍵值（Canonical Key）：過濾掉不影響分組的表面差異（例如字元順序），萃取出決定分組的本質特徵（例如排序後的字元序列、字元頻率、相鄰差值序列），再以它作為 Hash Map 的鍵，讓同組元素自動落進同一個桶。這個做法正確的前提，是鍵值設計滿足「同組必同鍵、異組必異鍵」：以排序簽章為例，兩個字串互為 Anagram 等價於兩者的字元多重集相同，而多重集相同又等價於排序後字串相同，因此排序簽章精準刻劃了這個等價關係，既不漏分也不誤併。

## Thinking

面對分組問題，第一步是定義「什麼算相同」。以 Anagram 分組為例，eat、tea、ate 順序不同但字元組成完全一致。思考流程如下：第一，確認分組依據是「字元多重集相同」；第二，設計 Canonical Form——最直覺的是把字串排序，eat 排序後得到 aet，三個字串都會映射到同一個鍵；第三，建立 Hash Map，鍵是簽章、值是該組的字串串列；第四，走訪輸入，對每個字串計算簽章，鍵已存在就把原字串附加進對應串列，不存在就先建立新串列。最後回傳 Hash Map 的所有值即是分組結果。當字串很長或數量很大時，可把簽章從排序改為頻率計數（長度 26 的計數陣列轉成字串或 tuple），把單一字串的處理成本從 O(k log k) 降到 O(k)。

## Pattern Recognition

當題目要求「把具有相同特徵、或經某種轉換後等價的元素分組」時，即可懷疑此模式。辨識線索有三：第一，題目出現 group、categorize、anagram、shifted strings 這類字眼；第二，元素之間存在等價關係，且能用標準化函數消除雜訊（順序、大小寫、相對位移）；第三，輸出通常是分組集合（List of Lists）。符合上述特徵時，不需要動用複雜的圖論演算法，Hash Map 配上正確設計的標準化鍵值即可解決，整體成本由「元素數量乘上單一元素的標準化成本」決定。

## Common Mistakes

第一，直接拿未標準化的原始字串當鍵，互為 Anagram 的字串會因順序不同而分散到不同桶。第二，用字元編碼總和當鍵：這種壓縮丟失了組成資訊，會產生嚴重碰撞——ac 與 bb 的編碼總和同為 196，卻不是 Anagram，會被誤併成一組。第三，語言特性坑：JavaScript 拿陣列當物件鍵會被隱式轉成字串、放進 Map 則以參考位址比較，兩個內容相同的陣列不會命中同一鍵，必須先 join 成字串；Python 的 list 可變、不可雜湊，當 dict 鍵會直接拋出 TypeError，必須轉成 tuple。第四，位移字串分組時忘記處理差值為負的環繞情形：az 與 ba 的相鄰差值分別是 25 與 -1，必須 mod 26 之後才會一致。

## Complexity

時間複雜度 O(n * k log k)：n 是字串個數、k 是最長字串長度，主要成本是替每個字串排序產生簽章；改用頻率計數簽章可降為 O(n * k)。空間複雜度 O(n * k)：Hash Map 必須保存所有原始字串與其簽章，最壞情況（全部不同組）需完整保留全部資料。

## Digest

今天學習 Canonical Key Grouping：把具備等價關係的資料轉換為標準化簽章，作為 Hash Map 的鍵完成高效分組。正確性來自鍵值設計滿足「同組必同鍵、異組必異鍵」——排序簽章刻劃字元多重集、相鄰差值序列刻劃位移等價。實作上以簽章為鍵、串列為值，逐一把原字串附加進對應的桶，將原本 O(n^2) 的兩兩比較降為 O(n * k log k)，頻率計數簽章更可達 O(n * k)。同時留意語言特性：JavaScript 需把簽章轉成字串才能命中同一鍵，Python 需用 tuple 這類不可變結構當鍵。

## TypeScript Tip

Map 拿陣列當鍵比的是參考位址而非內容，簽章務必先轉成字串再放入。

```typescript
import assert from "node:assert";
function groupAnagrams(strs: string[]): string[][] {
  const map = new Map<string, string[]>();
  for (const s of strs) {
    const key = [...s].sort().join("");
    const bucket = map.get(key);
    if (bucket) bucket.push(s);
    else map.set(key, [s]);
  }
  return [...map.values()];
}
const groups = groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]);
assert.strictEqual(groups.length, 3);
```

## Python Tip

list 不可雜湊、不能當 dict 鍵；改用 tuple 頻率簽章，單一字串的處理成本從 O(k log k) 降到 O(k)。

```python
from collections import defaultdict

def group_anagrams(strs: list[str]) -> list[list[str]]:
    groups = defaultdict(list)
    for s in strs:
        key = [0] * 26
        for c in s:
            key[ord(c) - ord("a")] += 1
        groups[tuple(key)].append(s)
    return list(groups.values())

assert len(group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"])) == 3
```

## Takeaway

分組的關鍵是設計「同組必同鍵、異組必異鍵」的標準化簽章，Hash Map 讓等價元素自動聚成同一桶。

## Tomorrow Preview

明天把頻率統計搬到數值陣列上：用 Prefix Sum 搭配頻率 Hash Map，在 O(n) 內數出總和等於目標值的子陣列，處理 Sliding Window 因負數而失效的情境。

## Today's Challenge

- **49** · 互為 Anagram 等價於字元多重集相同，以排序後的字串作為標準化鍵值即可一次分組完成。
  - Hint: 把每個字串的字元排序後當作鍵，原字串附加到對應串列，最後回傳所有串列。
- **249** · 位移等價的字串具有相同的相鄰字元差值序列，以差值序列作為標準化鍵值分組。
  - Hint: 相鄰差值取 mod 26 處理負數環繞，再把差值序列轉成可雜湊的鍵。
