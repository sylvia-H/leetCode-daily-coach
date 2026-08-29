---
id: binary-search-overflow-prevention
title: Binary Search Overflow Prevention
module: binary-search
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能改用 mid = left + Math.floor((right - left) / 2)，而非 (left + right) / 2。
---
## Concept

上一課的閉區間模板裡有一行不起眼的 `mid = left + Math.floor((right - left) / 2)`，今天說清楚它防的是什麼。溢位（overflow）：固定寬度整數只能表示有限範圍，32 位元有號整數的上限是 2^31 - 1、約 21 億；超過上限的運算不會報錯，而是繞回（wrap around）成負數。`(left + right) / 2` 的危險就在中間那一步：left 與 right 各自都是合法值，但相加的**中間結果**可能先衝破上限——兩者都在 15 億附近時，和是 30 億、早已越線，除以 2 得到的是負數 mid。改寫成 `left + (right - left) / 2` 後，中間結果只剩 `right - left`，它永遠不超過區間長度，離上限遠得很。兩者數學等價：`left + (right - left) / 2` 展開就是 `(left + right) / 2`，而 left 是整數，向下取整先做後做結果相同——改寫不改變 mid 落在哪一格。

## Thinking

寫 JavaScript 和 Python 的人要不要在意？誠實分層。Python 的整數是任意精度，永遠不會溢位；JavaScript 的 number 是 64 位元浮點數，整數精確到 2^53，而陣列索引撐死不到 2^32，`left + right` 頂多 2^33，一般寫法配 `Math.floor` 不會出事。真正會踩雷的是三種場景。一，固定寬度整數的語言：Java、C++ 的 int 是 32 位元——JDK 標準庫的二分搜尋就帶著 `(low + high) / 2` 這顆雷活了約九年，2006 年才修正，而那段程式碼出自《Effective Java》作者之手。連標準庫都會踩，說明這不是粗心，是預設寫法本身埋著雷。二，JavaScript 的位元運算：有人用 `(left + right) >> 1` 代替除二取整，但位元運算會先把運算元截成 32 位元有號整數——和一超過 2^31 - 1，`>> 1` 直接算出負數。三，二分的對象不是索引而是值域：猜數字這類題的範圍上限就是 2^31 - 1 本身，left 與 right 是「值」不是索引，相加必然越線。結論：把安全公式練成肌肉記憶，成本是每輪多一次減法，換到的是換語言、換場景都不會炸。

## Pattern Recognition

需要提高警覺的訊號：題目約束標到 10^9 或 2^31 - 1 這個量級；二分的對象是值域而非索引；或你正在寫固定寬度整數的語言。另外兩件事值得記住：這條公式與區間慣例無關——它只改「mid 怎麼算」，不改「mid 是哪一格」，閉區間、半開區間都照用；而且向下取整讓 mid 天然偏左，left < right 時 mid 必定小於 right——這個性質下一課會成為半開區間 `right = mid` 不會死迴圈的關鍵。

## Common Mistakes

一、在 int32 語言寫 `(left + right) / 2`：left 與 right 都在 15 億時，和約 30 億、繞回約負 12.9 億，除以 2 得到負索引，下一步存取直接出錯——而且小測資完全正常，大資料上線才爆。二、在 JavaScript 順手寫 `(left + right) >> 1`：平常沒事，和超過 2^31 - 1 的瞬間翻負；要用位元運算，前提是確定和不會越線。三、矯枉過正：反過來宣稱 Python、JavaScript 的 `(left + right) // 2` 是錯的——在索引二分的範圍內它數學上完全正確，採安全公式是為了可攜性與值域二分，不是因為原式在這兩個語言裡會炸。四、改寫公式時把取整弄丟：JavaScript 的 `/` 是浮點除法，`left + (right - left) / 2` 少了 `Math.floor` 一樣算出帶小數的 mid（第一課就提醒過的老問題），防了溢位卻引進新蟲。

## Complexity

安全公式不改變演算法本身：時間仍是 O(log n)、空間 O(1)，多付的是每輪一次減法，常數中的常數。真正的差別在正確性的適用範圍：原式只在「和不越線」時正確，安全式對任何合法的 left、right 都正確。

## Digest

公式：`mid = left + (right - left) / 2`（TypeScript 加 `Math.floor`，Python 用 `//`）。等價推導一行：展開即 `(left + right) / 2`；差別在中間結果——原式先算和，可能衝破 int32 上限 2^31 - 1（約 21 億）繞成負數；安全式先算差，永遠不超過區間長度。錨點：JDK 的二分搜尋帶著這顆雷活了約九年（2006 年修正）；JavaScript 的陷阱是 `(left + right) >> 1`，位元運算先截 32 位元；猜數字類值域二分的上限就是 2^31 - 1，left + right 必越線。公式與慣例無關，閉區間、半開區間通吃。

## TypeScript Tip

JavaScript 的加法在索引範圍內不會溢位，但位元運算會先把運算元截成 32 位元——`>> 1` 是最常見的翻車點。

```typescript
import assert from "node:assert";

const left = 1_600_000_000;
const right = 2_100_000_000;
// 和為 37 億，超過 2^31 - 1：位元運算先截 32 位元，>> 1 得到負數
assert.ok(((left + right) >> 1) < 0);
// 安全公式：中間結果 right - left 只有 5 億，離上限遠得很
const mid = left + Math.floor((right - left) / 2);
assert.strictEqual(mid, 1_850_000_000);
// 浮點除法不截 32 位元，可驗證兩式數學等價
assert.strictEqual(mid, Math.floor((left + right) / 2));
```

## Python Tip

Python 整數任意精度、不會溢位，`(left + right) // 2` 不會錯；沿用安全公式是為了可攜。值域二分示範：在 1 到 2^31 - 1 之間猜數字，31 步內必中。

```python
def guess_search(n: int, pick: int) -> tuple[int, int]:
    left, right, steps = 1, n, 0
    while left <= right:
        steps += 1
        mid = left + (right - left) // 2
        if mid == pick:
            return mid, steps
        if mid < pick:
            left = mid + 1
        else:
            right = mid - 1
    return -1, steps

n = 2**31 - 1
for pick in (1, n, 1_702_766_719):
    found, steps = guess_search(n, pick)
    assert found == pick and steps <= 31
```

## Takeaway

mid = left + (right - left) / 2：中間結果不超過區間長度；等價、可攜，閉區間半開區間通吃。

## Tomorrow Preview

明天學第二套區間慣例：半開區間 `[left, right)`——right 初始化為 n、`while (left < right)`、`right = mid`。它與閉區間解同樣的問題，但在找「位置」而非「有沒有」時格外順手。

## Today's Challenge

- **374** · 值域二分的原型：範圍上限可達 2^31 - 1，left + right 在 int32 必越線，安全公式的主場。
  - Hint: 對 1..n 的值域二分，依 API 回報的高低決定收縮方向；mid 全程用安全公式。
- **33** · 旋轉陣列的分支判斷已經夠燒腦，mid 的寫法必須零成本正確——在複雜邏輯裡把安全公式練成反射。
  - Hint: 比較 nums[mid] 與 nums[left] 判斷哪半邊有序；target 落在有序半邊的範圍內就進去，否則走另一半。
