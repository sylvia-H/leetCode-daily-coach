---
id: string-linear-scan
title: String Linear Scan
module: string
pattern_label: Linear Scan
complexity_label: O(n) / O(1)
estimated_minutes: 10
exit_criteria:
  - 能寫出走訪字串索引或字元的標準迴圈，且沒有 off-by-one 錯誤。
---
## Concept

String Linear Scan 是最基礎的字串處理模式：用單一索引從頭到尾依序走訪每個字元，每一步只做常數量的工作——讀取當前字元、更新累積狀態。它為什麼可靠？靠的是迴圈不變式：**走訪到哪裡，狀態就完整涵蓋到哪裡**。進入第 i 步之前，狀態已如實反映前 i 個字元；本步把 s[i] 納入後，不變式繼續成立。於是迴圈結束時，狀態必然涵蓋整個字串，答案可以直接從狀態導出，不需要回頭重看任何字元。這就是「一趟掃描就足夠」的正確性論證，也是它 O(n) 效率的來源。

## Thinking

線性掃描的骨架固定是三段式。第一段：在迴圈**外**初始化累積器——計數器歸零、旗標設初值、頻率陣列或雜湊表建空（放進迴圈內會每步重置，累積就失效了）。第二段：迴圈逐字元「讀取、判斷、更新狀態」。第三段：迴圈結束後由狀態導出答案。邊界要想清楚：0-based 索引的有效範圍是 0 到 n-1，所以終止條件 `i < n` 恰好走訪全部——寫成 `i <= n` 會在最後多讀一個不存在的位置，寫成 `i < n - 1` 則漏掉最後一個字元。有些問題需要兩趟掃描（例如先統計頻率、再找第一個頻率為 1 的位置），兩趟是相加不是相乘，總成本 2n 仍是 O(n)。若目標是「找到即可」的布林條件，達成當下就能 break 提前結束——後面的字元不可能改變「最早出現」的答案。

## Pattern Recognition

題目要求對字串做驗證、計數、搜尋或比對，且逐字元檢查就能累積出答案時，先想線性掃描：檢查格式是否合法、統計各字元出現次數、比對兩字串的頻率是否一致、找出第一個滿足條件的位置。搭配前一課的字元對映，「該加在哪一格」由 `c - 'a'` 決定，頻率統計整趟都是 O(1) 更新。當「連續區間」本身成為條件（如不含重複字元的最長子字串），線性掃描就延伸成滑動視窗——右端仍是一路向前的掃描，只是多了一個會跟進的左端。

## Common Mistakes

頭號陷阱是想就地修改字串：Python 與 JavaScript／TypeScript 的字串都是不可變的。對 `s[i]` 賦值，Python 直接擲出 TypeError；JavaScript 在 strict mode 與 ES module 下同樣擲出 TypeError，只有在非嚴格模式才靜默失敗——不論哪種情況，原字串都不會被改變。需要修改時，先轉成字元陣列（`list(s)` 或 `s.split("")`），改完再 join 回字串。第二是 off-by-one：終止條件與起始索引沒對齊，漏頭漏尾。第三是在迴圈內存取相鄰字元（如 `s[i + 1]`）卻沒先確認 `i + 1` 仍在範圍內——Python 會擲 IndexError，JavaScript 拿到 undefined 後比較結果悄悄出錯。最後留意走訪方式的差異：for...of 與 Python 的 for-in 拿不到索引，需要位置資訊或相鄰比較時，改用索引迴圈或 enumerate。

## Complexity

時間複雜度：O(n)，n 為字串長度，每個字元恰被處理常數次；空間複雜度：O(1)，若使用固定大小的頻率陣列（如 26 格）不隨輸入成長；改用雜湊表記錄時為 O(k)，k 為出現過的相異字元數。

## Digest

線性掃描以單一迴圈走訪字串，正確性由迴圈不變式保證：走訪到哪、累積狀態就涵蓋到哪，結束時答案直接由狀態導出。骨架三段式：迴圈外初始化累積器、迴圈中逐字元更新狀態、迴圈後收尾。邊界上 `i < n` 恰好覆蓋 0 到 n-1 的有效索引；兩趟掃描成本相加仍是 O(n)；布林條件達成即可提前 break。最大陷阱是字串不可變——就地賦值在 Python 擲 TypeError，JavaScript 依模式擲錯或靜默失敗，總之改不動，要改就先轉字元陣列再 join 回來。

## TypeScript Tip

for...of 逐字元走訪最不易出錯，對空字串自然地一次都不執行；需要索引或相鄰比較時再改用 `for (let i = 0; i < s.length; i++)`。

```typescript
function countVowels(s: string): number {
  let count = 0;
  for (const ch of s) {
    if ("aeiou".includes(ch)) count += 1;
  }
  return count;
}

if (countVowels("leetcode") !== 4) throw new Error("assertion failed: count");
if (countVowels("") !== 0) throw new Error("assertion failed: empty");
```

## Python Tip

直接 `for ch in s` 走訪字元；需要位置時用 `enumerate(s)` 同時取得索引與字元，不必手動維護計數變數。

```python
def first_repeat_index(s: str) -> int:
    seen: set[str] = set()
    for i, ch in enumerate(s):
        if ch in seen:
            return i
        seen.add(ch)
    return -1

assert first_repeat_index("abca") == 3, "assertion failed: found"
assert first_repeat_index("abc") == -1, "assertion failed: not found"
```

## Takeaway

一趟迴圈維護狀態走訪全字串；守住 `i < n` 的邊界與字串不可變的事實，多數字串統計與驗證題一趟解決。

## Tomorrow Preview

明天學習字串上的對向 Two Pointers：不再單向前進，而是讓左右兩個指標從字串兩端向中間靠攏，反轉與迴文檢查都是它的主場。

## Today's Challenge

- **387** · 標準的兩趟線性掃描：第一趟累積字元頻率，第二趟依原始順序找出第一個頻率為 1 的位置，合計仍是 O(n)。
  - Hint: 用 26 格陣列或雜湊表先記下所有字元的出現次數，再從頭掃一次查表。
- **242** · 對兩個字串各做一趟掃描，比對字元頻率是否完全一致——頻率相同即互為 anagram。
  - Hint: 用同一個計數陣列，掃第一個字串時遞增、掃第二個時遞減，最後檢查是否全為零。
- **3** · 線性掃描的延伸應用：右端一路向前掃描並記錄字元位置，遇到重複時左端跟進，形成滑動視窗。
  - Hint: 用雜湊表存每個字元最近一次出現的索引，遇重複字元時把左端跳到該索引之後。
