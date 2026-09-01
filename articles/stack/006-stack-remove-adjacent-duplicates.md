---
id: stack-remove-adjacent-duplicates
title: Stack Remove Adjacent Duplicates
module: stack
pattern_label: Duplicate Elimination
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能將目前元素與 stack 頂端比較以移除重複。
  - 能從 stack 重建出結果字串。
---
## Concept

給定一個字串，反覆刪除相鄰且相同的一對字元，直到再也刪不動為止。難點在於「消除會製造新的相鄰」：`abba` 刪掉中間的 `bb` 之後，原本隔著兩格的兩個 `a` 變成相鄰，還得再刪一次。若用字串反覆搜尋替換來模擬，每刪一輪就得重掃整個字串，最壞退化到 O(n^2)。stack 的觀點把問題翻轉過來：不去「刪除」原字串，而是由左至右「重建」結果——stack 裡隨時維護著已讀前綴消除完畢後的樣子，新字元只需要跟 stack 頂端（也就是它此刻真正的左鄰居）比較一次。

## Thinking

規則只有一條分支：目前字元若與 stack 頂端相同，彈出頂端（一對相鄰重複就地抵銷），且目前字元不進 stack；否則推入目前字元。掃描結束後，stack 由底到頂就是答案。

為什麼一趟就夠？看不變式：處理完前 i 個字元時，stack 的內容恆等於「前 i 個字元反覆消除到底」的結果，其中不存在任何相鄰重複。歸納論證：初始為空，成立。下一個字元進來時——若它與頂端不同，推入後仍無相鄰重複，不變式保持；若相同，彈出頂端等於消掉一對，而彈出後暴露的新頂端與再下一個字元的比較，正是「消除後產生的新相鄰對」的檢查。連鎖消除不需要任何回頭重掃，因為 stack 頂端永遠就是目前字元的實際左鄰居。

擴充到「k 個連續相同才消除」時，只要把 stack 元素換成（字元, 連續計數）：與頂端同字元就把計數加一，加到 k 就整段彈出；不同就推入計數為 1 的新段。不變式同樣保持：stack 裡每一段的計數都小於 k。

## Pattern Recognition

訊號有三：操作是「相鄰元素配對抵銷」；抵銷之後兩側元素靠攏、可能形成新的可抵銷對；答案是消除到底的最終序列。看到這種連鎖抵銷的動態，就該想到用 stack 維護已化簡的前綴。同一家族還有退格字元處理、成對括號消除，以及昨天的 RPN 求值——共同點都是「目前元素只需要與最近一或兩個還活著的元素互動」。反過來，若配對不限相鄰（例如任意位置的同字元兩兩相消），stack 就派不上用場，那是單純的計數問題。

## Common Mistakes

一、重建結果時畫蛇添足：用動態陣列實作 stack 時，由索引 0 往尾端直接串接就是正確順序（底部是最早留下的字元），多做一次反轉反而弄反；真的逐一 pop 出來串接才會得到顛倒的字串。二、空 stack 檢查的語言差異：Python 對空列表取 `stack[-1]` 會直接拋出 IndexError，必須先判空；TypeScript 讀空陣列頂端只會得到 `undefined`，與任何字元比較都是 false、剛好走進推入分支——行為碰巧正確，但仍建議顯式判空，把「空就推入」的意圖寫清楚。三、k 版本用單字元 stack 硬數：每讀一個字元就往回檢查頂端的 k - 1 個是否相同，最壞 O(nk)；改存（字元, 計數）才能維持 O(n)。四、試圖在原字串上原地刪除：每次刪除都要搬移後方所有字元，又回到平方級的成本。

## Complexity

時間複雜度 O(n)：每個字元至多被推入、彈出各一次，每一步都是常數時間的頂端操作。空間複雜度 O(n)：完全沒有可消除對時（例如 `abcde`），stack 會存下整個字串；k 版本存（字元, 計數）段，最壞同為 O(n)。

## Digest

相鄰重複消除：由左至右掃描，目前字元與 stack 頂端相同就彈出（一對抵銷），不同就推入。stack 恆維護「已讀前綴消除到底」的不變式，頂端永遠是目前字元的實際左鄰居，連鎖消除因此免回頭重掃。以 `abbaca` 為例：推 a、推 b，遇 b 與頂端抵銷，遇 a 與新頂端 a 抵銷，再推 c、推 a，答案 `ca`。「k 個連續才消除」的版本改存（字元, 連續計數），計數達 k 整段彈出。O(n) 時間、O(n) 空間，比反覆字串替換的 O(n^2) 快一個量級。

## TypeScript Tip

用陣列當 stack，`stack[stack.length - 1]` 讀頂端；結果直接 `join("")`，不需反轉。

```typescript
function removeDuplicates(s: string): string {
  const stack: string[] = [];
  for (const ch of s) {
    if (stack.length > 0 && stack[stack.length - 1] === ch) stack.pop();
    else stack.push(ch);
  }
  return stack.join("");
}
if (removeDuplicates("abbaca") !== "ca") throw new Error("assertion failed");
if (removeDuplicates("azxxzy") !== "ay") throw new Error("assertion failed");
```

## Python Tip

k 版本把 stack 元素換成 [字元, 計數] 的小列表；最後用生成器把每段展開重建字串。

```python
def remove_k_duplicates(s: str, k: int) -> str:
    stack: list[list] = []  # 每個元素是 [字元, 連續計數]
    for ch in s:
        if stack and stack[-1][0] == ch:
            stack[-1][1] += 1
            if stack[-1][1] == k:
                stack.pop()
        else:
            stack.append([ch, 1])
    return "".join(c * n for c, n in stack)

assert remove_k_duplicates("deeedbbcccbdaa", 3) == "aa", "assertion failed"
assert remove_k_duplicates("abcd", 2) == "abcd", "assertion failed"
```

## Takeaway

stack 頂端就是目前字元的實際左鄰居：相同就抵銷、不同就推入，連鎖消除因此一趟掃描就收工。

## Tomorrow Preview

明天進入 Daily Temperatures，正式踏入 Monotonic Stack：頂端比較的條件從「相等就消除」變成「違反單調就彈出」，stack 從濾除重複進化成替每個元素找到下一個更大值。

## Today's Challenge

- **1047** · 原型題：一對相同相鄰字元抵銷後可能製造新的相鄰對，stack 頂端恰好追蹤這種動態的左鄰居關係。
  - Hint: 目前字元等於頂端就 pop、否則 push；最後把陣列直接 join 就是答案。
- **1209** · 計數擴充：k 個連續相同才消除，stack 元素改存字元與連續計數。
  - Hint: 與頂端同字元就把計數加一，達 k 整段彈出；重建時把每段字元乘以計數展開。
