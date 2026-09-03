---
id: backtracking-subset-with-duplicates
title: Backtracking Subset with Duplicates
module: backtracking
pattern_label: Duplicate Skip Pattern
complexity_label: O(2^n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能正確判斷元素在同一樹層中何時屬於重複。
  - 能乾淨俐落地實作排序與跳過的邏輯。
---
## Concept

昨天的 Challenge 已經列過 90 Subsets II，今天正式處理它唯一的新東西：**輸入含重複值，輸出的子集不能重複**。先看重複從哪來：`[1, 2, 2]` 丟進昨天任一棵樹，兩個 2 在索引上是不同元素，`[1, 2]` 會被生成兩次（取索引 1 的 2、或取索引 2 的 2），`[2]` 也是。昨天的不重複證明靠的是**索引序列**唯一，而題目要的是**值的多重集合**唯一——同一個多重集合對應多條索引序列，這就是重複的來源。昨天提示的 Set 去重是「生成後再丟掉」，樹仍有 2^n 片葉子；今天要做的是在生成之前就不走那條分支。

做法是把「多條索引序列」收斂成唯一的**標準形**。先排序，讓相等的值連成一段（下稱 run）。用 `start` 樹，迴圈裡加一條規則：**`i > start` 且 `nums[i] === nums[i - 1]` 就跳過**。意思是：在同一個節點（同一個迴圈）裡，同一個值只讓第一次出現的那個索引往下走。

為什麼對？看 `i > start` 的反面：一個與前一個相等的 `nums[i]` 能通過檢查，只有在 `i === start` 時——而 `start` 是上一層選走的索引加一，代表 `i - 1` 剛剛被選。所以**索引 `i` 被選且 `nums[i - 1] === nums[i]`，則 `i - 1` 必也被選**：每個 run 裡被選的索引一定是從 run 開頭數起的連續前綴。於是「這個值取 c 份」只剩一種寫法——取該 run 的前 c 個索引。多重集合與標準索引序列因此一一對應：不同路徑的多重集合必不同（不重複）；任何合法多重集合都有它的標準路徑，且沿著標準路徑走的每一步都是「`i === start`」或「值與前一個不同」，沒有一步會被跳掉（不遺漏）。

## Thinking

`[1, 2, 2]` 排序後不變。`bt(0)` 存 `[]`；`i = 0` 取 1 → `bt(1)` 存 `[1]`；`i = 1` 取 2 → `bt(2)` 存 `[1, 2]`；`i = 2` 等於這層的 `start`，不跳，取 2 → `bt(3)` 存 `[1, 2, 2]`。退回 `bt(1)`，`i = 2`：`2 > 1` 且 `nums[2] === nums[1]`，**跳過**——第二個 `[1, 2]` 就是在這裡被擋掉。退回 `bt(0)`，`i = 1` 取 2 → `bt(2)` 存 `[2]`，`i = 2` 是這層的 `start`，不跳，存 `[2, 2]`；最後 `bt(0)` 的 `i = 2` 被跳過。共 6 筆，正好等於 1 取 0 或 1 份（2 種）乘以 2 取 0、1、2 份（3 種）。這個乘積公式也是自我檢查的工具：結果數應等於每個相異值的（出現次數 + 1）連乘。

判斷「同一層」的訣竅：**同一層 = 同一個迴圈**。`i > start` 綁的是這個迴圈的起點，不是全域的 `i > 0`；上一層選了 `nums[i - 1]` 進到下一層時 `start` 正好等於 `i`，所以「再取一份 2」永遠放行，被擋的只有「跳過前一份 2 卻想取這一份」的分支。

同一條規則換到取／不取樹怎麼寫？決定「不取 `nums[i]`」時，要連同後面整段相等的值一起不取，直接跳到 run 的尾端之後；取則照常 `i + 1`。兩種寫法產生的標準形完全相同，只是 `start` 樹一行判斷就寫完，實務上多半用它。

## Pattern Recognition

輸入含重複值、且題目說「結果不能有重複的組合／子集」，就是這個 Pattern：先排序，再在同一層迴圈用 `i > start && nums[i] === nums[i - 1]` 跳過。它不改變樹的形狀，只剪掉會生成重複多重集合的分支，所以能和 `start` 樹上的其他剪枝（目標和、長度上限）疊加。若題目要的是排列而不是子集，「同一個值的第一次出現」要改用 used 標記來界定，不能靠 `start`。

## Common Mistakes

第一，**跨層跳過**：寫成 `i > 0 && nums[i] === nums[i - 1]`。run 裡第二個索引在任何層都被擋，`[1, 2, 2]` 只剩 `[]、[1]、[1, 2]、[2]` 四筆，`[1, 2, 2]` 與 `[2, 2]` 全漏——凡是需要同一個值多份的子集都消失。第二，**忘記排序**：`[2, 1, 2]` 直接套規則，兩個 2 不相鄰，`nums[2] === nums[1]` 永遠不成立，`[2]` 出現兩次、`[2, 1]` 與 `[1, 2]` 是同一個子集，得到 8 筆而非 6 筆。第三，**比較對象寫成下一個**，整個條件變成 `nums[i] === nums[i + 1]`：跳掉的是 run 的第一份而不是後面的份，TypeScript 會安靜給 `[]、[1]、[1, 2]、[2]` 四筆，Python 則在尾端 `i + 1` 越界直接 IndexError。第四，**改成「`path` 裡已經有這個值就跳過」**：這是縱向限制，`[1, 2, 2]` 得到 `[]、[1]、[1, 2]、[1, 2]、[2]、[2]`——不但漏掉 `[2, 2]`，`[1, 2]` 與 `[2]` 仍各出現兩次，因為橫向（同一層兩個 2）的重複它根本沒碰到。

## Complexity

排序 O(n log n)。樹的節點數是每個相異值（出現次數 + 1）的連乘，全部相異時最多 2^n，所以最壞時間 O(n · 2^n)（每個節點存拷貝 O(n)）；重複越多，剪掉的分支越多。額外空間 O(n)：遞迴深度最多 n + 1、`path` 最長 n，輸出不計入。

## Digest

輸入含重複值時，子集的重複來自「同一個多重集合對應多條索引序列」。解法是先排序讓相等值相鄰，再在 `start` 樹的迴圈裡加一條規則：`i > start && nums[i] === nums[i - 1]` 就跳過——同一層只放行同一個值的第一份。它保證每個 run 裡被選的索引一定是從 run 開頭數起的連續前綴，所以「某值取 c 份」只剩一種寫法，多重集合與路徑一一對應，不重不漏。同一層 = 同一個迴圈：上一層剛選了 `nums[i - 1]` 時 `start === i`，再取一份永遠放行。常見錯誤：寫成全域的 `i > 0`（漏掉 `[2, 2]`）、忘記排序（重複殘留）、比較 `i + 1`（跳錯份）。結果數 = 各相異值（次數 + 1）連乘，可用來自檢。時間 O(n · 2^n)、額外空間 O(n)。

## TypeScript Tip

拷貝後再排序、用數值比較器；測資用未排序輸入，所以少了排序、把 `i > start` 寫成 `i > 0`、或拿掉跳過那一行都會被斷言抓到。

```typescript
import { strict as assert } from 'node:assert';

function subsetsWithDup(nums: number[]): number[][] {
  const a = [...nums].sort((x, y) => x - y); // 相等值才會相鄰
  const res: number[][] = [];
  const path: number[] = [];
  const bt = (start: number): void => {
    res.push([...path]);
    for (let i = start; i < a.length; i++) {
      if (i > start && a[i] === a[i - 1]) continue; // 同層只放行第一份
      path.push(a[i]!);
      bt(i + 1);
      path.pop();
    }
  };
  bt(0);
  return res;
}

assert.deepEqual(subsetsWithDup([2, 1, 2]),
  [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]);
assert.equal(subsetsWithDup([4, 4, 4, 1, 4]).length, 10); // 2 × 5
```

## Python Tip

`sorted(nums)` 回傳新 list，不動呼叫端的資料；結果數用（次數 + 1）連乘自檢。

```python
def subsets_with_dup(nums: list[int]) -> list[list[int]]:
    a = sorted(nums)  # 相等值才會相鄰
    res: list[list[int]] = []
    path: list[int] = []

    def bt(start: int) -> None:
        res.append(path[:])
        for i in range(start, len(a)):
            if i > start and a[i] == a[i - 1]:
                continue  # 同層只放行第一份
            path.append(a[i])
            bt(i + 1)
            path.pop()

    bt(0)
    return res

assert subsets_with_dup([2, 1, 2]) == [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]
assert len(subsets_with_dup([4, 4, 4, 1, 4])) == 10  # 2 * 5
assert subsets_with_dup([]) == [[]]
```

## Takeaway

排序後，同一個迴圈裡 `i > start && nums[i] === nums[i - 1]` 就跳過：同一層只放行同一個值的第一份。

## Tomorrow Preview

明天在同一棵 `start` 樹上加「目標和」：Combination Sum 讓元素可以無限次重複使用，遞迴時把 `i` 原樣傳回、並沿途扣減目標。再之後的 Combination Sum II 會把今天的同層跳過與目標和扣減合在一起；Permutation with Duplicates 則把「同一個值的第一份」改用 used 標記來界定。

## Today's Challenge

- **90** · 昨天已列過（提示用 Set 去重）；今天改在樹上剪：排序後在同一層迴圈跳過與前一個相等的值，不生成重複就不必事後丟。
  - Hint: `const a = [...nums].sort((x, y) => x - y)`；`bt(start)` 進入就存拷貝；迴圈裡 `i > start && a[i] === a[i - 1]` 就 `continue`。用（次數 + 1）連乘核對筆數。
