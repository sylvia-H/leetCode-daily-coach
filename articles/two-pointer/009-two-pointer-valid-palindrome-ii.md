---
id: two-pointer-valid-palindrome-ii
title: Valid Palindrome with Single Deletion
module: two-pointer
pattern_label: Two Pointers - Conditional Branching
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能夠在發現字元不相等時正確驗證跳過左邊或跳過右邊的子字串是否為迴文
  - 理解分支邏輯對時間複雜度的影響仍保持在 O(n)
---
## Concept

Valid Palindrome with Single Deletion 把嚴格迴文檢查加上一格容錯：允許刪除至多一個字元。骨架不變——left 從 0、right 從 n - 1 相向夾擠，不變式仍是「區間 [left, right] 之外的字元已全部成對相符」。差別發生在 s[left] 與 s[right] 不相等的那一刻：嚴格版可以立即回傳 false，容錯版此時還有一次刪除額度，而這個第一個不匹配點恰好把刪除位置釘死在兩端之一。理由：若刪掉的是區間內部（不含兩端）的字元，s[left] 與 s[right] 在新字串中仍互為對位，不相等的事實原封不動；若刪掉的是區間外的字元，可以推得那條「對位相等鏈」正好等價於刪 s[left] 的情形。所以只需要分支驗兩個子問題：s[left+1..right] 或 s[left..right-1] 是否為嚴格迴文，其一成立即可。

## Thinking

主迴圈與嚴格版完全相同：`while (left < right)`，相等就 left++、right--（相遇那格與自己必然相符，不需比）。第一次遇到 s[left] 不等於 s[right] 時，改呼叫嚴格檢查的 helper isValid(l, r) 兩次：isValid(left + 1, right) 對應刪左、isValid(left, right - 1) 對應刪右，用邏輯 OR 合併後**直接回傳**——分支之後不能再回到主迴圈，因為主迴圈的前提「至今零刪除」已不成立。「相等時不動用額度」這個貪婪決策也要交代：成對相符的位置不需要修理，把唯一的額度留到第一個確定壞掉的位置，由前面的釘死論證保證不會因此錯過任何解。子檢查內部就是普通的嚴格迴文檢查——額度已用完，再遇到不匹配就直接 false，不會再分支。

## Pattern Recognition

訊號：題目允許「刪除、修改至多 k 個字元」後滿足某種對稱結構，且 k 很小、分支次數有明確上限——k = 1 的迴文變體是最常見特例，雙指標加條件分支能維持線性時間。上一課的退格比對也是同族：指標移動附帶條件判斷，只是它的分支由退格符號觸發。反訊號：k 較大或允許任意位置插入與取代（如編輯距離類題目），分支會組合爆炸，該換動態規劃。

## Common Mistakes

一、只試刪左忘了刪右：`"abac"` 在 (0, 3) 不匹配，刪左得 "bac" 失敗、刪右得 "aba" 成功；`"caba"` 則相反，只有刪左成立——兩個方向都必須驗。二、分支後又回到主迴圈：例如把回傳語句縮排進迴圈或漏寫 return，等於偷偷多送刪除額度，會把該失敗的字串放行。三、子檢查寫成還能繼續分支的遞迴：額度只有一次，子問題必須退化為嚴格檢查，否則正確性與複雜度一起壞掉。四、子範圍邊界差一：刪左是 [left+1, right]、刪右是 [left, right-1]；用 Python 切片時右端不含，刪左要寫 s[left+1:right+1]，少那個 +1 就把 right 位置的字元也丟了。

## Complexity

時間 O(n)：主掃描至多 n / 2 輪；分支最多發生一次，產生兩個各至多 n 步的嚴格檢查，總比較次數不超過約 2n，仍是線性。空間方面要誠實記帳：用索引夾擠的迭代版 helper 只需常數個變數，O(1)；若圖方便用 Python 切片加反轉來驗子字串，每次切片都複製 O(n) 字元，空間升為 O(n)。

## Digest

一句話公式：嚴格迴文檢查照走，第一個不匹配點就是唯一需要動刀的位置——分支驗 s[left+1..right]（刪左）與 s[left..right-1]（刪右），其一為嚴格迴文即回 true，兩者皆敗即 false。錨點：`"abac"` 只有刪右（留下 "aba"）成立、`"caba"` 只有刪左成立、`"abcda"` 兩邊都救不回來。正確性靠兩件事：區間外已成對相符，刪區間外等價於刪 s[left]；刪區間內部則 s[left] 與 s[right] 仍互為對位，救不了不匹配。分支至多一次、子檢查不再分支，時間維持 O(n)。

## TypeScript Tip

用箭頭函式把嚴格檢查封裝在閉包裡，共用外層的 s、只傳索引，不切字串，額外空間 O(1)。

```typescript
import assert from "node:assert";

function validPalindromeII(s: string): boolean {
  const isValid = (l: number, r: number): boolean => {
    while (l < r) {
      if (s[l] !== s[r]) return false;
      l++;
      r--;
    }
    return true;
  };
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) {
      return isValid(left + 1, right) || isValid(left, right - 1);
    }
    left++;
    right--;
  }
  return true;
}

assert.strictEqual(validPalindromeII("caba"), true); // 只有刪左成立
assert.strictEqual(validPalindromeII("abac"), true); // 只有刪右成立
assert.strictEqual(validPalindromeII("abcda"), false);
assert.strictEqual(validPalindromeII("racecar"), true);
```

## Python Tip

切片寫法極簡，但注意兩件事：切片右端不含，刪左要寫 s[left + 1 : right + 1]；`return True` 必須縮排在 while 之外，縮進迴圈會讓第一輪相符就提前放行。

```python
def valid_palindrome_ii(s: str) -> bool:
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            skip_left = s[left + 1 : right + 1]
            skip_right = s[left:right]
            return skip_left == skip_left[::-1] or skip_right == skip_right[::-1]
        left += 1
        right -= 1
    return True

assert valid_palindrome_ii("caba") is True
assert valid_palindrome_ii("abac") is True
assert valid_palindrome_ii("abcda") is False
assert valid_palindrome_ii("x") is True
```

## Takeaway

第一個不匹配點釘死刪除位置：分支驗刪左與刪右兩個嚴格子檢查，其一成立即可，整體仍是 O(n)。

## Tomorrow Preview

明天同一副相向骨架從「驗證」改做「搬動」：依奇偶等條件把陣列原地分成兩群的 Partitioning——逐對比較換成條件交換，不變式從「對稱相符」變成「兩側已就位」。

## Today's Challenge

- **680** · 本課的原型題：嚴格迴文檢查一遇不匹配，就分支驗證兩個刪除子問題。
  - Hint: 封裝 isValid(l, r) 做嚴格檢查；不匹配時回傳 isValid(left + 1, right) 或 isValid(left, right - 1) 的邏輯 OR，分支後不要再回主迴圈。
