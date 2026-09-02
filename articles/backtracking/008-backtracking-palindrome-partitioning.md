---
id: backtracking-palindrome-partitioning
title: Backtracking Palindrome Partitioning
module: backtracking
pattern_label: String Partitioning Pattern
complexity_label: O(n * 2^n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能在遞迴過程中於不同切點切出子字串。
  - 能把回文驗證整合為剪枝條件。
---
## Concept

把字串切成若干段、每段都要是回文、列出所有切法——這是 Backtracking 的另一種決策樹：**每個節點問「下一刀切在哪」**。狀態只需要一個整數 `start`（它左邊的字元都已切好），選擇是「從 `start` 往右取一段前綴 `s[start:end]`」，`end` 從 `start + 1` 一路試到 `n`。取了這段就把它 push 進 `path`，遞迴處理剩下的後綴；`start === n` 時 `path` 就是一組完整切法，存一份拷貝。這仍是前兩課那套 choose → explore → unchoose，只是「選擇」從「挑哪個元素」變成「切多長」。

正確性分兩半。**不重不漏**：一種切法就是一組遞增的切點 `0 < c1 < c2 < … < n`，而樹上每條根到葉的路徑恰好列出一組遞增切點（每層選的 `end` 都大於本層的 `start`），路徑與切法一一對應，所以每種切法恰生成一次，不需要任何去重。**剪枝安全**：題目要求「每一段都是回文」，而一段是不是回文只取決於那一段本身，後面怎麼切都救不回來；所以前綴 `s[start:end]` 一旦不是回文，以它開頭的整棵子樹裡沒有任何合法解，直接 `continue` 不會漏掉任何答案。這條「合法性可以逐段獨立判定」的性質，就是能在分支點、而不是等到葉節點才剪枝的理由。

## Thinking

用 `s = "aab"` 追一遍。`bt(0)`：`end = 1` 取 `"a"`，是回文，push → `bt(1)`：`end = 2` 取 `"a"`，push → `bt(2)`：`end = 3` 取 `"b"`，push → `bt(3)`，`start === 3` 收下 `["a","a","b"]`，返回、pop 掉 `"b"`；`bt(2)` 迴圈結束返回、pop 掉第二個 `"a"`；`bt(1)` 換 `end = 3` 取 `"ab"`，不是回文，跳過；返回、pop 掉第一個 `"a"`。`bt(0)` 換 `end = 2` 取 `"aa"`，是回文，push → `bt(2)` 收下 `["aa","b"]`；再換 `end = 3` 取 `"aab"`，不是回文，跳過。結果兩組，順序由「短前綴先試」決定。

兩個索引慣例要對齊：這裡 `end` 是**不含**的右界，`slice(start, end)` 取到的是索引 `start` 到 `end - 1`，所以迴圈上界要寫 `end <= n`，遞迴傳的是 `bt(end)` 而不是 `bt(end + 1)`。回文檢查用兩個索引 `l = start`、`r = end - 1` 向中間比，不必再切一份字串出來反轉。和排列那課不同，這裡不需要 `visited`：片段是連續的、由左往右消耗，`start` 一個整數就完整描述了「還剩什麼沒切」。

## Pattern Recognition

看到「把字串或陣列**切成連續片段**，每段要滿足某個條件，列出**所有**切法」，就是這棵「下一刀切在哪」的樹：狀態是起點索引，選擇是片段長度，遞迴處理剩餘後綴。條件可以換：每段是回文、每段是合法的數字區間、每段在字典裡……只要「每段合不合法只看該段自己」，就能在分支點剪枝。反過來，若題目只問「最少切幾刀」或「有幾種切法」而不用列出每一種，優先想 DP——列舉所有切法是指數量級，只需要計數或最佳值時付不起這個代價。

## Common Mistakes

第一，**迴圈上界少了等號**：寫 `end < n` 而非 `end <= n`，最後一個字元永遠切不到，`start` 永遠到不了 `n`，任何輸入都回傳空清單——`"a"` 得 `[]` 而不是 `[["a"]]`。第二，**遞迴傳 `bt(end + 1)`**：多跳過一個字元，`"ab"` 得 `[["a"]]`、`"aab"` 得 `[["aa"]]`，每組都少了字。第三，**把 `end` 當含的右界卻仍寫 `slice(start, end)`**：第一個前綴是空字串，空字串算回文，`bt(end)` 等於 `bt(start)`，原地遞迴直到 RangeError。第四，**忘記 pop**：`"aab"` 得 `[["a","a","b"],["a","a","b","aa","b"]]`，組數對、內容錯，只數長度的測試抓不到。第五，**存 `path` 本身不存拷貝**：`"aab"` 得 `[[],[]]`。第六，**不剪枝、只在葉子驗**：結果會對，但 16 個相異字元的字串要走完 32768 片葉子才找到唯一的一組解，剪枝版只走 16 層就結束。

## Complexity

長度 n 的字串有 n - 1 個縫隙，每個縫隙切或不切，共 2^(n-1) 種切法；全是同一個字母時每種都合法，是最壞情況。每片葉子拷貝 `path` 要 O(n)，每條邊的回文檢查也是 O(n)，所以時間 O(n · 2^n)。預先用 O(n²) 建一張 `pal[i][j]` 表能讓每次檢查變 O(1)（n = 15 全同字母時，逐次比較要 21837 次字元比對，建表只要填 120 格），但整體仍是 O(n · 2^n)——答案數本身就是指數，每筆又要 O(n) 拷貝，建表省的是常數因子。額外空間 O(n)：遞迴深度與 `path` 長度都最多 n；輸出本身不計入。

## Digest

回文切分＝「下一刀切在哪」的決策樹：狀態只有起點 `start`，選擇是前綴 `s[start:end]`（`end` 從 `start + 1` 到 `n`），是回文才 push、遞迴 `bt(end)`、pop；`start === n` 時存一份 `path` 拷貝。不重不漏是因為每條路徑對應唯一一組遞增切點；能在分支點剪枝是因為每段是否回文只看該段自己、後面的切法救不回來。索引慣例要對齊：`end` 不含，迴圈到 `end <= n`，遞迴傳 `end` 不是 `end + 1`。少等號會全空、傳 `end + 1` 會漏字、忘記 pop 組數對內容錯、存參考得到空陣列。時間 O(n · 2^n)（2^(n-1) 種切法各拷貝 O(n)），額外空間 O(n)；預建回文表只省常數。

## TypeScript Tip

`end` 不含，迴圈跑到 `s.length`；`isPal` 拿索引比。測資能擋下少等號、`bt(end + 1)`、忘記 pop、不剪枝。

```typescript
import { strict as assert } from 'node:assert';

function isPal(s: string, l: number, r: number): boolean {
  while (l < r) if (s[l++] !== s[r--]) return false;
  return true;
}
function partition(s: string): string[][] {
  const res: string[][] = [], path: string[] = [];
  const bt = (start: number) => {
    if (start === s.length) { res.push([...path]); return; }
    for (let end = start + 1; end <= s.length; end++) {
      if (!isPal(s, start, end - 1)) continue;
      path.push(s.slice(start, end));
      bt(end);
      path.pop();
    }
  };
  bt(0);
  return res;
}

assert.deepEqual(partition('aab'), [['a', 'a', 'b'], ['aa', 'b']]);
assert.deepEqual(partition('abca'), [['a', 'b', 'c', 'a']]);
```

## Python Tip

`s[start:end]` 同樣不含 `end`；`piece != piece[::-1]` 一行判回文，`path[:]` 才是拷貝，`append(path)` 會得到一堆空 list。

```python
def partition(s: str) -> list[list[str]]:
    res: list[list[str]] = []
    path: list[str] = []

    def bt(start: int) -> None:
        if start == len(s):
            res.append(path[:])
            return
        for end in range(start + 1, len(s) + 1):
            piece = s[start:end]
            if piece != piece[::-1]:  # 非回文：整棵子樹剪掉
                continue
            path.append(piece)
            bt(end)
            path.pop()

    bt(0)
    return res

assert partition("aab") == [["a", "a", "b"], ["aa", "b"]]
assert partition("abca") == [["a", "b", "c", "a"]]
```

## Takeaway

狀態只有 `start`，選擇是前綴長度；前綴非回文就剪掉整棵子樹，`start === n` 時存一份拷貝。

## Tomorrow Preview

明天把 Backtracking 搬到 2D 網格上：從某一格出發、往上下左右四個方向遞迴，搜尋與目標單字相符的字元序列；重點是就地暫時標記已走訪的格子、探索結束後還原。

## Today's Challenge

- **131** · 本課的模板題：狀態是起點索引、選擇是前綴長度、前綴是回文才往下走，把「切點列舉」與「逐段剪枝」一次練到位。
  - Hint: `bt(start)`：`start === n` 時存 `path` 拷貝；否則 `end` 從 `start + 1` 到 `n`，前綴是回文才 push、`bt(end)`、pop。回傳所有切法，順序不拘。
