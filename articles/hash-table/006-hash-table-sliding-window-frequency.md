---
id: hash-table-sliding-window-frequency
title: Sliding Window with Hash Map Frequency Balancing
module: hash-table
pattern_label: Sliding Window Frequency Map
complexity_label: O(n) / O(k)
estimated_minutes: 15
exit_criteria:
  - 能在視窗邊界移動時更新 frequency map
  - 能依據頻率條件判斷視窗是否合法
---
## Concept

Sliding Window Frequency Map 處理的是「合法條件由出現次數決定」的連續區間問題。前一課的相異元素視窗只需要知道字元「有沒有」出現，集合就足夠；但當題目要求視窗內每個字元的數量都對上另一個字串的頻率——例如找出所有 Anagram 的出現位置、或尋找包含目標字串全部字元（含重複數量）的最小子字串——就必須改用 Hash Map 記錄視窗內每個字元出現幾次。此技巧的核心不變式是：任一時刻，頻率表恰好描述目前視窗的組成。右界每納入一個字元就把它的計數加一，左界每移出一個字元就把它的計數減一，狀態便永遠與視窗同步，完全不需要重新掃描視窗內容。

## Thinking

用「湊齊目標頻率」來思考。先把目標字串統計成 need 表，滑動過程中維護視窗自己的 window 表。剩下的問題是：如何快速判斷「視窗已經合法」？若每一步都把兩張表整個比對，光小寫字母就得多花 26 倍的時間。解法是引入 matched 計數器，記錄「計數已湊滿的字元種類數」。它為什麼正確：window 中的計數每次只加減一，唯有「恰好跨越 need 中目標值」的那一步會改變該字元湊滿與否——右界納入字元 c 後，若 `window[c]` 恰等於 `need[c]`，matched 加一；左界移出 c 之前，若 `window[c]` 恰等於 `need[c]`，matched 減一。其餘的增減都不影響湊滿狀態，因此 matched 恆等於湊滿的種類數。視窗合法與否，只需比較 matched 是否等於 need 的種類總數，是 O(1) 判斷。

## Pattern Recognition

兩個訊號同時出現即可鎖定此 Pattern：第一，答案落在連續區間（substring 或 subarray）；第二，合法條件由「出現次數」定義，而不是只看存在與否或數值大小。固定長度版（Anagram 檢索）的視窗大小恆等於目標長度，每一步右端進一格、左端出一格；變動長度版（最小覆蓋子字串）則是「不合法就擴張右界，合法後收縮左界並記錄答案」。兩者共用同一套頻率增減與 matched 維護邏輯，差別只在邊界的推進策略。

## Common Mistakes

第一，頻率歸零時「刪不刪鍵」必須與合法性判斷方式一致：若靠整表相等來判斷（直接比較兩張表），歸零的鍵必須刪除，否則「a 為 1、b 為 0」與「只有 a 為 1」會被誤判為不同；若靠 matched 計數器，就不必刪也不要亂刪——判斷只看計數器，多餘的刪除反而製造「頻率為零」與「鍵不存在」的混淆。兩種策略混用是此類題最常見的 bug 來源。第二，收縮視窗時頻率更新與 matched 檢查的順序寫反：必須在計數改變的同一步檢查是否恰好跨越目標值，先後錯置會讓 matched 與視窗實況脫節。第三，變動長度版在視窗合法後忘記持續收縮到不能再縮，導致記錄到的不是最短答案。

## Complexity

時間複雜度 O(n)：左右指標都只單向前進，每個字元至多進出視窗各一次，且每次進出只做 O(1) 的計數更新與 matched 比較。空間複雜度 O(k)：k 為字元集大小，兩張頻率表最多各存 k 個鍵；若限定小寫英文字母，k 為 26，可視為常數。

## Digest

今天把 Sliding Window 從「查存在」升級到「對頻率」：用 Hash Map 維護視窗內每個字元的出現次數，右界納入就加一、左界移出就減一，頻率表永遠與視窗同步。合法性判斷不必整表比對，改用 matched 計數器——只在某字元計數「恰好跨越」目標值的那一刻增減，因此它恆等於已湊滿的字元種類數，判斷降為 O(1)。固定長度視窗每步一進一出，適合 Anagram 檢索；變動長度視窗在不合法時擴張、合法後收縮並記錄最短。左右指標各自最多走 n 步，整體 O(n)、空間 O(k)。

## TypeScript Tip

Map 取不存在的鍵會得到 undefined，累加前用 `?? 0` 收斂；matched 讓每步的合法性判斷都是 O(1)。

```typescript
import assert from "node:assert";
function anagramCount(s: string, p: string): number {
  const need = new Map<string, number>();
  for (const c of p) need.set(c, (need.get(c) ?? 0) + 1);
  const win = new Map<string, number>();
  let matched = 0;
  let found = 0;
  for (let r = 0; r < s.length; r++) {
    const a = s[r]!;
    win.set(a, (win.get(a) ?? 0) + 1);
    if (win.get(a) === need.get(a)) matched++;
    if (r >= p.length) {
      const b = s[r - p.length]!;
      if (win.get(b) === need.get(b)) matched--;
      win.set(b, (win.get(b) ?? 0) - 1);
    }
    if (matched === need.size) found++;
  }
  return found;
}
assert.strictEqual(anagramCount("cbaebabacd", "abc"), 2);
```

## Python Tip

歸零的鍵是否要刪，取決於怎麼判斷相等：用一般 dict 逐鍵比較就必須刪；Counter 的 `==` 自 Python 3.10 起將缺鍵視為零。

```python
from collections import Counter

def anagram_count(s: str, p: str) -> int:
    k, need = len(p), Counter(p)
    win = Counter(s[:k])
    found = int(win == need)
    for r in range(k, len(s)):
        win[s[r]] += 1
        out = s[r - k]
        win[out] -= 1
        if win[out] == 0:
            del win[out]
        if win == need:
            found += 1
    return found

assert anagram_count("cbaebabacd", "abc") == 2
```

## Takeaway

頻率表隨視窗邊界同步增減，matched 只在計數恰好跨越目標值時更新，讓合法性判斷 O(1)、整體 O(n)。

## Tomorrow Preview

明天進入 Canonical Key Grouping：把互為 Anagram 的字串轉換成同一個標準化鍵值，用 Hash Map 一次把所有等價的字串分好組。

## Today's Challenge

- **438** · 在字串中找出目標字串所有 Anagram 的起點，視窗長度固定等於目標長度，頻率表每步一進一出。
  - Hint: 右端納入、左端移出各更新一次頻率，配合 matched 計數器判斷視窗頻率是否與目標完全相符。
- **76** · 尋找包含目標字串全部字元（含重複數量）的最小子字串，是變動長度頻率視窗的代表題。
  - Hint: 不合法就擴張右界；matched 湊滿後收縮左界到不能再縮，沿途更新最短答案。
