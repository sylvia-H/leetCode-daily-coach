---
id: string-pattern-matching-basic
title: Basic Substring Search
module: string
pattern_label: Linear Scan
complexity_label: O(n * m) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能使用巢狀迴圈實作 indexOf 或在 haystack 中找出 needle。
---
## Concept

Basic Substring Search（基礎子字串搜尋）處理的問題是：給定長度 n 的主字串 haystack 與長度 m 的目標字串 needle，找出 needle 在 haystack 中**首次出現**的起始索引，不存在則回傳 -1。核心觀念是把「出現在哪裡」拆解成「從哪個起點開始匹配」：任何一次成功的匹配都必然有一個起始索引 i，並完整佔據閉區間 [i, i + m - 1]。因此只要枚舉每一個可能的起點、逐一驗證，就不可能漏掉任何匹配——這就是暴力解的完備性論證。起點的合法範圍是 0 到 n - m：一旦 i 超過 n - m，剩餘字元不足 m 個，連容納整個 needle 都做不到，驗證再多也是白工。

## Thinking

實作是標準的雙層迴圈。外層讓起點 i 從 0 走到 n - m（含），並維持一條迴圈不變式：**所有小於 i 的起點都已確認不匹配**。於是第一個驗證成功的 i 就是「首次出現」的位置，當場回傳即可，不必繼續掃描。內層讓 j 從 0 走到 m - 1，逐位比對 haystack[i + j] 與 needle[j]：任何一對不相等就中斷，讓 i 前進一步；j 完整走完（j == m）則代表整段吻合。要特別想清楚的是：**失敗後 i 只能前進 1，不能跳過已比對的長度**。在 "aaab" 裡找 "aab"，起點 0 比到第三個字元才失敗，若順勢跳到起點 3，就錯過了真正的答案起點 1——因為下一個匹配可能與剛失敗的區段重疊。暴力解不利用失敗過程中蒐集到的資訊（那是 KMP 等進階演算法靠前處理才敢做的事），所以逐一枚舉是它守住完備性的唯一辦法。動手前先擋掉退化輸入：m 為 0 依慣例回傳 0；m 大於 n 時直接回傳 -1——把外層邊界寫對的話，這種情況迴圈根本一次都不會執行。

## Pattern Recognition

題目要求「找出子字串首次出現的位置」「判斷一個字串是否包含另一個」「檢查某字串重複拼接後是否涵蓋另一字串」時，就是這個 Pattern。它與昨天的中心擴展同屬「枚舉候選＋逐一驗證」的思路：中心擴展枚舉回文中心，這裡枚舉匹配起點，驗證器各自不同、骨架一致。規模判斷也很直接：n 與 m 在幾萬以內時 O(n * m) 完全可以接受；只有題目給到十萬等級、又刻意構造大量重複字元時，才需要升級到線性時間的進階匹配演算法。

## Common Mistakes

第一是外層邊界寫錯：讓 i 一路走到 n - 1，剩餘長度不足 m 時內層就會讀到不存在的位置——Python 用索引逐位比對會擲 IndexError，JavaScript 則拿到 undefined 之後每次比較都不相等，不擲錯卻默默浪費工。第二是把 i <= n - m 的等號漏掉：當 needle 恰好貼齊 haystack 結尾（在 "abc" 找 "bc"），最後一個合法起點 i = n - m 會被跳過而漏解。第三是成功條件判斷不乾淨：應讓「j 走完整個 needle」明確代表成功，若把回傳與中斷混寫在同一段條件裡，容易把部分匹配誤判為完全匹配。第四是自作聰明的跳步：比對失敗後把 i 推進超過一步，如上所述會破壞完備性。

## Complexity

時間複雜度 O(n * m)：最壞情況下每個起點都要比對接近 m 個字元才失敗，典型構造是在全部為 a 的字串裡找 "aaab"——每個起點都匹配了 m - 1 個字元才在最後一格破功。平均情況通常遠快於此，多數起點在前一兩個字元就中斷。空間複雜度 O(1)，只需兩個迴圈索引；若改用切片比對（如 Python 的 `haystack[i:i+m] == needle`），每次比對會建立 O(m) 的暫存字串，空間就不再是常數，要誠實記帳。

## Digest

基礎子字串搜尋枚舉每一個可能的匹配起點 i（0 到 n - m），內層逐字元驗證 needle 是否從 i 開始完整吻合。完備性由「任何匹配都有起點且會被枚舉到」保證，首次出現由不變式「小於 i 的起點都已確認失敗」保證。失敗後 i 只能前進 1：在 "aaab" 找 "aab" 時跳步會錯過與失敗區段重疊的起點 1。邊界是 i <= n - m——等號漏掉，needle 貼齊結尾的匹配（在 "abc" 找 "bc"）就會漏掉。最壞時間 O(n * m)（全 a 字串找 "aaab" 這類輸入），空間 O(1)；切片比對雖精簡，每次會多出 O(m) 暫存字串。

## TypeScript Tip

手寫雙層迴圈時，`noUncheckedIndexedAccess` 讓 `haystack[i + j]` 的型別是 `string | undefined`，但比較式兩側都是索引存取時可直接互比，undefined 自然造成不相等。寫完拿內建 `indexOf` 交叉驗證。

```typescript
import assert from "node:assert";

function strStr(haystack: string, needle: string): number {
  const n = haystack.length;
  const m = needle.length;
  for (let i = 0; i + m <= n; i++) {
    let j = 0;
    while (j < m && haystack[i + j] === needle[j]) j++;
    if (j === m) return i;
  }
  return -1;
}

assert.strictEqual(strStr("sadbutsad", "sad"), 0);
assert.strictEqual(strStr("abc", "bc"), 1);
assert.strictEqual(strStr("aaaa", "aab"), -1);
assert.strictEqual(strStr("abc", "bc"), "abc".indexOf("bc"));
```

## Python Tip

切片比對讓內層迴圈一行完成：`haystack[i:i + m] == needle` 直接驗證整段，代價是每次比對建立 O(m) 暫存字串。`range(n - m + 1)` 在 m 大於 n 時自然為空，退化情況不需特判。寫完與內建 `find()` 交叉驗證。

```python
def str_str(haystack: str, needle: str) -> int:
    n, m = len(haystack), len(needle)
    for i in range(n - m + 1):
        if haystack[i:i + m] == needle:
            return i
    return -1

assert str_str("sadbutsad", "sad") == 0
assert str_str("abc", "bc") == 1
assert str_str("aaaa", "aab") == -1
assert str_str("abc", "bc") == "abc".find("bc")
```

## Takeaway

枚舉 0 到 n - m 的每個起點、逐字元驗證，失敗只前進一步——完備性與「首次出現」都由此保證。

## Tomorrow Preview

明天是 string 模組的收官課：字串解析與狀態模擬。線性掃描的骨架不變，但每一步從單純計數升級成狀態轉移——用狀態變數與 Stack 逐字元把字串解讀成數值或結構，接住空白、正負號與溢位這些真實世界的髒邊界。

## Today's Challenge

- **28** · 這題就是實作 indexOf 本身：枚舉起點加逐字元驗證的直接練習，外層邊界 i <= n - m 是最大陷阱。
  - Hint: 內層 j 走完整個 needle 才算成功；先處理 m > n 的退化情況，或把邊界寫成迴圈自然涵蓋它。
- **686** · 在「A 重複拼接後是否包含 B」的框架下練習子字串搜尋，重點是先推出重複次數的上界再搜尋。
  - Hint: 拼接到長度首次不小於 B 之後，至多再拼一次就涵蓋所有可能的匹配起點——答案若存在只會是這兩個次數之一，兩個候選都不包含 B 就能斷定無解、回傳 -1。
