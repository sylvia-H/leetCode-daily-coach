---
id: string-anagram-grouping
title: String Anagram Grouping and Hashing
module: string
pattern_label: Hash Map
complexity_label: O(n * k log k) / O(n * k)
estimated_minutes: 15
exit_criteria:
  - >-
    Can use sorted string or character counts as hash map keys to group
    anagrams.
---
## Concept

String Anagram Grouping and Hashing 是一種透過建立正規化特徵鍵值（Canonical Key）來將字元組成完全相同的字串歸類的演算法技巧。核心原理在於將互為變位詞（Anagram）的字串轉換為相同的雜湊鍵，從而利用 Hash Map 在常數或對數時間內完成分組。

## Thinking

當面對需要將具有相同字元集但順序不同的字串進行分組的問題時，直覺的兩兩比較法時間複雜度過高。透過思考每個字串的本質，我們可以將其轉化為唯一的識別特徵：一種是將字串內的字元進行排序，互為變位詞的字串排序後會得到完全相同的標準字串；另一種是統計每個字元出現的頻率，形成頻率陣列或元組（Tuple）。將此識別特徵作為 Hash Map 的 Key，對應的 Value 則是原始字串的列表，藉此完成高效率的字串歸類。

## Pattern Recognition

辨識此 Pattern 的線索在於題目要求「分組」、「分類」或「檢查是否為變位詞」，並且處理對象為多個字串或陣列。當看到關鍵字如 group anagrams、categorize by character composition，且字串長度與數量在一定規模內時，應立刻聯想到使用 Hash Map 搭配正規化鍵值（如排序後的字串或字元計數簽章）的解法。

## Common Mistakes

常見的錯誤包含在不支援物件或陣列作為鍵值的程式語言中，直接將可變陣列（Mutable Array）作為 Hash Map 的 Key，導致雜湊對應失敗或語法錯誤。此外，未妥善處理字元計數的邊界條件（例如大小寫混淆或包含特殊字元），以及在計算複雜度時忽略了字串排序本身所需的額外開銷（k log k），都是常見的盲點。

## Complexity

時間複雜度為 O(n * k log k)，其中 n 代表字串陣列的長度，k 代表字串的最大長度。若採用字元計數而非排序作為特徵鍵，時間複雜度可優化至 O(n * k)。空間複雜度為 O(n * k)，用於儲存 Hash Map 中的所有字串與對應的鍵值。

## Digest

本單元探討 String Anagram Grouping and Hashing 的核心概念與 Hash Map 應用。透過將字串轉化為正規化特徵鍵值，我們能夠高效地將變位詞分組。掌握排序法與頻率計數法是解決這類問題的關鍵。

## TypeScript Tip

```typescript
function groupAnagramsOptimized(strs: string[]): string[][] {
    const map = new Map<string, string[]>();
    for (const s of strs) {
        const count = new Array(26).fill(0);
        for (let i = 0; i < s.length; i++) {
            count[s.charCodeAt(i) - 97]++;
        }
        const key = count.join('#');
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key)!.push(s);
    }
    return Array.from(map.values());
}
const res = groupAnagramsOptimized(["eat", "tea"]);
if (res.length !== 1) throw new Error("Assertion failed");
```

## Python Tip

```python
from collections import defaultdict


def group_anagrams_optimized(strs: list[str]) -> list[list[str]]:
    ans = defaultdict(list)
    for s in strs:
        count = [0] * 26
        for char in s:
            count[ord(char) - ord('a')] += 1
        ans[tuple(count)].append(s)
    return list(ans.values())


res = group_anagrams_optimized(["eat", "tea"])
assert len(res) == 1, "Assertion failed"
```

## TypeScript Corner

```typescript
function groupAnagrams(strs: string[]): string[][] {
    const map = new Map<string, string[]>();
    for (const s of strs) {
        const key = s.split('').sort().join('');
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key)!.push(s);
    }
    return Array.from(map.values());
}
const result = groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]);
if (result.length !== 3) throw new Error("Assertion failed");
```

## Python Corner

```python
from collections import defaultdict


def group_anagrams(strs: list[str]) -> list[list[str]]:
    anagram_map = defaultdict(list)
    for s in strs:
        key = tuple(sorted(s))
        anagram_map[key].append(s)
    return list(anagram_map.values())


result = group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"])
assert len(result) == 3, "Assertion failed"
```

## Takeaway

利用正規化鍵值（排序或頻率計數）配合 Hash Map，可將字串變位詞分組問題從 O(n^2) 優化至 O(n * k log k) 或 O(n * k)。

## Tomorrow Preview

明天我們將探討字串處理中的雙指標（Two Pointers）與滑動視窗（Sliding Window）進階技巧，學習如何在不重複掃描的情況下高效率地尋找符合條件的子字串區間。

## Today's Challenge

- **49** · 此題為典型的字串分組問題，完全符合透過 Hash Map 搭配正規化鍵值來歸類變位詞的 Hash Map Pattern。
  - Hint: 可以將每個字串排序後作為雜湊表的鍵，或是使用 26 個英文字母的頻率計數陣列轉為不可變結構作為鍵。
