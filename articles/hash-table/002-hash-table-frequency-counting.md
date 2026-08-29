---
id: hash-table-frequency-counting
title: Frequency Counting with Hash Map
module: hash-table
pattern_label: Frequency Map
complexity_label: O(n) / O(n)
estimated_minutes: 10
exit_criteria:
  - Can build a frequency map from an array
  - Can iterate through map entries to find maximum or matching frequencies
---
## Concept

Frequency Counting with Hash Map 是以雜湊表統計集合中各元素出現次數的基礎技巧：把元素本身當作鍵（Key）、出現次數當作值（Value）。統計之所以只需一次走訪就完整，是因為「計數」與順序無關——每個元素恰好為自己的鍵貢獻一次加一，走訪完畢時頻率分佈就完整成形；而雜湊表讓每次「查詢舊計數、寫回新計數」都是平均 O(1)，整體因此是線性時間。相比之下，若每遇到一個元素就重新掃描整個集合來數它出現幾次，成本會是 O(n^2)——頻率表正是用 O(n) 的空間換掉這層重複掃描。

## Thinking

標準流程分兩個階段。第一階段建表：走訪集合一次，對每個元素先查它目前的計數——不存在就視為 0——再加一寫回。「不存在視為 0」是這個 Pattern 最關鍵的實作細節，直接對未初始化的鍵遞增，在許多語言會得到錯誤結果。第二階段消費這張表：需求不同，用法也不同——找出現次數為 1 的元素，就再走訪一次原集合並查表；找頻率最高者，就迭代表中所有鍵值對取最大值；驗證一個集合的字元是否足以組成另一個集合，則先統計供給方，再逐一扣除需求方的計數，一旦某個鍵被扣成負數即可判定不足。值得注意的是，第二次走訪「原集合」還是「頻率表」是有差別的：前者保留了原始順序（例如要找「第一個」符合條件的元素），後者只剩頻率資訊。

## Pattern Recognition

題目敘述出現這些訊號時，就該想到 Frequency Map：計算出現次數、找重複或唯一出現的元素、找出現頻率最高（或前幾高）的項目、判斷一個集合的元素是否足夠組成另一個集合、依出現次數重新排序。共同點是答案只取決於「每種元素各出現幾次」，而與元素間的排列細節無關；一旦確認這一點，先建頻率表再消費它，幾乎就是標準解法骨架。

## Common Mistakes

最常見的錯誤是漏掉初始化：在 TypeScript 中對 Map 裡不存在的鍵取值會得到 undefined，直接加一會變成 NaN，必須用 `freq.get(key) ?? 0` 這類寫法收斂。第二是在迭代雜湊表的同時增刪其中的鍵，可能導致迭代行為錯亂，應先收集再修改。第三是計數口徑不一致：大小寫、全形半形或空白字元是否算同一個鍵，須先向題目確認。最後是兩表比對只驗證單向——供給方計數足夠不代表兩者頻率完全相同，若題目要求「恰好相等」，還得確認沒有多出來的鍵。

## Complexity

Time Complexity: O(n)，其中 n 為集合長度：建表走訪一次，每次查詢與寫回平均 O(1)；後續消費頻率表至多再一次線性走訪。Space Complexity: O(u)，u 為獨特元素的數量；若鍵的種類有固定上限（例如僅小寫英文字母 26 種），空間即為 O(1)。

## Digest

Frequency Counting with Hash Map 以元素為鍵、次數為值，單次走訪即可建出完整頻率分佈，把 O(n^2) 的重複掃描降為 O(n)。實作關鍵是「不存在視為 0」的初始化——TypeScript 用 `freq.get(key) ?? 0`，Python 直接用 collections.Counter。建表之後依需求消費：查唯一、取最大、逐項扣除比對兩集合。空間 O(u)，鍵種類固定時即為 O(1)。

## TypeScript Tip

```typescript
function getCharFrequency(s: string): Map<string, number> {
  const freq = new Map<string, number>();
  for (const char of s) {
    freq.set(char, (freq.get(char) ?? 0) + 1);
  }
  return freq;
}
const freqMap = getCharFrequency("leetcode");
if (freqMap.get("e") !== 3) throw new Error("assertion failed");
if (freqMap.get("t") !== 1) throw new Error("assertion failed");
```

## Python Tip

```python
from collections import Counter

def get_char_frequency(s: str) -> Counter:
    return Counter(s)

freq_map = get_char_frequency("leetcode")
assert freq_map["e"] == 3, "assertion failed"
assert freq_map["z"] == 0, "missing key should default to 0"
```

## Takeaway

以元素為鍵、次數為值建立雜湊表，單次走訪即完成 O(n) 頻率統計，記得把不存在的鍵視為 0。

## Tomorrow Preview

明天將探討 Complement Lookup：走訪時把看過的值存進雜湊表，用 O(1) 查詢「目標值減去當前值」的互補數是否出現過，一趟完成配對搜尋。

## Today's Challenge

- **387** · 答案取決於每個字元的出現次數，必須先建頻率表，再依原始順序找出計數為 1 的字元。
  - Hint: 建表後第二次走訪原字串（而非頻率表），第一個計數為 1 的索引即為答案。
- **383** · 驗證一方的字元數量能否滿足另一方的需求，是兩個頻率表逐項比對的典型應用。
  - Hint: 統計 magazine 的字元頻率後逐一扣除 ransomNote 的需求，出現負數即無法組成。
- **451** · 統計字元頻率後依次數降冪重建字串，是頻率表結合排序的進階應用。
  - Hint: 建立頻率表後，把字元依對應計數由大到小排序，再各自重複其次數拼接成結果。
