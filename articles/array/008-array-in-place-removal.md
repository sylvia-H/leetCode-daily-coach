---
id: array-in-place-removal
title: In-Place Element Removal with Fast-Slow Pointers
module: array
pattern_label: Fast-Slow Pointers
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能區分快指標（尋找有效元素）與慢指標（寫入位置）的職責
  - 能在不使用額外記憶體下完成陣列壓縮
---
## Concept

In-Place Element Removal with Fast-Slow Pointers（快慢指標原地移除）解決的是「在原陣列空間內移除特定元素、空間複雜度必須是 O(1)」的問題。單一指標之所以辦不到，是因為「讀到哪裡」與「寫到哪裡」是兩個獨立前進的位置——每跳過一個要移除的元素，兩者的距離就拉開一格。快慢指標正是把這兩個職責拆開：**fast 負責讀**，逐格掃描整個陣列尋找要保留的元素；**slow 負責寫**，永遠指向下一個有效元素該存放的位置。fast 遇到有效元素就把它寫到 `nums[slow]` 並讓 slow 前進一格；遇到要移除的元素則只有 fast 前進。掃描結束時，陣列前段 `[0, slow - 1]` 恰好塞滿所有保留元素，slow 本身就是新的有效長度。

## Thinking

先看暴力解為何不行：每移除一個元素就把後方所有元素往前搬一格，最壞情況是 O(n^2)。快慢指標改為「一次掃描、就地覆寫」，其正確性由一條迴圈不變式保證：**任何時刻，`nums[0..slow-1]` 恰好是已掃描區段中所有應保留的元素，且維持原本的相對順序**。初始時 slow = 0、區間為空，不變式成立；每當 fast 找到保留元素並寫入 `nums[slow]`，不變式隨 slow++ 延續。另一個關鍵是安全性——覆寫會不會蓋掉還沒讀的資料？不會，因為 slow 只在 fast 完成一次讀取後才可能前進一格，所以恆有 `slow <= fast`：寫入的位置要麼是 fast 剛讀完的格子、要麼在它左邊，未讀區域永遠不受影響。掃描完畢後回傳 slow，即為壓縮後的有效長度。

## Pattern Recognition

三個線索指向這個 Pattern：一、題目明確要求 in-place 修改、空間限制 O(1)，不允許開新陣列存結果；二、本質是「依條件篩選並保留元素」——移除指定值、去掉多餘重複、把不合格元素擠出去；三、有效長度之後的尾端內容允許是任意值，代表可以放心覆寫。此外，若題目要求保留元素的相對順序不變，快慢指標天然滿足（fast 由左往右依序搬運）；反之若順序可犧牲，還有「與尾端元素交換」的對向變體可將寫入次數壓到更低。

## Common Mistakes

第一類錯誤是指標職責混淆：在不該推進 slow 時遞增它（例如 fast 遇到要移除的元素時也 slow++），會讓垃圾值混進有效區；或把判斷條件寫反，變成保留了要移除的值。第二類是依賴語言內建的刪除方法，如 `splice` 或 `list.pop(i)`——它們每次呼叫都觸發底層整段搬移，迴圈中使用會讓複雜度退化回 O(n^2)，而且一邊走訪一邊刪除還容易跳過相鄰元素。第三類是回傳值誤解：應回傳 slow（有效長度），而非陣列本身或被移除的個數；也不必去清空 slow 之後的殘留值，題目約定那段內容不被檢查。

## Complexity

時間複雜度為 O(n)：fast 對陣列恰好做一次線性掃描，每個元素至多被讀一次、寫一次。空間複雜度為 O(1)：全程只用兩個指標變數，沒有任何隨輸入規模成長的額外配置。

## Digest

快慢指標把「讀」與「寫」拆成兩個獨立位置：fast 掃描找保留元素，slow 指向下一個寫入位置，遇到有效元素就 `nums[slow] = nums[fast]` 並 slow++。正確性由不變式「nums[0..slow-1] 恰為已掃描區段的保留元素、順序不變」保證；安全性由 `slow <= fast` 保證——寫入永不觸及未讀區域。一次掃描完成壓縮，slow 即新長度，O(n) 時間、O(1) 空間。切忌在迴圈中用 splice 這類會整段搬移的刪除方法。

## TypeScript Tip

以「移除指定值 val」示範：注意 `nums[fast] !== val` 的比較可直接用可能為 `undefined` 的索引值，但寫入時要用 `!` 收斂型別（`noUncheckedIndexedAccess`）。

```typescript
import assert from "node:assert";
function removeElement(nums: number[], val: number): number {
  let slow = 0;
  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== val) {
      nums[slow] = nums[fast]!;
      slow++;
    }
  }
  return slow;
}
const nums = [0, 1, 2, 2, 3, 0, 4, 2];
const len = removeElement(nums, 2);
assert.strictEqual(len, 5);
assert.deepStrictEqual(nums.slice(0, len), [0, 1, 3, 0, 4]);
```

## Python Tip

Python 的 list 是傳參考：函式內的原地修改，呼叫端看得到。切片 `nums[:length]` 可用來驗證有效區內容。

```python
def remove_element(nums: list[int], val: int) -> int:
    slow = 0
    for fast in range(len(nums)):
        if nums[fast] != val:
            nums[slow] = nums[fast]
            slow += 1
    return slow

nums = [0, 1, 2, 2, 3, 0, 4, 2]
length = remove_element(nums, 2)
assert length == 5
assert nums[:length] == [0, 1, 3, 0, 4]
```

## Takeaway

快慢指標把讀寫位置拆開：fast 掃描、slow 寫入，恆有 slow <= fast，一次掃描即以 O(1) 空間原地壓縮陣列。

## Tomorrow Preview

明天用同一套快慢指標處理「已排序陣列的原地去重」：架構完全不變，只是判斷條件從「不等於指定的 val」換成「與已保留的前一個元素比較」，體會同一 Pattern 換條件就能解新題的威力。

## Today's Challenge

- **27** · 原地移除指定值並回傳新長度，是快慢指標的標準入門題：fast 掃描、slow 寫入的分工在此題最純粹地呈現。
  - Hint: fast 遇到不等於 val 的元素就寫到 nums[slow] 並讓 slow 前進，最後回傳 slow。
- **80** · 允許每個值最多重複兩次的原地壓縮：判斷條件從「等於 val」升級為「與有效區倒數第二個元素比較」，示範同一架構的條件變形。
  - Hint: 當 nums[fast] 不等於 nums[slow - 2] 時才寫入，前兩個元素一律直接保留。
