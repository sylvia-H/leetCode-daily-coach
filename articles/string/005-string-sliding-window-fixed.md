---
id: string-sliding-window-fixed
title: Fixed-Size Sliding Window on Strings
module: string
pattern_label: Sliding Window
complexity_label: O(n) / O(k)
estimated_minutes: 15
exit_criteria:
  - >-
    Can slide a window of size k across a string while updating frequency maps
    efficiently.
---
## Concept

Sliding Window 處理的是「連續區間」的統計問題。當題目要求在長度 n 的字串中檢查每一個長度固定為 k 的子字串——例如找出所有 anagram 的起始位置——暴力做法是對每個起點重算一次頻率；固定大小滑動視窗改為維護一個長度恆為 k 的視窗，滑動時只做兩件事：把新進右端的字元加入統計、把離開左端的字元移出統計。本課約定（下一課的可變視窗會沿用同一套慣例）：視窗是閉區間 `[left, right]`，兩端字元都在窗內；每輪迴圈「先把 `s[right]` 納入統計」，之後視窗才算包含 right；視窗長度恆等於 `right - left + 1`。

## Thinking

先看暴力解為什麼慢：n - k + 1 個起點各掃 k 個字元，時間 O(n * k)；但相鄰兩個視窗共享 k - 1 個字元，重算等於把同一個字元數了 k 次。滑動視窗的正確性可以用迴圈不變式說清楚：「每輪把 `s[right]` 納入、且（當 right >= k 時）把 `s[right - k]` 移出之後，統計表恰好等於子字串 `s[right-k+1..right]` 的字元頻率」。用歸納法論證：前 k 個字元逐一納入後不變式成立；之後每輪一進一出，改動的恰好是新舊視窗的差集，其餘 k - 1 個重疊字元的計數原封不動，不變式因此維持成立。有了不變式，只要在 right >= k - 1（視窗首次填滿）之後逐輪比對統計表與目標頻率，就能不重不漏地檢查每一個長度 k 的視窗，且每輪更新只需 O(1)。若你在先修的 hash-table 課已見過用 matched 計數器維護「已匹配字元種類數」的寫法——那是同一副骨架的常數優化；本課先用整表比對，把不變式本身講清楚。

## Pattern Recognition

出現以下訊號時，優先考慮固定大小滑動視窗：
1. 題目給定一個精確且全程不變的長度 k——「長度為 k 的子字串」「某字串的 anagram」（k 即該字串長度）。
2. 要判斷的性質可用「能增量更新的統計量」表示：字元頻率、總和、相異字元數。
3. 期望複雜度是線性 O(n)。
若題目問的是「最長／最短」而長度不固定，那是下一課可變視窗的守備範圍。

## Common Mistakes

1. 每次滑動都重建頻率表：複雜度退化回 O(n * k)，等於沒用視窗。
2. 視窗未滿 k 就開始比對：未滿時窗內計數總和小於 k，不可能與目標頻率相等，比對必定失敗——錯不在誤判，而在白白多付比對成本；首個有意義的比對點是 right == k - 1。
3. 移出的索引算錯：在「先納入 `s[right]`」的慣例下，此刻窗內短暫有 k + 1 個字元，該移出的是 `s[right - k]`；寫成 right - k + 1 會把還在窗內的字元踢掉。
4. 只比總量不比分佈：每個視窗的字元總數必然都是 k，判斷 anagram 必須逐字元比頻率。
5. Python 的 Counter 陷阱：計數減到 0 的鍵若不刪除，在 3.10 之前的版本 `==` 會因殘留的零計數鍵而誤判不等。

## Complexity

時間 O(n)：每個字元恰好進入視窗一次、離開一次，每次進出 O(1)；若逐輪整組比對 26 格頻率陣列，嚴格說是 O(26n)，仍為線性。空間 O(k)，取決於字元集大小：小寫英文字母只需固定 26 格陣列，可視為 O(1)。

## Digest

固定大小滑動視窗維護閉區間 `[left, right]`、長度恆為 k 的視窗：每輪先把 `s[right]` 納入統計，right >= k 時把 `s[right - k]` 移出。迴圈不變式保證統計表始終等於當前視窗的字元頻率，每輪更新 O(1)；首個合法比對點在 right == k - 1。用固定 26 格頻率陣列或雜湊表追蹤，與目標頻率逐字元比對，即可解 anagram 搜尋與排列存在性問題，整體 O(n) 時間、O(k) 空間。

## TypeScript Tip

固定 26 格陣列追蹤頻率；用 `?? 0` 收斂 `noUncheckedIndexedAccess` 下的索引型別：

```typescript
import assert from "node:assert";
function countAnagrams(s: string, p: string): number {
  const k = p.length, a = 97;
  const need = new Array<number>(26).fill(0);
  const win = new Array<number>(26).fill(0);
  for (const c of p) {
    const i = c.charCodeAt(0) - a;
    need[i] = (need[i] ?? 0) + 1;
  }
  let count = 0;
  for (let right = 0; right < s.length; right++) {
    const i = s.charCodeAt(right) - a;
    win[i] = (win[i] ?? 0) + 1;
    if (right >= k) {
      const j = s.charCodeAt(right - k) - a;
      win[j] = (win[j] ?? 0) - 1;
    }
    if (right >= k - 1 && need.every((v, x) => v === win[x])) count++;
  }
  return count;
}
assert(countAnagrams("cbaebabacd", "abc") === 2);
```

## Python Tip

先納入右端、再移出左端；計數歸零的鍵要刪除，跨版本的 `==` 比較才可靠：

```python
from collections import Counter

def count_anagrams(s: str, p: str) -> int:
    k = len(p)
    need = Counter(p)
    win = Counter()
    count = 0
    for right, ch in enumerate(s):
        win[ch] += 1
        if right >= k:
            out = s[right - k]
            win[out] -= 1
            if win[out] == 0:
                del win[out]
        if right >= k - 1 and win == need:
            count += 1
    return count

assert count_anagrams("cbaebabacd", "abc") == 2
```

## Takeaway

固定視窗滑動時一進一出各 O(1)，迴圈不變式保證統計恆等於當前視窗頻率，線性時間掃完所有長度 k 的子字串。

## Tomorrow Preview

明天進入 Variable-Size Sliding Window on Strings：收縮不再由固定長度觸發，而是由條件是否合法決定，用同一套閉區間慣例處理「最長子字串」問題。

## Today's Challenge

- **438** · 找出 p 的所有 anagram 在 s 中的起始索引，視窗長度固定為 p 的長度，是頻率比對型固定視窗的標準題。
  - Hint: 維護 need 與 win 兩個頻率陣列；先納入 `s[right]`、right >= k 時移出 `s[right - k]`，再整組比對。
- **567** · 判斷 s2 是否包含 s1 的排列，等同問「是否存在長度為 s1 長度、頻率與 s1 完全相同的視窗」。
  - Hint: 與 anagram 搜尋同一套滑動更新，差別只在找到第一個匹配就能提前回傳 true。
