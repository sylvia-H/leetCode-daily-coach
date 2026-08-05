---
id: string-two-pointers-opposite
title: 'String Two Pointers: Opposite Direction'
module: string
pattern_label: Two Pointers
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - Can implement palindrome checks efficiently using two pointers.
---
## Concept

String Two Pointers: Opposite Direction 是一種透過兩個指標分別從字串的兩端（起點與終點）向中間移動，藉此處理對稱性質或進行區段操作的核心演算法技巧。這種方法能夠避免建立額外的暫存字串或使用高額的額外記憶體空間，特別適用於回文檢查、字元反轉以及特定條件的字串解析問題。

## Thinking

在思考這類問題時，首要任務是建立左右兩個指標：左指標通常初始化為 0，指向字串的最左端；右指標則初始化為 n - 1，指向字串的最右端。接著使用迴圈讓兩者逐漸向中心靠攏。在每一次迭代中，我們根據題目的驗證條件來比較或處理左右指標所指向的字元，並在適當時機將指標向內遞增或遞減。

## Pattern Recognition

當題目涉及「回文 (Palindrome)」、「對稱性檢查 (Symmetric String)」、「字串反轉 (String Reversal)」或「從兩端向內縮減的條件判斷」時，即可高度懷疑適用 String Two Pointers: Opposite Direction Pattern。此外，當我們需要原地修改字串或在線性時間內找出特定對稱區間時，這也是標準的解題模型。

## Common Mistakes

最常見的錯誤包含未能正確處理指標交錯的終止條件，導致迴圈變成無限迴圈或發生陣列索引超出邊界的錯誤 (Index Out of Bounds)。另一個常見問題是在略過空白字元或標點符號時，忘記在內層迴圈加上 left < right 的防護檢查，導致左指標與右指標交錯後仍繼續移動。

## Complexity

Time Complexity: O(n)，其中 n 為字串長度，因為每個字元最多被左右指標訪問一次。Space Complexity: O(1)，只需要常數級別的指標變數來儲存狀態，不需要額外的大型資料結構。

## Digest

本次課程深入探討了 String Two Pointers: Opposite Direction 的核心運作機制。透過雙指標由外向內交會的特性，我們能夠以 O(n) 的時間複雜度與 O(1) 的空間複雜度解決諸如回文驗證與字串處理等經典問題。課程中透過詳細的思維步驟、常見錯誤分析以及 TypeScript 與 Python 的實作示範，協助開發者掌握對稱字串處理的精髓。

## TypeScript Tip

在 TypeScript 中實作時，務必注意字串的不可變性（Immutability），若需要修改字元通常需轉換為陣列處理。迴圈條件建議使用 while (left < right) 並妥善處理型別與邊界。
```typescript
function cleanAndCheck(s: string): boolean {
  const filtered = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let left = 0;
  let right = filtered.length - 1;
  while (left < right) {
    if (filtered[left] !== filtered[right]) {
      return false;
    }
    left++;
    right--;
  }
  return true;
}
const res = cleanAndCheck("A man, a plan, a canal: Panama");
if (!res) throw new Error("assertion failed");
```

## Python Tip

在 Python 中，處理字串時常利用字串切片或內建方法結合雙指標。當我們需要手動控制指標向內移動並略過非文數字時，需確保內層迴圈不會超越邊界。
```python
def reverse_words(s: str) -> str:
    words = s.strip().split()
    left, right = 0, len(words) - 1
    while left < right:
        words[left], words[right] = words[right], words[left]
        left += 1
        right -= 1
    return ' '.join(words)

res = reverse_words("the sky is blue")
assert res == 'blue is sky the', 'assertion failed'
```

## TypeScript Corner

```typescript
function isPalindrome(s: string): boolean {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) {
      return false;
    }
    left++;
    right--;
  }
  return true;
}
const res = isPalindrome("radar");
if (!res) throw new Error("assertion failed");
```

## Python Corner

```python
def is_palindrome(s: str) -> bool:
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True

res = is_palindrome("radar")
assert res is True, "assertion failed"
```

## Takeaway

運用左右雙指標向內靠攏，以 O(n) 時間與 O(1) 空間高效解決對稱字串與區段處理問題。

## Tomorrow Preview

明天我們將探討 String Two Pointers 的另一種衍生模式：Same Direction（同向雙指標），這在處理字串壓縮、移除重複元素或滑動視窗（Sliding Window）問題時非常強大。

## Today's Challenge

- **125** · 驗證回文需要比較字串對稱位置的字元，利用左右雙指標向內移動可完美達成。
  - Hint: 注意先過濾或忽略非字母與數字的字元，並將英文字母轉為統一的大小寫再進行比較。
- **151** · 處理字串中的單字反轉與空白過濾時，可利用雙指標從兩端向內或進行區段處理。
  - Hint: 可以先將字串以空白分割成單字列表，再利用對向雙指標進行單字順序的反轉。
