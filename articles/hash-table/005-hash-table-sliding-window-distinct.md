---
id: hash-table-sliding-window-distinct
title: Sliding Window with Hash Set for Distinct Elements
module: hash-table
pattern_label: Sliding Window Set
complexity_label: O(n) / O(k)
estimated_minutes: 15
exit_criteria:
  - Can expand window and add to set
  - Can shrink window from the left and remove from set when duplicates occur
---
## Concept

這個 Pattern 把兩樣你已熟悉的工具接在一起：滑動視窗用左右指標界定「目前考慮的連續區間」，Hash Set 以平均 O(1) 回答「這個元素在視窗裡嗎」。核心是一條不變式：Set 的內容恆等於視窗 [left, right] 內的元素集合，且視窗內沒有重複。右指標擴張時把新元素加入 Set，左指標收縮時把離開視窗的元素移除——兩邊只要有一步沒同步，Set 就不再代表視窗，後續所有判斷都會失真。

## Thinking

正確的流程是「先查、再縮、後加」。對每個 right：先查 s[right] 在不在 Set。在——代表視窗內有一個舊的同值元素，進入 while 迴圈：把 s[left] 移出 Set、left 加一，反覆執行直到 s[right] 不再存在於 Set，才把它加入。為什麼刪到衝突解除就能停？因為視窗原本無重複，同值的舊元素恰有一個，把它（連同它左側的元素）移出即可；左側元素被丟棄並不可惜——包含重複的區間不可能是答案，而以它們開頭的更短合法區間早在先前的迭代被算過。又因為 left 每次只前進到「剛好合法」為止，每輪結束時的 [left, right] 正是以 right 結尾的最長無重複區間，對所有 right 取最大值就涵蓋了全部候選答案。O(n) 的理由是攤銷：left 與 right 都單調前進，每個元素至多被加入一次、移除一次，總步數與 n 成正比。

## Pattern Recognition

辨識線索是「連續區間＋唯一性」：最長不重複子字串、固定範圍內是否有相同元素。動態視窗由「出現重複」觸發收縮，收縮量不定；固定視窗則在長度超過 k 時從左端刪除一個，兩端等速推進。兩者都靠 Set 提供 O(1) 成員查詢。若條件從「不重複」放寬成「每個元素至多出現 f 次」，二元的存在性就不夠，需要升級成記錄次數的 Hash Map。

## Common Mistakes

頭號錯誤：left 右移了卻忘記 set.delete()。Set 是獨立結構，不會因為指標變數加一就自動剔除元素，殘留的過期元素會讓之後的重複判斷誤報。第二個是順序錯誤：先 add 再查——Set 對重複的 add 靜默忽略，加入後查 has 永遠為真，重複根本測不出來，必須先查後加。第三個是收縮只做一步：重複的舊元素不一定貼著左端，用 if 只刪一次會留下仍含重複的非法視窗，必須用 while 刪到衝突解除為止。

## Complexity

時間複雜度 O(n)：left 與 right 各自最多前進 n 步，每個元素至多被加入與移除 Set 各一次，攤銷後每步 O(1)。空間複雜度 O(k)：Set 最多存視窗大小（或字元集大小）個元素。

## Digest

本篇把滑動視窗與 Hash Set 接在一起：視窗界定目前考慮的連續區間，Set 以 O(1) 回答「這個元素在視窗裡嗎」，全程維持不變式「Set＝視窗內容、視窗內無重複」。流程是「先查、再縮、後加」：右擴前先查 Set，命中就用 while 反覆刪除左端元素並右移 left，直到衝突解除才加入新元素。因為 left 每次只前進到剛好合法，每輪的視窗就是以 right 結尾的最長無重複區間，對所有 right 取最大值即為答案。兩個指標都單調前進，每個元素至多加入與移除各一次，整體 O(n)。最容易踩的坑：left 右移了，卻忘了同步執行 set.delete()。

## TypeScript Tip

固定視窗版本：先查後加，Set 大小超過 k 就刪除 nums[i - k]，恆存最近 k 個元素。嚴格索引設定下以 `!` 把 `number | undefined` 收斂成 `number`。

```typescript
function containsNearbyDuplicate(nums: number[], k: number): boolean {
  const window = new Set<number>();
  for (let i = 0; i < nums.length; i++) {
    const num = nums[i]!;
    if (window.has(num)) return true;
    window.add(num);
    if (window.size > k) window.delete(nums[i - k]!);
  }
  return false;
}
if (!containsNearbyDuplicate([1, 2, 3, 1], 3)) throw new Error("assertion failed");
if (containsNearbyDuplicate([1, 2, 3, 1], 2)) throw new Error("assertion failed");
```

## Python Tip

動態視窗版本：while 迴圈把造成衝突的舊字元刪到消失；每輪結束時的視窗就是以 right 結尾的最長合法區間。

```python
def longest_unique_substring(s: str) -> int:
    seen: set[str] = set()
    left = 0
    best = 0
    for right, ch in enumerate(s):
        while ch in seen:
            seen.remove(s[left])
            left += 1
        seen.add(ch)
        best = max(best, right - left + 1)
    return best

assert longest_unique_substring("abcabcbb") == 3
assert longest_unique_substring("bbbbb") == 1
assert longest_unique_substring("") == 0
```

## Takeaway

視窗動、Set 跟著動：右擴前先查、衝突時用 while 刪到解除，Set 恆等於視窗內容才有正確答案。

## Tomorrow Preview

明天進入 Sliding Window with Frequency：當條件從「不重複」放寬成「次數受限」，Set 的二元存在性不敷使用，改用 Hash Map 統計視窗內每個元素的出現次數。

## Today's Challenge

- **3** · 動態視窗的原型題：用 Set 維護以 right 結尾的最長無重複子字串，對所有 right 取最大值。
  - Hint: 新字元已在 Set 時，反覆刪除 s[left] 並右移 left 直到衝突解除，再加入新字元並更新答案。
- **219** · 固定視窗版本：距離限制讓 Set 只保留最近 k 個元素，查到重複即符合索引距離條件。
  - Hint: 每步先查再加；Set 大小超過 k 就刪除 nums[i - k]，維持「在 Set 裡」等價於「距離不超過 k」。
