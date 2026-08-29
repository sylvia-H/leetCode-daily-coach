---
id: sliding-window-longest-substring-no-repeat
title: Longest Substring Without Repeating Characters
module: sliding-window
pattern_label: Variable Sliding Window + Hash Map
complexity_label: 'O(n) / O(min(n, charset))'
estimated_minutes: 20
exit_criteria:
  - 能使用 hash map 或頻率陣列在 O(1) 時間內偵測重複字元。
  - 能將左指標跳過或收縮到重複字元前一次出現位置之後。
---
## Concept

「無重複字元的最長子字串」這一題你其實已經見過三次：string 的線性掃描課初次照面（當時的 Hint 就點過「記最後索引、把左端跳過去」的想法），hash-table 課用 Set 走「先查、再縮、後加」，string 的可變視窗課用頻率表走「先納入、違規就逐格收縮」。逐格收縮的兩種寫法都正確，攤銷後也都是 O(n)。本課把線性掃描課 Hint 裡的跳躍想法完整實作並論證：Hash Map 不記次數，改記每個字元「最後一次出現的索引」——遇到重複時，left 不再逐格右移，而是直接跳到 `map[c] + 1`。慣例照舊：視窗是閉區間 `[left, right]`，長度為 `right - left + 1`；改變的只有收縮方式，從「一步步走回合法」變成「一步跳到合法」。

## Thinking

為什麼跳到 `map[c] + 1` 是安全的？納入 `s[right]`（記為 c）後若視窗違規，原因唯一：c 在窗內另有一次出現，位置就是 `map[c]`。任何左端 ≤ `map[c]` 的視窗都同時包含兩個 c，必然違規；所以以 right 結尾的最長合法視窗，左端最小就是 `map[c] + 1`——直接跳過去不會漏解，中間被略過的起點本來就全是非法起點。

跳躍帶來一個逐格收縮沒有的陷阱：map 記的是整個掃過的前綴中每個字元的最後位置，那個字元可能早已被丟出視窗，索引是過期的。因此更新必須寫成 `left = max(left, map[c] + 1)`——若 `map[c] < left`，那次出現在窗外，left 保持不動。「left 單調不回退」正是本演算法的迴圈不變式。每輪最後把 `map[c]` 更新為 right，並記錄 `right - left + 1`。

要誠實說明：這不是漸進複雜度上的優化。逐格收縮的 left 同樣只前進不後退，攤銷後一樣是 O(n)。跳躍版的差別在每一輪都是最壞情況 O(1)（沒有內層 while），以及「記位置而非記次數」這個想法本身——它在之後許多題目還會再出現。

## Pattern Recognition

何時記位置、何時記次數？「無重複」這種約束，違規來源唯一（就是剛納入的字元）且一步可定位，位置 map 才有用武之地。若約束是「至多 k 種相異字元」「允許替換至多 k 次」，違規時該退多遠無法一步算出，仍要用頻率表逐格收縮——那是更一般的模板，位置 map 是唯一性約束下的特化。看到「最長子字串」加上「無重複／全相異」的題目，兩條路都通；目標是兩種都能寫、也說得出差異。

## Common Mistakes

以下每一條都實際執行驗證過：

1. 忘了取 max，直接寫 `left = map[c] + 1`：left 會回退。輸入 `"abba"`，掃到第二個 a 時 `map['a']` 是 0，left 從 2 退回 1，視窗 "bba" 內含重複的 b，答案算成 3（正確為 2）。
2. 先更新 map 再判斷重複：`map[c]` 已被覆寫成 right，left 每輪都被推到 `right + 1`，長度永遠是 0。輸入 `"abc"` 答案算成 0（正確為 3）。
3. 只在字元第一次出現時寫入索引、重複時不更新：索引停在最舊位置。輸入 `"aaa"`，掃到第三個 a 時 `map['a']` 仍是 0、小於 left，被誤判為窗外而不收縮，答案算成 2（正確為 1）。每一輪都必須執行 `map[c] = right`。

## Complexity

時間複雜度 O(n)：右指標走 n 步，每步做一次查表、一次寫表、一次取 max，皆為 O(1)，沒有內層迴圈。空間複雜度 O(min(n, m))，m 為字元集大小：map 的鍵數不超過相異字元數，例如全小寫字母時至多 26 個鍵。

## Digest

無重複最長子字串的跳躍版解法：Hash Map 記每個字元最後一次出現的索引，納入 `s[right]` 發現重複時，left 直接跳到 `map[c] + 1`——左端 ≤ `map[c]` 的視窗必含兩個同字元，全是非法起點，跳過不漏解。但 map 記的是全前綴的位置、可能過期，必須寫 `left = max(left, map[c] + 1)` 防回退：輸入 `"abba"` 掃到第二個 a 時 `map['a']` 是 0、已在窗外，left 若退回會錯算成 3（正確 2）。每輪更新 `map[c] = right`、記錄 `right - left + 1`。與先前的逐格收縮同為攤銷 O(n)；跳躍版的差別是每輪最壞 O(1)、沒有內層 while。

## TypeScript Tip

`noUncheckedIndexedAccess` 下 `s[right]` 是 `string | undefined`，迴圈邊界保證存在，用 `!` 收斂；`map.get()` 即使在 `has()` 之後型別仍是 `number | undefined`，同樣用 `!`：

```typescript
import assert from "node:assert";
function lengthOfLongestSubstring(s: string): number {
  const last = new Map<string, number>();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right]!;
    if (last.has(c)) left = Math.max(left, last.get(c)! + 1);
    last.set(c, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
assert.strictEqual(lengthOfLongestSubstring("abba"), 2);
assert.strictEqual(lengthOfLongestSubstring("bbbbb"), 1);
assert.strictEqual(lengthOfLongestSubstring("abcdef"), 6);
assert.strictEqual(lengthOfLongestSubstring(""), 0);
```

## Python Tip

`dict.get` 給預設值 -1，可把「沒出現過」與「出現在窗外」合併成同一條 max 更新，省掉 if 分支：

```python
def length_of_longest_substring(s: str) -> int:
    last: dict[str, int] = {}
    left = best = 0
    for right, c in enumerate(s):
        left = max(left, last.get(c, -1) + 1)
        last[c] = right
        best = max(best, right - left + 1)
    return best

assert length_of_longest_substring("tmmzuxt") == 5
assert length_of_longest_substring("aaaa") == 1
assert length_of_longest_substring("abc") == 3
```

## Takeaway

map 記字元最後索引，重複時 left 一步跳到 `map[c] + 1`；取 max 保證 left 只前進不回退。

## Tomorrow Preview

明天進入 Max Consecutive Ones with Replacements：約束從「零重複」換成「至多 k 個可翻轉的 0」，狀態退回計數式的收縮判準；之後的 Fruit Into Baskets 再把配額推廣到「至多兩種相異元素」。

## Today's Challenge

- **3** · 先修課已用 Set 與頻率表逐格收縮解過本題；這次把位置 map 跳躍完整落地，重點在過期索引與 left 不回退。
  - Hint: map 記每個字元最後索引；納入 `s[right]` 時 `left = max(left, map[c] + 1)`，再更新 `map[c] = right` 並記錄長度。
