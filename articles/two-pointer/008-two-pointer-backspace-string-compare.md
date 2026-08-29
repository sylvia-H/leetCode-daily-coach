---
id: two-pointer-backspace-string-compare
title: Backspace String Compare Backward
module: two-pointer
pattern_label: Two Pointers - Backward Simulation
complexity_label: O(n + m) / O(1)
estimated_minutes: 15
exit_criteria:
  - '能夠正確利用計數器追蹤遇到的退格字元 # 數量'
  - 掌握從右向左掃描字串並同步比對兩個字串有效字元的技巧
---
## Concept

比對兩個含退格符號 # 的字串是否相等，直覺做法是各自從左往右模擬打字：一般字元進 Stack、遇 # 彈出一個，最後比對兩個 Stack——正確，但要 O(n + m) 的額外空間。想壓到 O(1)，關鍵觀察是**退格的影響方向固定：# 只刪它左邊的字元，永遠不影響右邊**。既然影響只往左傳，從右往左走就是「順著因果走」：走到任何位置時，右側所有 # 的刪除效果都已經被讀到、可以用一個計數器記著，於是當場就能判定目前字元是被刪掉還是有效。昨天的單趟掃描維護的是合併段狀態；今天同樣單趟，改的卻是**掃描方向本身**——方向一反，原本要整個 Stack 才裝得下的資訊，縮成一個整數。

## Thinking

設 i、j 分別指向 s 與 t 的最後一個字元，skipI、skipJ 記錄各自「右側已讀到、尚未抵銷」的退格數。每一輪先讓兩個指標各自滑到下一個**有效字元**：目前字元是 # 就 skip++ 並左移；不是 # 但 skip > 0，代表這個字元正是某個退格要刪的對象，skip-- 並左移；兩者皆非才停下。分支順序不能顛倒：# 是「刪除操作」而不是可被刪的字元——即使 skip > 0，讀到 # 仍然要累加而不是拿它去抵銷，否則連續退格（如 ab## 裡的兩個 #）會互相吃掉、刪除數被低估。雙方都停妥後分三種情況收斂：兩邊都停在有效字元，比對之，不同即回傳 false；一邊耗盡（指標小於 0）而另一邊還停在有效字元，長度不同，回傳 false；兩邊同時耗盡，回傳 true。退格數超過剩餘字元也不需特判——skip 有剩但指標已走到 -1 時，滑動迴圈的 i >= 0 條件自然擋住，語意正是整段被刪空。

## Pattern Recognition

兩個訊號合起來指向逆向掃描：字串操作的**影響方向固定朝左**（退格、刪除前一字元），且題目**要求 O(1) 空間**（否則 Stack 模擬就夠了）。可以抽出一條通則：當每個操作只影響它上游（已出現）的內容時，從下游往上游走，「未來的資訊」就全部變成「已讀的資訊」，狀態往往能壓縮成幾個計數器。反過來，若操作會影響右側或雙向（例如游標可任意移動的編輯器），單趟逆向就不夠用。選擇時也要誠實權衡：正向 Stack 解好寫好懂，空間許可時完全合法——逆向雙指標買到的是空間，付出的是邊界複雜度。

## Common Mistakes

第一，連續退格沒累加：遇到 # 寫成 skip = 1 而不是 skip++，連續退格會少刪字元。第二，分支順序顛倒：skip > 0 時先抵銷再判斷是否為 #，會把 # 自己當成被刪字元吃掉——# 是操作，不佔字元位、也不會被刪。第三，只處理「雙方都有字元」的比對，漏掉單邊耗盡：s 已走完、t 還停在有效字元時必須回傳 false，否則 a 與 aa 會被誤判相等。第四，邊界防護：滑動迴圈的條件必須含 i >= 0，否則退格數超過剩餘字元時會以負索引取值。

## Complexity

時間複雜度 O(n + m)：兩個指標各自單調左移、絕不回頭，每個字元至多被讀一次，滑動與比對的成本攤下來是線性。空間複雜度 O(1)：只用兩個指標與兩個計數器，不建 Stack、不生成新字串——這正是逆向掃描換來的核心紅利。

## Digest

Backspace Compare 的公式：i、j 指向兩字串尾端，各配一個 skip 計數器 → 每輪先各自滑到有效字元（遇 # 則 skip++；非 # 且 skip > 0 則 skip-- 跳過；否則停）→ 比對。以 s = "ab##"、t = "c#d#" 為例：s 從尾端讀到兩個 # 使 skip = 2，接著 b、a 依序被抵銷，指標走到 -1；t 讀到 # 刪 d、再讀到 # 刪 c，同樣走到 -1——雙雙刪空，回傳 true。收斂三情況：字元不同 false、單邊先耗盡 false、雙雙耗盡 true。兩個順序鐵則：# 永遠累加（即使 skip > 0）、字元要等 skip 歸零才算有效。

## TypeScript Tip

把「滑到下一個有效字元」抽成 helper，回傳停住的索引。三個斷言依序驗證：一般字元直接停住、連續兩個 # 往前刪掉 y 與 x、退格數超過剩餘字元時安全落在 -1。

```typescript
import assert from "node:assert";

function nextValid(s: string, i: number): number {
  let skip = 0;
  while (i >= 0) {
    if (s[i] === "#") skip++;
    else if (skip > 0) skip--;
    else break;
    i--;
  }
  return i;
}

assert.strictEqual(nextValid("axy##b", 5), 5);
assert.strictEqual(nextValid("axy##b", 4), 0);
assert.strictEqual(nextValid("a###b", 3), -1);
```

## Python Tip

完整比對用倒序 while 迴圈：每輪先各自滑到有效位，再做三向收斂。斷言涵蓋「雙雙刪空」「刪除後長度不同」與「連續退格刪光整段前綴」。

```python
def backspace_compare(s: str, t: str) -> bool:
    def prev(x: str, i: int) -> int:
        skip = 0
        while i >= 0:
            if x[i] == "#": skip += 1
            elif skip: skip -= 1
            else: break
            i -= 1
        return i
    i, j = len(s) - 1, len(t) - 1
    while i >= 0 or j >= 0:
        i, j = prev(s, i), prev(t, j)
        if (i >= 0) != (j >= 0): return False
        if i >= 0 and s[i] != t[j]: return False
        i, j = i - 1, j - 1
    return True

assert backspace_compare("ab##", "c#d#")
assert not backspace_compare("a", "aa")
assert not backspace_compare("bxj##tw", "bxj###tw")
```

## Takeaway

退格只往左作用——從尾端逆著走、用計數器抵銷刪除，Stack 的空間縮成一個整數。

## Tomorrow Preview

明天回到相向夾擠並替它加上容錯：Valid Palindrome II——兩端字元不合時，分別試試跳過左邊或右邊那一個，看剩下的部分還是不是迴文。

## Today's Challenge

- **844** · 退格影響固定朝左＋題目要求 O(1) 空間，兩個訊號都指向逆向雙指標，是這個 Pattern 的代表題。
  - Hint: 兩指標從尾端出發，各用一個計數器累計 #；先滑到有效字元再比對，留意單邊先耗盡的情況。
