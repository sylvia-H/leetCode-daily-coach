---
id: string-linear-scan
title: String Linear Scan
module: string
pattern_label: Linear Scan
complexity_label: O(n) / O(1)
estimated_minutes: 10
exit_criteria:
  - >-
    Can write a standard loop over string indices or characters without
    off-by-one errors.
---
## Concept

String Linear Scan 是一種基礎且核心的演算法模式，要求我們以線性順序走訪字串中的每一個字元，藉此萃取特徵、計算頻率、驗證條件或尋找符合特定邏輯的子字串。由於字串本質上是由字元組成的序列，因此絕大多數的字串處理問題都可以透過一次或多次的線性掃描來解決。在時間複雜度方面，通常只需要 $O(n)$ 的代價即可完成掃描，是建構複雜字串演算法的基石。

## Thinking

當面對字串處理問題時，思考的核心在於如何有效地走訪字串並維護狀態。首先，必須初始化適當的累加器（Accumulator）、計數陣列或雜湊表（Hash Map）來記錄掃描過程中的必要資訊。接著，透過迴圈一次走訪字串的全長，並在每個迭代步驟中對當前字元進行條件判斷與狀態更新。最後，在迴圈結束後回傳累積的結果或驗證狀態。

## Pattern Recognition

辨識 String Linear Scan 模式的線索非常明確。當題目要求我們驗證、計算、搜尋、或比對字串內的字元時，通常就會採用此模式。例如，檢查字串是否符合特定格式、統計各字元的出現次數、或者在字串中尋找不重複的最長子字串。只要問題涉及逐字檢查字元序列，且沒有更複雜的動態規劃或圖論結構需求，多數情況下皆可直接套用線性掃描。

## Common Mistakes

最常見的錯誤之一是嘗試在原地修改字串（In-place Modification）。在許多程式語言（如 Python 與 JavaScript/TypeScript）中，字串是不可變的（Immutable）物件，直接對字串索引指定新值會導致編譯錯誤或執行期異常。此外，常見的疏失還包括迴圈邊界控制不當導致的索引超界（Off-by-one Error），以及忽略字元大小寫或特殊字元（如 Unicode 字符）所造成的判斷失誤。

## Complexity

時間複雜度：O(n)，其中 n 為字串的長度，因為我們需要走訪整個字串。空間複雜度：O(1) 或 O(u)，其中 u 為字元集的大小，若使用固定大小的陣列或雜湊表記錄頻率，空間複雜度通常可視為常數。

## Digest

String Linear Scan 是處理字串問題的基礎。本章節探討了如何透過序列式走訪來萃取特徵、累加狀態以及避免常見的不可變物件修改錯誤。掌握此模式有助於解決多數的基礎字串驗證與統計問題。

## TypeScript Tip

```typescript
function verifyString(s: string): boolean {
  let isValid = true;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "") {
      isValid = false;
    }
  }
  if (!isValid) throw new Error("assertion failed");
  return isValid;
}
verifyString("test");
```

## Python Tip

```python
def verify_string(s: str) -> bool:
    is_valid = True
    for i, char in enumerate(s):
        if not char:
            is_valid = False
    assert is_valid == True, "assertion failed"
    return is_valid

verify_string("test")
```

## Takeaway

線性掃描字串是演算法的基石，務必掌握索引迴圈與 for...of 的正確使用方式，避免字串不可變帶來的陷阱。

## Tomorrow Preview

明天我們將探討雙指標（Two Pointers）模式，學習如何利用兩個指標在陣列或字串中以不同方向或速率移動，進一步解決複雜的區間搜尋與最佳化問題。

## Today's Challenge

- **387** · 需要完整掃描字串以統計每個字元的出現頻率，並藉此找出第一個不重複的字元。
  - Hint: 使用雜湊表或固定大小的陣列先記錄所有字元的出現次數，再進行第二次掃描。
- **242** · 需分別對兩個字串進行線性掃描，並比對其字元頻率是否完全一致。
  - Hint: 可以使用一個計數陣列，在掃描第一個字串時遞增，掃描第二個字串時遞減。
- **3** · 透過線性掃描與滑動視窗搭配，紀錄字元最後出現的位置，尋找不含有重複字元的最長子字串。
  - Hint: 利用雜湊表儲存字元最近一次出現的索引，當遇到重複字元時更新左指標的位置。
