---
id: sliding-window-find-all-anagrams
title: Find All Anagrams in a String
module: sliding-window
pattern_label: Fixed Sliding Window
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能在頻率匹配條件成立時，記錄視窗的起始索引。
  - 能在有效率維護固定視窗的同時走訪整個字串。
---
## Concept

這一題你其實已經見過兩次：hash-table 課用 matched 計數器數過 anagram 的出現次數，string 課的固定視窗用整表比對走過同一組測資；昨天的排列存在性判定用的也是同一副骨架。所以本課不重教頻率比對——need、win、matched 的機制與昨天一字不改。本課的增量只有一件事：輸出從「是否存在」變成「所有命中視窗的起始索引」。別小看這個改變，它牽動三個實作細節：不能再提前回傳、每次命中要把視窗終點換算回起點、以及輸出順序是否需要另外整理。把這三件事收乾淨，就是今天的功課。

## Thinking

沿用慣例：每輪先把 `s[right]` 納入統計，right >= k 時把 `s[right - k]` 移出（k 為目標字串 p 的長度）。合法比對點上視窗恆為閉區間 `[right - k + 1, right]`、長度恆為 k，所以命中時要記錄的起點就是 `right - k + 1`——由「起點 = 終點 - (k - 1)」直接得出。完備性論證：right 從 0 走到 n - 1，每個長度 k 的子字串恰好在「它的終點」那一輪被檢查一次，不重不漏；也因為終點遞增，收集到的起點天然遞增，不需要事後排序。與昨天唯一的分歧點在迴圈出口：判定版找到第一個命中就能 return true，本題必須掃到字尾，把每個命中都 push 進結果——除此之外，頻率表與 matched 的每一行都原封不動。

## Pattern Recognition

題目要求「找出**所有**符合條件的起始位置」而條件是定長頻率匹配時，就是本模式：固定視窗逐終點檢查、逐命中收集。辨識關鍵在輸出型態——布林（存在性）可提前終止，集合（所有位置）必須完整走訪。往後看一步：若長度不固定、問的是「最短覆蓋」，收集邏輯就換成收縮擇優，那是明天的題型。

## Common Mistakes

第一，起點公式差一：把 `right - k + 1` 寫成 `right - k`。對 s = "cbaebabacd"、p = "abc" 會輸出 [-1, 5] 而不是 [0, 6]——第一筆甚至是負數索引，下游一取子字串就穿幫。第二，沿用昨天的提前回傳：對 s = "abab"、p = "ab" 只得 [0]，漏掉 1 與 2。第三，移出的索引寫成 `right - k + 1`：在「先納入」的慣例下，此刻視窗短暫有 k + 1 個字元，該移出的是 `s[right - k]`；踢錯字元後對 s = "abab"、p = "ab" 會得 [0, 2]，安靜漏掉起點 1。三者都不會拋錯，只會給出錯的索引集合，務必拿多重命中的小例子驗過。

## Complexity

時間 O(n)：每個字元進出視窗各一次，每次更新與命中判定都是 O(1)；建目標頻率表另花 O(k)。空間 O(1)：兩張 26 格頻率表與計數器為常數大小；結果陣列屬於輸出本身，最多 n - k + 1 筆。

## Digest

Find All Anagrams 是定長頻率匹配的收集版：機制與排列判定完全相同——先納入 `s[right]`、right >= k 時移出 `s[right - k]`、matched 湊滿即命中——差別只在命中時把起點 `right - k + 1` push 進結果並繼續掃描，不提前回傳。實例 s = "cbaebabacd"、p = "abc"：right = 2 時視窗 "cba" 命中記 0，right = 8 時視窗 "bac" 命中記 6，答案 [0, 6] 天然遞增免排序。整體 O(n) 時間、O(1) 額外空間。

## TypeScript Tip

出口從 `return true` 換成收集起點 `r - k + 1`，其餘與昨天一字不改。

```typescript
import assert from "node:assert";
function findAnagrams(s: string, p: string): number[] {
  const k = p.length, need = new Int32Array(26), win = new Int32Array(26);
  let uniq = 0, matched = 0;
  const res: number[] = [];
  for (const c of p) { const i = c.charCodeAt(0) - 97; if (!need[i]) uniq++; need[i] = (need[i] ?? 0) + 1; }
  for (let r = 0; r < s.length; r++) {
    const i = s.charCodeAt(r) - 97;
    win[i] = (win[i] ?? 0) + 1;
    if (win[i] === need[i]) matched++;
    if (r >= k) { const j = s.charCodeAt(r - k) - 97; if (win[j] === need[j]) matched--; win[j] = (win[j] ?? 0) - 1; }
    if (matched === uniq) res.push(r - k + 1);
  }
  return res;
}
assert.deepStrictEqual(findAnagrams("axbxab", "ab"), [4]);
```

## Python Tip

26 格 list 兩邊都有明確的 0，`==` 不受歸零殘鍵影響（Counter 則要刪歸零鍵）；每步 O(26) 仍是線性。

```python
def find_anagrams(s: str, p: str) -> list[int]:
    k = len(p)
    need = [0] * 26
    win = [0] * 26
    for c in p:
        need[ord(c) - 97] += 1
    res: list[int] = []
    for r, c in enumerate(s):
        win[ord(c) - 97] += 1
        if r >= k:
            win[ord(s[r - k]) - 97] -= 1
        if r >= k - 1 and win == need:
            res.append(r - k + 1)
    return res

assert find_anagrams("cbaebabacd", "abc") == [0, 6]
assert find_anagrams("abab", "ab") == [0, 1, 2]
assert find_anagrams("a", "aa") == []
```

## Takeaway

定長視窗命中時起點恆為 `right - k + 1`；判定邏輯與排列存在性完全相同，差別只在收集所有命中、不提前回傳。

## Tomorrow Preview

明天挑戰 Minimum Window Substring：視窗長度不再固定，matched 湊滿後改為收縮左端找最短覆蓋——頻率表與計數器全數沿用，推進策略換成「不合法就擴張、合法就收縮」。

## Today's Challenge

- **438** · 求 p 的所有 anagram 在 s 中的起點。你已在先修課用它練過頻率判定，本課補上收集版：掃完全字串、回報每個命中位置。
  - Hint: 與判定版共用同一副視窗骨架；命中時記錄 `right - k + 1`，不提前回傳，掃到字尾為止。
