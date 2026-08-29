---
id: sliding-window-fruit-into-baskets
title: Fruit Into Baskets (At Most K Distinct)
module: sliding-window
pattern_label: Variable Sliding Window + Frequency Map
complexity_label: O(n) / O(k)
estimated_minutes: 20
exit_criteria:
  - 能維護元素頻率的 hash map，以追蹤視窗內相異元素的數量。
  - 能從左側收縮視窗，直到相異數量降回允許的上限。
---
## Concept

前兩課的可變視窗各管一種限制：無重複子字串限制「每個字元至多出現一次」，最大連續 1 限制「至多翻轉 k 個 0」。本課把限制換成第三種：**視窗內的相異種類數至多 k**（水果題的 k = 2）。種類數無法只靠一個計數器維護——你得知道每種元素還剩幾個，才知道左端移出一個之後該種類是否徹底消失。因此本課引入 frequency map：鍵是元素、值是它在視窗內的出現次數，而「視窗內有幾種元素」就是 map 的鍵數。慣例沿用先前課程：視窗是閉區間 `[left, right]`，每輪先把 `nums[right]` 納入頻率表，若種類超標才收縮左端，視窗長度恆為 `right - left + 1`。

## Thinking

先論證這個做法為什麼是對的。關鍵性質是**合法性對收縮單調**：把視窗縮小，相異種類數只會不變或變少，不會變多。所以對每個固定的 right，收縮迴圈停在第一個讓種類數降回上限的 left——這就是「以 right 結尾的最長合法視窗」。右端走遍整個陣列、每輪都拿 `right - left + 1` 更新最大值，等於枚舉了每個結尾位置的最佳解，答案自然涵蓋全域最長。再看收縮這一步的細節：左端移出元素 d 時，`freq[d]` 減一；**若減到 0，必須把鍵刪掉**，因為我們拿「鍵數」當種類數，殘留的零計數鍵會虛報種類。效率上，left 只前進不後退，整趟最多走 n 步，攤銷後每個元素進出視窗各一次，整體 O(n)。

## Pattern Recognition

題目出現「最長子陣列或子字串」加上「至多 k 種相異元素」——兩個籃子各裝一種水果、至多 k 種字元的最長子字串——就是本課模式。辨識重點是合法性判準：它取決於**雜湊表的鍵數**，而不是某個元素的個數或數值總和。同族對照：頻率上限型（無重複，每字元至多 1 次）、預算型（至多 k 個 0）、種類數型（本課）。三者共用同一副「右端擴張、超標收縮」骨架，換的只是頻率表上的判準。

## Common Mistakes

第一，歸零不刪鍵。用 `freq.size` 判種類卻只把計數減到 0 不刪：對 `[1, 2, 3]`，納入 3 後鍵數永遠是 3，收縮迴圈停不下來，left 一路衝出陣列——Python 立刻 IndexError，JavaScript 則陷入無窮迴圈。注意這是**策略相依**：若改用獨立的種類計數器（計數歸零時計數器減一），不刪鍵也完全正確；錯的是「拿鍵數當判準卻不刪」的混搭。第二，最大值更新放在收縮之前。對 `[1, 2, 3]` 會在收縮前記下長度 3，但正解是 2——答案安靜偏大。第三，種類超標時整個重來（left 直接跳到 right、清空頻率表）：對 `[1, 2, 2, 3, 2, 2]` 只得 3，正解是 5（`[2, 2, 3, 2, 2]`）——重來會丟掉與新元素仍可共存的尾段，答案安靜偏小。

## Complexity

時間 O(n)：right 走 n 步；left 只前進不後退，整趟合計最多 n 步，每步的頻率更新與刪鍵都是 O(1)，攤銷後線性。空間 O(k)：頻率表在收縮完成後至多 k 個鍵，收縮過程中短暫達 k + 1 個。

## Digest

「至多 k 種相異元素的最長子陣列」用可變視窗加 frequency map：每輪先把 `nums[right]` 納入頻率表，鍵數超過 k 就收縮左端——移出元素計數減一、歸零就刪鍵——直到鍵數降回 k，再以 `right - left + 1` 更新答案。正確性靠合法性對收縮單調：每個 right 都取到以它結尾的最長合法視窗。實例 `[1, 2, 2, 3, 2, 2]`、k = 2：納入 3 超標，左端把 1 移出即恢復合法，視窗成為 `[2, 2, 3]`，再擴張成 `[2, 2, 3, 2, 2]` 得 5；若遇超標就整個重來只得 3。時間 O(n)、空間 O(k)。

## TypeScript Tip

Map 取值回傳 `number | undefined`，累加前用 `?? 0` 收斂；歸零就 `delete`，`freq.size` 才恆等於視窗內種類數。

```typescript
import assert from "node:assert";
function totalFruit(nums: number[]): number {
  const freq = new Map<number, number>();
  let left = 0, best = 0;
  for (let right = 0; right < nums.length; right++) {
    const c = nums[right]!;
    freq.set(c, (freq.get(c) ?? 0) + 1);
    while (freq.size > 2) {
      const d = nums[left]!;
      const n = (freq.get(d) ?? 0) - 1;
      if (n === 0) freq.delete(d);
      else freq.set(d, n);
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}
assert(totalFruit([1, 2, 2, 3, 2, 2]) === 5);
assert(totalFruit([1, 1, 1]) === 3);
assert(totalFruit([3, 3, 1, 2, 2]) === 3);
```

## Python Tip

`len(freq)` 就是視窗內的種類數，但前提是歸零的鍵確實用 `del` 移除，否則收縮迴圈永遠停不下來。

```python
def total_fruit(nums: list[int]) -> int:
    freq: dict[int, int] = {}
    left = best = 0
    for right, c in enumerate(nums):
        freq[c] = freq.get(c, 0) + 1
        while len(freq) > 2:
            d = nums[left]
            freq[d] -= 1
            if freq[d] == 0:
                del freq[d]
            left += 1
        best = max(best, right - left + 1)
    return best

assert total_fruit([1, 2, 2, 3, 2, 2]) == 5
assert total_fruit([1, 1, 1]) == 3
assert total_fruit([0, 1, 2, 2]) == 3
```

## Takeaway

拿頻率表鍵數當合法性判準的可變視窗：超標就收縮左端並刪除歸零的鍵，每個 right 都取到最長合法視窗。

## Tomorrow Preview

明天進入 Permutation in String：視窗從「至多 k 種」的可變長度切回固定長度，改問視窗內的字元頻率是否與目標字串完全一致，並把先修課登場過的 matched 計數器當成主角，講清楚它到底維護了什麼量。

## Today's Challenge

- **904** · 題面「兩個籃子各裝一種水果、最多能連續採收幾棵」翻譯過來正是「至多 2 種相異元素的最長子陣列」，是種類數上限型可變視窗的原型題。
  - Hint: 頻率表配 `freq.size > 2` 的收縮迴圈；歸零的鍵要刪，收縮結束時視窗必定合法，再更新最大長度。
