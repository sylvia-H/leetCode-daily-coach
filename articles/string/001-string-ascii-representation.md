---
id: string-ascii-representation
title: String ASCII and Character Codes
module: string
pattern_label: Character Mapping
complexity_label: O(1) / O(1)
estimated_minutes: 10
exit_criteria:
  - >-
    Can convert characters to integer codes and vice versa in both Python and
    TypeScript.
---
## Concept

電腦中的所有字元在底層皆以整數形式儲存，最常見的標準為 ASCII。理解字元與數值之間的雙向轉換是處理字串演算法的基礎，能讓我們直接對字元進行算術運算與陣列索引對映。

## Thinking

當面對字串與字元處理問題時，思考的核心在於如何將抽象的字元具象化為記憶體中的數值。透過取得字元的數值代碼，我們能夠利用固定的偏移量（Offset），例如將小寫字母 'a' 視為基準點 0，將任意小寫字母轉換為 0 到 25 的整數，進而利用陣列實現 O(1) 時間複雜度的頻率統計或狀態檢查。

## Pattern Recognition

Character Mapping 模式通常出現在需要對固定字元集（如小寫英文字母 a-z、大寫英文字母 A-Z、或數字 0-9）進行計數、頻率統計或狀態追蹤的題目中。當你看到題目限制字元範圍僅包含特定集合時，應立即聯想到透過 ASCII 偏移量將字元對映至固定大小的陣列（例如大小為 26 的陣列）。

## Common Mistakes

最常見的錯誤是忽略大小寫的敏感性，將 'a' 與 'A' 視為相同字元，或者在沒有確認字元範圍的情況下盲目使用固定大小的對映陣列，導致超出陣列邊界（Index Out of Bounds）的執行時期錯誤。此外，混淆字元本身的數值與其實際代表的字元也是常見的盲點。

## Complexity

Time Complexity: O(1) per character operation, Space Complexity: O(1) for fixed-size character frequency arrays.

## Digest

本單元聚焦於 String ASCII and Character Codes 的核心觀念，學習如何在程式中透過內建函式進行字元與整數的雙向轉換。掌握 Character Mapping 模式後，我們能夠將字元直接對映至陣列索引，大幅提升演算法效率。

## TypeScript Tip

```typescript
function getLetterOffset(char: string): number {
  const offset = char.charCodeAt(0) - 'a'.charCodeAt(0);
  if (offset < 0 || offset > 25) throw new Error("out of bounds");
  return offset;
}
const result = getLetterOffset('b');
if (result !== 1) throw new Error("assertion failed");
```

## Python Tip

```python
def get_letter_offset(char: str) -> int:
    offset = ord(char) - ord('a')
    assert 0 <= offset <= 25, "out of bounds"
    return offset

result = get_letter_offset('b')
assert result == 1, "assertion failed"
```

## Takeaway

字元即數字。善用 ASCII 偏移量與語言內建轉換函式，能將字串處理轉化為高效的陣列索引操作。

## Tomorrow Preview

明天我們將探討 Two Pointers 技巧在字串反轉與迴文檢查中的應用，進一步延伸字元陣列的操作。

## Today's Challenge

- **387** · 需要統計字串中每個字元的出現頻率，利用大小為 26 的陣列透過 ASCII 偏移量進行直接對映可達到最佳效率。
  - Hint: 建立一個大小為 26 的整數陣列記錄每個小寫字母的出現次數。
- **8** · 解析字串轉換為整數的過程中，必須逐字檢查字元是否為數字，並透過 ASCII 數值減法將字元轉換為實際的十進位數值。
  - Hint: 檢查字元是否介於 '0' 與 '9' 之間，利用 ord(c) - ord('0') 取得數值。
