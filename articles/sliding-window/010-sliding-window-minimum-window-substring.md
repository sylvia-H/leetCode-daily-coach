---
id: sliding-window-minimum-window-substring
title: Minimum Window Substring
module: sliding-window
pattern_label: Variable Sliding Window + Requirement Counter
complexity_label: O(n + m) / O(1)
estimated_minutes: 25
exit_criteria:
  - 能追蹤有多少個必要的相異字元已達到其目標頻率。
  - 能在維持完整涵蓋所有必要字元的同時，貪婪地收縮左指標。
---
## Concept

Minimum Window Substring（LeetCode 標為 Hard）是 sliding-window 模組的收官課，但你需要的零件其實都學過：頻率表的起手式來自 hash-table 的 Frequency Counting，need / win 與 matched 計數器來自排列判定與 anagram 兩課，「擴張納入、收縮移出」的變動視窗骨架來自 expansion 與 contraction 兩課；這題本身你也在 hash-table 的頻率視窗課當 Challenge 寫過一次，當時 Hint 一句帶過的流程，本課要補上 matched 的精確語意與不漏解的論證。本課的增量只有一個——把比對語意從「恰好相等」放寬成「涵蓋」：視窗內每個必要字元的數量大於等於需求即可，超額不扣分。這個放寬正是視窗不再定長的原因：合法視窗可以任意延長，題目要的卻是最短的一個。於是策略成形——右端擴張直到 matched 湊滿，然後在維持涵蓋的前提下貪婪收縮左端，每次移除前記下視窗，直到涵蓋被打破，再回頭繼續擴張。

## Thinking

涵蓋語意下，matched 的增減要抓準「恰好」的時刻：納入 c 後若 win[c] 恰好追平 need[c]，matched 加一；已超額再納入同字元，matched 不動。移出 d 前若 win[d] 恰好等於 need[d]，代表拿走它涵蓋就破，matched 減一；超額字元移出則不影響。增減對稱，狀態才不會漂。matched 的湊滿目標是 t 的相異字元數——重複的需求由 need 的數值承擔，不另佔名額。記錄時機沿用 contraction 課的原則「只在視窗合法時記錄」：合法期間位於內層 while，所以記錄放在每次移除之前，移除後視窗可能已不合法。

不漏解的論證補上最後一塊：設最佳解為 [l*, r*]。若 right 走到 r* 時 left 尚未越過 l*，此刻視窗包住最佳解、必然合法，內層 while 會一路收縮，收到 left = l* 時記下的正是最佳解本身；若 left 更早就越過 l*，由於收縮只在視窗合法時發生，越過的那一刻視窗 [l*, right] 合法、右端更早、長度比最佳解更短，而記錄恰好排在每次移除之前——這個更短的合法視窗已被記下。兩頭堵死，左指標因此可以單向前進、永不回頭；配合每個字元至多進出視窗各一次的攤銷帳（contraction 課算過總帳），整體時間是線性的。

## Pattern Recognition

題面是「最短的、涵蓋另一組必要元素的連續區間」，就是 Variable Sliding Window + Requirement Counter。與昨天 anagram 的分水嶺在比對語意：anagram 要求定長且頻率恰好相等，超額即失配；涵蓋只要求大於等於，超額無害，視窗因此可長可短，「最短」得靠收縮擇優。動手前照例做單調性檢查：移出字元只會讓涵蓋變差、不會變好，收縮才有明確停點，這是本模板適用的前提。

## Common Mistakes

第一，收縮時忘了 matched 減一：移出達標邊界的字元後涵蓋已破，matched 卻沒跌，內層 while 條件恆真，left 失控前衝——TypeScript 取到 undefined 不擲錯、卡死在迴圈裡；Python 則對尚未納入的字元扣減或越界取值，拋 KeyError 或 IndexError；失效形式是掛住或擲錯，不是算錯。第二，matched 加一的條件寫成大於等於：以 s = "aab"、t = "ab" 為例，納入第二個 a 時 win[a] = 2 >= 1 又加一次，matched 虛胖成 2 湊滿目標，視窗 "aa" 根本沒有 b 就被判合法。第三，湊滿目標誤用 t 的總長度：t = "aab" 長度為 3，但 matched 數的是相異字元、至多 2，永遠湊不滿，整題只回傳空字串。後兩種錯誤不擲例外、只安靜給出錯答案，務必拿含重複字元的小例子驗過。

## Complexity

時間 O(n + m)：建 need 表走過 t 一次是 O(m)；主迴圈中每個字元至多被 right 納入一次、被 left 移出一次，每一步的頻率更新與 matched 判定都是 O(1)，合計 O(n)。空間 O(k)：need 與 win 的鍵數不超過字元集大小 k（英文大小寫至多 52），可視為常數 O(1)。

## Digest

Minimum Window Substring 把 sliding-window 模組的零件收攏成一題：need / win 頻率表加 matched 計數器判涵蓋——win 恰好追平 need 時 matched 加一、移出使其跌破時減一，湊滿 t 的相異字元數即合法；變動視窗負責擇優——不合法就擴張右端，合法就收縮左端，每次移除前先記錄。實例 s = "ADOBECODEBANC"、t = "ABC"：right 走到第一個 C 時湊滿涵蓋，收縮記下 "ADOBEC"；其後視窗歷經打破與重建，最後收縮出 "BANC" 即為答案。整體 O(n + m) 時間、O(1) 額外空間（字元集大小為常數）。

## TypeScript Tip

Map 版不限定字元集；`?? 0` 收斂缺鍵，三處 `!` 是邏輯上保證存在的收斂斷言。

```typescript
import assert from "node:assert";
function minWindow(s: string, t: string): string {
  const need = new Map<string, number>(), win = new Map<string, number>();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
  let matched = 0, L = 0, best = "";
  for (let r = 0; r < s.length; r++) {
    const c = s[r]!;
    win.set(c, (win.get(c) ?? 0) + 1);
    if (win.get(c) === need.get(c)) matched++;
    while (matched === need.size) {
      if (!best || r - L + 1 < best.length) best = s.slice(L, r + 1);
      const d = s[L++]!;
      if (win.get(d) === need.get(d)) matched--;
      win.set(d, win.get(d)! - 1);
    }
  }
  return best;
}
assert.strictEqual(minWindow("aabbc", "aab"), "aab");
```

## Python Tip

Counter 對缺鍵回 0 且不落鍵，`win[c] == need[c]` 的追平比對對無關字元因此天然安全。

```python
from collections import Counter

def min_window(s: str, t: str) -> str:
    need = Counter(t)
    win: dict[str, int] = {}
    matched, left, best = 0, 0, ""
    for r, c in enumerate(s):
        win[c] = win.get(c, 0) + 1
        if win[c] == need[c]:
            matched += 1
        while matched == len(need):
            if not best or r - left + 1 < len(best):
                best = s[left:r + 1]
            d = s[left]
            left += 1
            if win[d] == need[d]:
                matched -= 1
            win[d] -= 1
    return best

assert min_window("ADOBECODEBANC", "ABC") == "BANC"
assert min_window("a", "aa") == ""
assert min_window("aabbc", "aab") == "aab"
```

## Takeaway

涵蓋是大於等於而非恰好相等：擴張湊滿 matched，合法時先記錄再收縮，最短覆蓋視窗一個都不漏。

## Tomorrow Preview

sliding-window 模組到此收官——從固定視窗的頻率匹配、變動視窗的擴張與收縮，到涵蓋語意下的最短擇優，「維護視窗狀態、單向推進」這副骨架已經完整。明天起進入新的模組，用同樣的節奏繼續推進。

## Today's Challenge

- **76** · 求 s 中涵蓋 t 全部字元（含重複頻率）的最短子字串，Variable Sliding Window + Requirement Counter 的原型題；LeetCode 標 Hard，但零件你都已練過。
  - Hint: need / win / matched 全套沿用；matched 湊滿進內層 while，先記錄再移出 s[left]，移出破壞涵蓋時同步將 matched 減一。
