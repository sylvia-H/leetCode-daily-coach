---
id: edge-case-enumeration
title: Edge Case Enumeration
module: programming-mindset
pattern_label: Defensive Design
complexity_label: O(1) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能條列出空值、極大值、重複值與單一元素等邊界測資
---
## Concept

Edge Case Enumeration（邊界條件列舉）是在寫完主邏輯之後、提交之前，主動且系統性地列舉極端輸入並驗證程式行為的防禦性設計（Defensive Design）思維。軟體中絕大多數的 Bug 不在主流程，而是藏在正常邏輯之外的角落：空集合、零、負數、極大值、重複元素、單一元素。原因很直接——寫主邏輯時，你腦中預設的是「典型輸入」，這些角落根本沒進入視野；事後憑直覺回想又極易遺漏，所以需要一份固定的檢查清單來取代直覺。上一課用長度 1、2 的極小案例找規律、建解法；本課把同一批極小輸入換一個目的：不是為了發現規律，而是為了驗證已經寫好的主邏輯在這些角落依然給出正確答案、不會崩潰。

## Thinking

寫完 Happy Path 後，思維必須立刻從「如何達成功能」切換成「這段程式碼在什麼輸入下會出錯」。依固定順序過一遍清單：第一，空值與無效輸入——null、undefined、空陣列、空字串，程式是崩潰、回傳錯誤值，還是正確處理？第二，數量極端——零個元素、單一元素、超大輸入；單一元素特別容易讓左右指標一開始就重合，主邏輯一次都不執行。第三，數值極端——零、負數、型別上限；加法與乘法在極大值附近可能溢位，零作為除數會直接拋出例外。第四，重複元素——全部相同的輸入常讓「元素嚴格遞增」之類的隱含假設失效。每列出一種，先寫下預期輸出，再實際執行比對——沒有預期值的測試只能發現崩潰，發現不了「不崩潰但答錯」。

## Pattern Recognition

兩個明確訊號。其一：程式通過基本測試後，特殊測資一進來就出現越界存取（Index Out of Bounds）、型別錯誤（TypeError）或無窮迴圈——代表主邏輯隱含了「輸入不空、元素相異、數值不大」這類從未驗證的假設。其二：你發現自己說出「輸入應該不會是空的吧」這種句子——「應該不會」正是需要列舉驗證的訊號。解題時，題目的 Constraints 區塊就是邊界清單的直接來源：長度下限是 0 還是 1、數值範圍是否含負數，每一行都對應一筆該寫的測資。

## Common Mistakes

第一，只驗證 Happy Path：正常測資只覆蓋主流程，沒走過的分支永遠不會暴露問題。第二，過度自信：假設輸入總是符合規格，省略防禦性檢查，遇到非預期的型別或結構就直接拋出執行期例外。第三，語言特性的暗坑：Python 用 `if not x` 擋空值時，0 與空字串同樣是 False，可能把合法輸入誤判成缺值；JavaScript 對越界索引不報錯而是回傳 undefined，錯誤延遲到後續運算才爆發，讓你找錯方向。第四，列了測資卻沒寫預期輸出：只確認「沒崩潰」，就會漏掉「答案錯了」的情況。

## Complexity

O(1) / O(1)。邊界列舉本身是設計期的檢查活動，不改變演算法的漸進複雜度；為邊界補上的防禦性判斷通常只是常數個條件分支，成本可以忽略。

## Digest

Bug 藏在正常邏輯之外的角落。寫完主邏輯後，依固定清單列舉：空值與無效輸入、數量極端（零個、單一元素、超大輸入）、數值極端（零、負數、型別上限）、重複元素；每筆測資先寫下預期輸出再執行比對。用清單取代直覺，用「什麼輸入會讓它出錯」取代「功能完成了」。例如單一元素常讓左右指標一開始就重合，主邏輯可能一次都不執行。

## TypeScript Tip

用 optional chaining 與 nullish coalescing 把「可能缺值」在入口就處理掉，而不是讓 undefined 流進運算：

```typescript
function average(nums: number[] | null): number | null {
  if (!nums || nums.length === 0) return null; // 空輸入回傳可辨識的訊號，而非假裝平均是 0
  return nums.reduce((acc, v) => acc + v, 0) / nums.length;
}
function readLimit(conf: { limit?: number } | null): number {
  return conf?.limit ?? 10; // 缺物件或缺欄位都安全地落到預設值
}
if (average(null) !== null) throw new Error("assertion failed");
if (average([]) !== null) throw new Error("assertion failed");
if (average([4, 8]) !== 6) throw new Error("assertion failed");
if (readLimit(null) !== 10) throw new Error("assertion failed");
if (readLimit({ limit: 5 }) !== 5) throw new Error("assertion failed");
```

越界索引在 JavaScript 只回傳 undefined 而不報錯，`??` 是把錯誤攔在源頭的第一道防線。

## Python Tip

None、空字串與空集合的布林求值都是 False，`if not x` 一行能同時擋住多種空值，但要留意 0 也是 False：

```python
def first_or_default(items: list[str] | None, default: str) -> str:
    if not items:  # None 與空 list 都會走進這個分支
        return default
    return items[0]

assert first_or_default(None, "-") == "-"
assert first_or_default([], "-") == "-"
assert first_or_default(["a", "b"], "-") == "a"

def is_missing(value: int | None) -> bool:
    return value is None  # 0 是合法值，判斷缺值必須用 is None

assert is_missing(0) is False
assert is_missing(None) is True
```

## Takeaway

寫完主邏輯不算完成：用固定清單列舉空值、極端數量、極端數值與重複元素，先寫預期輸出再驗證。

## Tomorrow Preview

明天有兩條路線：Space-Time Tradeoff Awareness 探討用空間換時間的權衡直覺，學會評估何時值得多花記憶體換取速度；另一條進入 Array 的 Sliding Window Variable Size，練習可變長度視窗的區間操作。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透，並替你最近寫的一段程式列出至少五筆邊界測資與預期輸出。
