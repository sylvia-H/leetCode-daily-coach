---
id: string-palindrome-expansion
title: Center Expansion for Palindromes
module: string
pattern_label: Two Pointers
complexity_label: O(n^2) / O(1)
estimated_minutes: 15
exit_criteria:
  - >-
    Can write a helper function to expand around single and double character
    centers.
---
## Concept

Center Expansion（中心擴展法）處理「找出字串中最長迴文子字串」這類問題。出發點是一個結構性觀察：每個迴文都有一個對稱中心——長度為奇數時，中心是單一字元；長度為偶數時，中心落在相鄰兩個字元之間。長度 n 的字串因此恰有 2n - 1 個候選中心（n 個字元位置加 n - 1 個字元間隙）。與其枚舉全部 O(n^2) 個子字串、再各花 O(n) 驗證（合計 O(n^3)），不如反過來：站在每個中心上向左右同時擴展，兩側字元相符就繼續、不符即停。它與先修的對向雙指標共用「逐對比較對稱位置」的骨架，只是方向相反——對向雙指標從兩端向內夾擠驗證整串，中心擴展從中心向外生長找極大迴文。

## Thinking

擴展函式的骨架：`while (l >= 0 && r < n && s[l] === s[r]) { l--; r++; }`，起點是單字元中心 (i, i) 或雙字元中心 (i, i + 1)。它的迴圈不變式是：每輪進入迴圈前，內部區間 `[l + 1, r - 1]` 是迴文。初始時兩種起點的內部都是空字串，空字串是迴文，不變式成立；每次比較通過，就把對稱範圍向外推一層。迴圈停下時（不符或越界），`[l + 1, r - 1]` 就是以此中心能達到的極大迴文，長度 (r - 1) - (l + 1) + 1 = r - l - 1——公式不用背，從邊界代回去就得到。為什麼「每個中心只取極大」不會漏掉全域最長？因為同中心的迴文層層嵌套：若 `[l, r]` 是迴文，剝掉最外層的 `[l + 1, r - 1]` 也是；全域最長迴文必有某個中心，而該中心的極大擴展至少延伸到它。主程式只需走訪 2n - 1 個中心、各取極大長度、沿途維護最大值與對應起點。

## Pattern Recognition

看到「最長迴文子字串」，或需要枚舉字串中所有對稱片段時，優先考慮中心擴展。訊號：一、比較行為是以某個基準點向兩側發散、逐對驗證 s[l] 與 s[r]；二、n 在 10^3 量級、O(n^2) 可接受——這正是不必動用線性但實作繁複的 Manacher's Algorithm 的場合。反之，若只需驗證「整個字串」是否迴文，對向雙指標一趟 O(n) 即可，不必枚舉中心。

## Common Mistakes

1. 邊界檢查與字元讀取的順序：條件必須先寫 `l >= 0 && r < n`，靠短路避免越界讀取。順序顛倒時，Python 的 s[-1] 不報錯而是繞回字串尾端、比對到錯的字元；JavaScript 兩端同時越界時 undefined 與 undefined 相等，迴圈永不停止。
2. 漏掉偶數中心：只呼叫 expand(i, i) 會漏掉 abba 這類迴文；每個 i 要同時試 (i, i) 與 (i, i + 1)——後者在 s[i] 與 s[i + 1] 不同時回傳 0，無害。
3. 長度公式寫成 r - l + 1：那是閉區間 `[l, r]` 的長度；擴展停下時 l、r 已各越界一步，真正的迴文是 `[l + 1, r - 1]`，長度 r - l - 1。
4. 由長度反推起點的差一錯：start = i - (m - 1) / 2 要向下取整，奇偶兩種中心才能共用同一條公式；分開各推一條反而容易錯一格。

## Complexity

時間複雜度 O(n^2)：中心共 2n - 1 個，單一中心的擴展最壞走到字串邊界，需 O(n)；全同字元的字串（如 aaaa）每個中心都會擴到底，這個上界是緊的。注意攤銷論證在此不成立——不同中心的 l、r 各自重置，與 Sliding Window 的單向指標不同。空間複雜度 O(1)：只需擴展指標與記錄最佳答案的起點、長度。

## Digest

迴文必有中心：奇數長度的中心是單一字元、偶數長度的中心在相鄰字元之間，長度 n 的字串共 2n - 1 個候選中心。對每個中心以 `while (l >= 0 && r < n && s[l] === s[r])` 向外擴展，停下時 `[l + 1, r - 1]` 是該中心的極大迴文、長度 r - l - 1。同中心迴文層層嵌套，全域最長者必被其中心的極大擴展涵蓋，故逐中心取最大即不漏解。時間 O(n^2)（全同字元如 aaaa 是最壞情況）、空間 O(1)。實作時先驗邊界再讀字元，並對每個 i 同時處理 (i, i) 與 (i, i + 1) 兩種中心。

## TypeScript Tip

條件先驗邊界再比字元，兩端越界時靠 `&&` 短路停下；起點公式 `i - Math.floor((m - 1) / 2)` 奇偶中心通用：

```typescript
import assert from "node:assert";
function longestPalindrome(s: string): string {
  let start = 0, len = 0;
  const expand = (l: number, r: number): number => {
    while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
    return r - l - 1;
  };
  for (let i = 0; i < s.length; i++) {
    const m = Math.max(expand(i, i), expand(i, i + 1));
    if (m > len) { len = m; start = i - Math.floor((m - 1) / 2); }
  }
  return s.slice(start, start + len);
}
assert.strictEqual(longestPalindrome("cbbd"), "bb");
assert.strictEqual(longestPalindrome("babad").length, 3);
```

## Python Tip

Python 負索引會繞回尾端，`l >= 0` 不能省；擴展函式回傳半開區間 `[l + 1, r)` 的上下界，可直接餵給切片：

```python
def expand(s: str, l: int, r: int) -> tuple[int, int]:
    while l >= 0 and r < len(s) and s[l] == s[r]:
        l -= 1
        r += 1
    return l + 1, r

def longest_palindrome(s: str) -> str:
    lo, hi = 0, 0
    for i in range(len(s)):
        for l, r in (expand(s, i, i), expand(s, i, i + 1)):
            if r - l > hi - lo:
                lo, hi = l, r
    return s[lo:hi]

assert longest_palindrome("cbbd") == "bb"
assert len(longest_palindrome("babad")) == 3
assert longest_palindrome("") == ""
```

## Takeaway

迴文必有中心；對 2n - 1 個中心向外擴展取極大，嵌套性保證不漏最長解，O(n^2) 時間、O(1) 空間。

## Tomorrow Preview

明天進入 Basic Substring Search：回到最樸素的子字串搜尋，逐一枚舉起點、逐字元比對，親手實作 indexOf 並理解 O(n * m) 的成本從哪裡來。

## Today's Challenge

- **5** · 求最長迴文子字串是中心擴展的原型題：枚舉 2n - 1 個中心、各自擴到極大，全域最長必在其中。
  - Hint: 寫一個共用的擴展輔助函式，對每個 i 同時試單字元中心 (i, i) 與雙字元中心 (i, i + 1)。
