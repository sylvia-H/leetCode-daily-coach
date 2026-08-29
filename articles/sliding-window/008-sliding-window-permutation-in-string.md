---
id: sliding-window-permutation-in-string
title: Permutation in String (Exact Frequency Match)
module: sliding-window
pattern_label: Fixed/Variable Window + Frequency Comparison
complexity_label: O(n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能為目標 pattern 與滑動視窗分別初始化頻率陣列。
  - 能透過追蹤已匹配的字元數，在 O(1) 時間內有效率地比較頻率結構。
---
## Concept

「s2 是否含有 s1 的某個排列」等價於「s2 是否存在長度為 `len(s1)`、字元頻率與 s1 完全相同的視窗」——排列不管順序，只管每個字元各出現幾次。這不是你第一次碰頻率匹配：hash-table 課用 matched 計數器數過 anagram，string 課的固定視窗用整表比對把迴圈不變式講清楚，這一題也曾是該課的挑戰題。本課把 matched 計數器本身當主角：先釐清它維護的到底是什麼量，再證明為什麼它能把「兩張頻率表完全相等」這個等式判定壓到 O(1)。視窗慣例照舊：先把 `s2[right]` 納入統計，right >= k 時把 `s2[right - k]` 移出，合法比對點上視窗恆為 `[right - k + 1, right]`、長度恆為 k。

## Thinking

建 `need`（s1 的頻率）與 `win`（視窗頻率）。matched 的精確語意是：**已達標——即 `win[c] >= need[c]`——的需求字元種類數**，不是「恰好相等的種類數」。所以增減時機只有兩個跨越點：納入使 `win[c]` 恰好升到 `need[c]` 時加一；移出使它從 `need[c]` 降到 `need[c] - 1` 時減一。升過頭（`need[c]` 到 `need[c] + 1`）與降回 `need[c]` 都不動它。為什麼「matched 等於 s1 的相異字元數」就能斷定視窗是 s1 的排列？靠固定長度的數量守恆：視窗恰有 k 個字元，而各字元需求量總和也是 k；若每個需求字元都達標，光它們的計數總和就已達 k，視窗塞不下任何超額或多餘字元，於是逐字元恰好相等。注意這個論證少了「長度固定為 k」就不成立——matched 湊滿只保證「涵蓋」，那是之後可變視窗題的語意。

## Pattern Recognition

題目出現「排列」「anagram」「頻率完全相同的子字串」，就把視窗長度釘在目標字串長度，走固定視窗；判定條件是**兩張頻率表的等式**，與昨天水果題「鍵數至多 k」的不等式判準相對照。想每步 O(1) 判定，就用 matched；小寫字母場景用 26 格陣列而非雜湊表，索引由 `charCodeAt` 或 `ord` 換算，更新與查值都是常數時間。整表比對每步 O(26) 也仍是線性，只是常數較大——string 課走過那條路，本課補上計數器這條。

## Common Mistakes

第一，只加不減——右端一路納入卻忘了移出左端。對 s1 = "ab"、s2 = "acb"，讀完三個字元後 a 與 b 各自達標、matched 湊滿，誤報 true；但 "acb" 的任何長度 2 子字串都不是 "ab" 的排列。第二，移出端順序寫反：先把 `win[d]` 減一、再檢查是否等於 `need[d]`。對 s1 = "ab"、s2 = "aab"，a 的計數從 2 降到 1 時會被誤扣 matched 且再也補不回來，誤報 false——正確順序是移出前檢查「即將失去達標」，納入後檢查「剛好達標」，兩側鏡像對稱。第三，拿字元碼總和之類的單一數值當頻率簽章：`'a' + 'd'` 與 `'b' + 'c'` 的字元碼總和同為 197，s1 = "ad"、s2 = "bc" 會誤報 true。頻率是一個向量，壓成一個純量必有碰撞。

## Complexity

時間 O(n)，n 為 s2 長度：每個字元進出視窗各一次，每次只做常數次計數更新與比較；建 `need` 表另花 O(len(s1))。空間 O(1)：兩個 26 格陣列與一個 matched 計數器，與輸入長度無關。

## Digest

排列存在性等於定長頻率匹配：視窗長度釘在 `len(s1)`，`need` 與 `win` 各 26 格，matched 記錄「已達標（win >= need）的需求字元種類數」。增減只在跨越點：納入後恰好升到需求量就加一，移出前恰在需求量就減一。matched 湊滿相異字元數即可回傳 true——因為視窗恰有 k 個字元、需求總和也是 k，全數達標就塞不下任何多餘字元，頻率必逐字元相等。實例 s1 = "ab"、s2 = "eidbaooo"：視窗滑到 "ba" 時 a、b 同時達標，matched = 2 即命中。整體 O(n) 時間、O(1) 空間。

## TypeScript Tip

`Int32Array` 取值在 `noUncheckedIndexedAccess` 下以 `?? 0` 收斂。

```typescript
import assert from "node:assert";
function checkInclusion(s1: string, s2: string): boolean {
  const k = s1.length, need = new Int32Array(26), win = new Int32Array(26);
  let uniq = 0, matched = 0;
  for (const c of s1) { const i = c.charCodeAt(0) - 97; if (!need[i]) uniq++; need[i] = (need[i] ?? 0) + 1; }
  for (let r = 0; r < s2.length; r++) {
    const i = s2.charCodeAt(r) - 97;
    win[i] = (win[i] ?? 0) + 1;
    if (win[i] === need[i]) matched++;
    if (r >= k) { const j = s2.charCodeAt(r - k) - 97; if (win[j] === need[j]) matched--; win[j] = (win[j] ?? 0) - 1; }
    if (matched === uniq) return true;
  }
  return false;
}
assert(checkInclusion("abc", "cba") && !checkInclusion("ab", "acb"));
```

## Python Tip

用 dict 版 matched：`need.get(c)` 對不在 s1 的字元回傳 None，整數比較必為 False，天然擋掉無關字元。

```python
def check_inclusion(s1: str, s2: str) -> bool:
    k = len(s1)
    need: dict[str, int] = {}
    for c in s1:
        need[c] = need.get(c, 0) + 1
    win: dict[str, int] = {}
    matched = 0
    for r, c in enumerate(s2):
        win[c] = win.get(c, 0) + 1
        if win[c] == need.get(c):
            matched += 1
        if r >= k:
            d = s2[r - k]
            if win[d] == need.get(d):
                matched -= 1
            win[d] -= 1
        if matched == len(need):
            return True
    return False

assert check_inclusion("ab", "axxab")
assert not check_inclusion("ab", "axb")
assert not check_inclusion("aaa", "aa")
```

## Takeaway

matched 記錄達標的需求字元種類數，配上視窗長度固定為 k 的數量守恆論證，頻率等式判定降為 O(1)。

## Tomorrow Preview

明天同一副固定視窗骨架不再問「是否存在」，而是 Find All Anagrams in a String：把每一個頻率吻合的視窗起始索引全部收集起來——差別只在不能提前回傳，得掃完整個字串。

## Today's Challenge

- **567** · 題目直接問 s2 是否含 s1 的任一排列，而排列等價於「長度為 `len(s1)` 且頻率完全相同的視窗」，是定長頻率匹配的原型題。
  - Hint: need 與 win 各一張表；納入後檢查「剛好達標」、移出前檢查「將失去達標」，matched 湊滿相異字元數即回傳 true。
