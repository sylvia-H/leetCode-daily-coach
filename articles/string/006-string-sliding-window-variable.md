---
id: string-sliding-window-variable
title: Variable-Size Sliding Window on Strings
module: string
pattern_label: Sliding Window
complexity_label: O(n) / O(k)
estimated_minutes: 20
exit_criteria:
  - >-
    Can solve longest substring problems without repeating characters or with
    character constraints.
---
## Concept

可變大小滑動視窗是前一課固定視窗的推廣，慣例完全沿用：視窗是閉區間 `[left, right]`，兩端字元都在窗內；每輪迴圈先把 `s[right]` 納入統計，之後視窗才算包含 right；長度為 `right - left + 1`。差別只在收縮的觸發條件——固定視窗在「長度超過 k」時把左端移出一格，可變視窗則在「狀態違反題目約束」時，用 while 迴圈把 left 持續右移、同步扣掉移出字元的統計，直到視窗恢復合法。視窗大小因此隨字串內容伸縮，適合回答「滿足條件的最長（或最短）子字串」這類長度未知的問題。

## Thinking

模板是三步：納入 `s[right]` → while 違規就收縮 left → 視窗合法時記錄答案。它為什麼是對的？關鍵在約束的單調性：本課處理的約束（無重複字元、替換次數不超過上限）都滿足「把視窗縮小，合法的不會變違規」；反過來說，若 `[left, right]` 違規，任何往左延伸的 `[left', right]` 也必然違規。因此對每個 right，把 left 收縮到「剛好合法」的位置，得到的就是以 right 結尾的最長合法視窗；對所有 right 取最大值，就涵蓋了每一個可能的最佳解，不會漏。效率上，left 只會前進、不會後退，整個過程 left 與 right 各走至多 n 步——即使內層有 while，攤銷後仍是 O(n)，這正是它勝過 O(n^2) 枚舉所有區間的原因。

## Pattern Recognition

題目要求「最長／最短的連續子字串（或子陣列）」，且合法性由能增量維護的狀態決定——字元頻率、相異字元數、可替換次數——就是可變視窗的訊號。動手前做一個反向檢查：約束必須有單調性（縮小視窗不會把合法變違規），這套「違規才收縮」的邏輯才成立；若縮小視窗可能反而違規，就不能套用。長度給死的題目則退回前一課的固定視窗。

## Common Mistakes

1. 收縮用 if 而不是 while：一次右移可能不足以恢復合法（例如連續多個重複字元），必須收縮到合法為止。
2. 移動 left 時忘了同步從統計中扣掉 `s[left]`：頻率表與實際視窗脫節，之後的合法性判斷全部失準。
3. 記錄答案的時機錯誤：必須在收縮完成、視窗確定合法之後記錄 `right - left + 1`；在違規狀態下記錄會把非法長度算進答案。
4. 只在迴圈結束後記一次答案：會漏掉中途曾出現、之後被縮小的最長視窗，答案必須逐輪更新。
5. 相異字元數的維護時機：某字元頻率「減到 0」時才把相異數減一、「從 0 變 1」時才加一，時機錯了收縮條件就會誤判。

## Complexity

時間 O(n)：right 每輪前進一步共 n 步；left 只增不減，整個執行過程累計至多前進 n 步，內層 while 的總成本攤銷到全程仍是線性。空間 O(k)，k 為字元集大小，用於存放視窗內的字元頻率或相異字元數。

## Digest

可變視窗沿用閉區間 `[left, right]` 與「先納入 `s[right]` 再判斷」的慣例：納入右端 → while 違規就收縮左端並同步扣統計 → 合法時記錄 `right - left + 1`。正確性靠約束的單調性（縮小視窗不會把合法變違規）：每個 right 收縮到剛好合法，就是以該端點結尾的最長合法視窗，逐輪取最大值即不漏解。left 與 right 各走至多 n 步，攤銷 O(n) 時間、O(k) 空間，適用於無重複字元、限量替換等「最長子字串」問題。

## TypeScript Tip

`noUncheckedIndexedAccess` 下 `s[right]` 是 `string | undefined`，迴圈邊界已保證存在，用 `!` 收斂：

```typescript
import assert from "node:assert";
function longestUnique(s: string): number {
  const freq = new Map<string, number>();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right]!;
    freq.set(c, (freq.get(c) ?? 0) + 1);
    while ((freq.get(c) ?? 0) > 1) {
      const d = s[left]!;
      freq.set(d, (freq.get(d) ?? 0) - 1);
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}
assert(longestUnique("abcabcbb") === 3);
assert(longestUnique("") === 0);
```

## Python Tip

三步模板：先納入右端，while 違規就收縮左端，合法後才記錄長度：

```python
def longest_unique(s: str) -> int:
    freq: dict[str, int] = {}
    left = best = 0
    for right, c in enumerate(s):
        freq[c] = freq.get(c, 0) + 1
        while freq[c] > 1:
            d = s[left]
            freq[d] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best

assert longest_unique("abcabcbb") == 3
assert longest_unique("") == 0
```

## Takeaway

右端逐格擴張、左端在違規時收縮到剛好合法；約束單調性保證不漏解，指標單向移動保證攤銷 O(n)。

## Tomorrow Preview

明天進入 String Anagram Grouping and Hashing：把每個字串的字元頻率壓成一把分組鍵，用雜湊表把互為 anagram 的字串歸進同一組。

## Today's Challenge

- **3** · 求無重複字元的最長子字串：「無重複」在縮小視窗時必然保持（約束單調），是可變視窗的原型題。
  - Hint: 納入 `s[right]` 後，只要它的頻率超過 1 就收縮 left，收縮完成再記錄長度。
- **424** · 允許替換最多 k 個字元求最長同字元子字串：視窗長度減去窗內最高頻字元數就是需替換的字元數。
  - Hint: 維護窗內各字母頻率與其最大值；`(right - left + 1) - maxFreq > k` 時收縮左端。
- **1876** · 長度固定為 3、要求字元全相異——其實是前一課固定視窗的特例，適合拿來對照兩種收縮條件。
  - Hint: 每輪納入新字元、長度達 4 就移出左端，窗滿且相異字元數為 3 時計數加一。
