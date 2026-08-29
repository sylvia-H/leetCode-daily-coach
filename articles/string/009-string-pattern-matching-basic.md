---
id: string-pattern-matching-basic
title: Basic Substring Search
module: string
pattern_label: Linear Scan
complexity_label: O(n * m) / O(1)
estimated_minutes: 15
exit_criteria:
  - Can implement indexOf or find a needle in a haystack using nested loops.
---
## Concept

Basic Substring Search 代表最基礎的字串匹配演算法。給定一個長度為 n 的主字串 haystack 與長度為 m 的目標子字串 needle，目標是在 haystack 中找出 needle 首次出現的起始索引位置。核心觀念是透過線性掃描的方式，檢查 haystack 中的每一個可能的起始位置，逐一比對後續的字元是否與 needle 完全吻合。

## Thinking

思考尋找子字串的過程時，可以採取暴力匹配的思維。我們需要一個外層迴圈遍歷 haystack 的每一個可能起始索引 i，其範圍通常只須到 n - m 為止，因為剩餘長度若小於 needle 的長度則不可能完全匹配。接著使用一個內層迴圈從 0 到 m - 1 逐一檢查 needle 的每個字元是否對應相符。如果在比對過程中發現任一字元不符，則終止內層迴圈並將外層索引推進一個位置。若內層迴圈完整執行完畢而沒有中斷，即代表找到完全匹配的子字串，可直接返回當前的起始索引。

## Pattern Recognition

當題目要求尋找某個子字串在較長字串中首次出現的位置、確認子字串是否存在、或是進行字串的包含性檢查時，即為典型的 Linear Scan 字串匹配 Pattern。這種 Pattern 的特徵在於不需要複雜的前置處理，適合直接進行暴力比對或配合簡單的字串重複邏輯來求解。

## Common Mistakes

最常見的錯誤是在計算外層迴圈的終止條件時發生邊界溢位。若迴圈允許一路掃描到 haystack 的最後一個字元，當剩餘字元長度不足以容納整個 needle 時，內層迴圈讀取字元將會超出邊界或引發錯誤。另一個常見錯誤是當內層比對失敗時，未能正確將外層索引重置或推進到正確的下一個起始位置，導致無限迴圈或漏掉可能的匹配組合。

## Complexity

時間複雜度為 O(n * m)，其中 n 為 haystack 的長度，m 為 needle 的長度。在最壞的情況下，每一個起始位置都需要比對 m 個字元。空間複雜度為 O(1)，因為只需要常數額外空間來儲存迴圈索引變數。

## Digest

Basic Substring Search 是字串處理的基石。本單元探討如何透過 Linear Scan 演算法在主字串中尋找子字串，掌握外層迴圈控制起始位置、內層迴圈比對字元的核心邏輯，並注意迴圈邊界與效能邊界。

## TypeScript Tip

```typescript
function tsSubstringSearchTip(haystack: string, needle: string): number {
  const idx = haystack.indexOf(needle);
  if (idx !== -1) {
    return idx;
  }
  return -1;
}
const pos = tsSubstringSearchTip("hello", "ll");
if (pos !== 2) throw new Error("assertion failed");
```

## Python Tip

```python
def py_substring_search_tip(haystack: str, needle: str) -> int:
    pos = haystack.find(needle)
    return pos

result = py_substring_search_tip("hello", "ll")
assert result == 2, "assertion failed"
```

## Takeaway

掌握 Linear Scan 與雙迴圈邊界控制，是解決基礎字串搜尋問題的核心關鍵。

## Tomorrow Preview

明天的課程將進階探討更高效的字串匹配演算法，透過預處理模式字串來避免重複比對，大幅提升字串搜尋的效能。

## Today's Challenge

- **28** · 本題要求找出字串中第一個匹配子字串的索引，直接對應到 Basic Substring Search 與 Linear Scan 的核心定義。
  - Hint: 注意外層迴圈的終止條件應為 n - m，避免超出字串長度。
- **686** · 本題需要透過重複字串來檢查是否包含目標子字串，考驗基礎的字串拼接與線性掃描匹配邏輯。
  - Hint: 思考需要將字串重複幾次，才能確保涵蓋所有可能的匹配起始位置。
