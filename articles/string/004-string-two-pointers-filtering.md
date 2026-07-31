---
id: string-two-pointers-filtering
title: String Two Pointers with Preprocessing
module: string
pattern_label: Two Pointers
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - >-
    Can skip unwanted characters on-the-fly without allocating extra memory for
    filtered strings.
---
## Concept

String Two Pointers with Preprocessing 是一種在處理字串時，透過雙指標進行比對同時在執行期（on-the-fly）略過無效字元（例如非英數字元或標點符號）的技術。傳統做法常需要額外配置記憶體來建立過濾後的字串，但透過 Two Pointers 配合指標推進機制，我們可以在 O(1) 的額外空間複雜度內直接原地比對。核心觀念在於當左右指標遇到需要忽略的字元時，指標會持續推進直到指向有效字元為止，然後再進行字元等價性驗證。

## Thinking

在處理這類字串問題時，直覺的做法是先將字串進行清洗，移除所有不需要的字元，產生一個全新的乾淨字串，接著再用標準的 Two Pointers 檢查是否符合條件。然而，這種做法會產生 O(n) 的額外空間來儲存過濾後的字串。為了達到 O(1) 空間複雜度，我們必須在雙指標迭代的過程中動態檢查並略過字元。這意味著在主迴圈內部需要嵌入控制指標移動的內層迴圈。此時必須特別注意邊界條件，確保左指標小於右指標，否則內層迴圈可能會讓指標越界。

## Pattern Recognition

當題目要求驗證回文（Palindromic）且字串中包含空格、大小寫混合或特殊標點符號時，或是當題目允許在驗證過程中略過至多一個字元不匹配的情況時，這就是經典的 String Two Pointers with Preprocessing Pattern。辨識線索包括：1. 只需要回傳布林值或進行基本字串夾擠驗證；2. 題目明確指出忽略大小寫、標點符號或允許單一字元刪除；3. 要求空間複雜度為 O(1)。

## Common Mistakes

最常見的錯誤是在內層用來略過無效字元的迴圈中，忘記加上 left < right 的邊界檢查。如果字串完全由無效字元組成，內層的 while 迴圈會一路狂奔直到指針交叉甚至越界，導致程式碼拋出陣列存取例外或陷入無窮迴圈。另一個常見錯誤是忽略了大小寫的轉換，在比對字元時直接進行相等性判斷，導致包含大小寫混合的合法回文被誤判為不合法。

## Complexity

時間複雜度為 O(n)，其中 n 是字串的長度，因為每個字元至多被左右指標訪問一次。空間複雜度為 O(1)，因為我們僅使用兩個整數指標來記錄位置，沒有配置額外的資料結構。

## Digest

今日重點在於掌握 String Two Pointers with Preprocessing。透過在雙指標迭代過程中即時過濾無效字元，我們能在 O(1) 空間內完成複雜字串驗證。實作時務必留意內層指標移動的邊界防護。

## TypeScript Tip

在 TypeScript 中實作字元驗證輔助函式時，可以利用 charCodeAt 進行效能優化，避免頻繁建立正規表達式。同時確保所有字元比對前先轉為小寫。

```typescript
import assert from "node:assert";

function validateClean(s: string): boolean {
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
    l++;
    r--;
  }
  return true;
}
assert.strictEqual(validateClean("aba"), true);
```

## Python Tip

Python 提供了內建的字串方法如 isalnum()、lower()，能大幅簡化字元檢查的程式碼。善用這些內建函式可以寫出既簡潔又高效的邏輯。

```python
def py_helper_test() -> None:
    text = "RaceCar"
    assert text.lower() == "racecar"
    assert text[0].isalnum() is True

py_helper_test()
```

## TypeScript Corner

```typescript
function isPalindrome(s: string): boolean {
  let left = 0;
  let right = s.length - 1;
  
  const isAlphaNumeric = (char: string): boolean => {
    const code = char.charCodeAt(0);
    return (
      (code >= 48 && code <= 57) || 
      (code >= 97 && code <= 122) || 
      (code >= 65 && code <= 90)
    );
  };

  while (left < right) {
    while (left < right && !isAlphaNumeric(s[left])) {
      left++;
    }
    while (left < right && !isAlphaNumeric(s[right])) {
      right--;
    }
    if (s[left].toLowerCase() !== s[right].toLowerCase()) {
      return false;
    }
    left++;
    right--;
  }
  return true;
}

if (!isPalindrome("A man, a plan, a canal: Panama")) {
  throw new Error("Assertion failed: expected true");
}
```

## Python Corner

```python
def is_palindrome(s: str) -> bool:
    left, right = 0, len(s) - 1
    
    while left < right:
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True

assert is_palindrome("A man, a plan, a canal: Panama") == True, "Assertion failed"
```

## Takeaway

雙指標結合前置處理的關鍵在於內部迴圈的邊界條件防護，確保不配置額外空間並在 O(n) 時間內完成。

## Tomorrow Preview

明天我們將探討 Sliding Window 與 Two Pointers 的結合應用，學習如何在動態區間內維持不重複字元或特定約束條件，進一步提升對陣列與字串掃描的優化能力。

## Today's Challenge

- **125** · 需要驗證回文，且字串中夾雜大量非英數字元的標點與空白，完全對應 On-the-fly Preprocessing 技巧。
  - Hint: 記得在左右指標向內推進時，用內層迴圈跳過所有非英數字元，並隨時檢查 left < right。
- **680** · 允許刪除至多一個字元來構成回文，當遇到不匹配時可以利用雙指標分別嘗試略過左邊或右邊的字元。
  - Hint: 當 s[left] !== s[right] 時，檢查跳過左邊字元或跳過右邊字元後的子字串是否為回文。
