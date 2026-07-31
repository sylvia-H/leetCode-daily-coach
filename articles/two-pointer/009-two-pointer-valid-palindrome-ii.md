---
id: two-pointer-valid-palindrome-ii
title: Valid Palindrome with Single Deletion
module: two-pointer
pattern_label: Two Pointers - Conditional Branching
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能夠在發現字元不相等時正確驗證跳過左邊或跳過右邊的子字串是否為迴文
  - 理解分支邏輯對時間複雜度的影響仍保持在 O(n)
---
## Concept

Valid Palindrome with Single Deletion 是經典迴文檢查問題的延伸。傳統迴文檢查要求字串正向與反向讀取完全相同，而此變體允許在過程中至多刪除一個字元。當我們使用相向雙指標由兩端向中心檢查時，若遇到字元不相等的情況，傳統演算法會直接回傳 false，但在允許刪除一個字元的條件下，我們必須分支出兩個子問題：分別嘗試略過左側字元（檢查 s[left+1...right]）或略過右側字元（檢查 s[left...right-1]），只要其中一個子字串為迴文，則原字串即符合條件。

## Thinking

在解決此問題時，我們首先設定左右雙指標分別指向字串的頭與尾。當字串兩端的字元相等時，左右指標同步向內移動。一旦發現 s[left] !== s[right]，這代表我們遇到了不匹配的衝突點。此時不能直接放棄，而是必須評估兩種可能的分支：第一種是刪除目前的左字元，檢查剩餘的子字串 s[left+1...right] 是否為迴文；第二種是刪除目前的右字元，檢查剩餘的子字串 s[left...right-1] 是否為迴文。為了保持程式碼結構清晰與高可讀性，我們通常會封裝一個輔助函式專門用來檢查特定範圍的子字串是否為迴文。

## Pattern Recognition

當題目要求判斷字串是否能在「修改、刪除、或替換至多 k 個字元」的條件下達成某種對稱性或特定結構時，通常可以採用 Two Pointers 結合 Conditional Branching 的模式。在雙指標掃描的過程中，遇到不滿足條件的節點時，不是直接終止，而是依據題目的容錯額度進行分支探索。此種模式的時間複雜度通常能維持在線性時間 O(n)，因為分支的次數有嚴格上限，不會導致指數級別的遞迴爆炸。

## Common Mistakes

最常見的錯誤是在第一次遇到不相等時，沒有完整涵蓋兩種刪除可能性（例如只嘗試刪除左邊卻忘記嘗試刪除右邊）。另一個常見錯誤是重複實作迴文檢查邏輯而沒有將子範圍檢查抽離為獨立的 helper function，導致程式碼變得冗長且容易在指標邊界計算上出錯。此外，部分實作者在呼叫子範圍檢查時，沒有正確傳入刪除後的正確索引範圍，造成越界存取或邏輯判斷失誤。

## Complexity

時間複雜度為 O(n)，其中 n 為字串長度。雖然在遇到不匹配時會進行分支檢查，但由於子範圍檢查最多只會執行一次（且其內部也是線性掃描），整體操作最多只會掃描字串常數次，因此時間複雜度依然保持在 O(n)。空間複雜度為 O(1)，因為我們僅使用了常數額外的指標變數，不需額外配置大容量的資料結構。

## Digest

Valid Palindrome with Single Deletion 擴展了傳統雙指標迴文檢查。核心策略是利用相向雙指標進行掃描，當遇到 s[left] !== s[right] 時，透過 Conditional Branching 分別驗證刪除左字元或右字元後的子範圍。透過封裝 helper function，我們能保持 O(n) 時間複雜度與 O(1) 空間複雜度，同時確保邏輯清晰無誤。

## TypeScript Tip

```typescript
// TypeScript 技巧：利用箭頭函式在區域範疇內封裝輔助邏輯
function checkPalindrome(s: string): boolean {
  const isValid = (l: number, r: number): boolean => {
    while (l < r) {
      if (s[l++] !== s[r--]) return false;
    }
    return true;
  };

  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    if (s[left] === s[right]) {
      left++;
      right--;
    } else {
      return isValid(left + 1, right) || isValid(left, right - 1);
    }
  }
  return true;
}

if (!checkPalindrome("aba")) throw new Error("Test failed");
```

## Python Tip

```python
# Python 技巧：利用字串切片語法快速驗證子字串是否為迴文
def check_palindrome_python(s: str) -> bool:
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] == s[right]:
            left += 1
            right -= 1
        else:
            skip_l = s[left + 1 : right + 1]
            skip_r = s[left:right]
            return skip_l == skip_l[::-1] or skip_r == skip_r[::-1]
        return True

assert check_palindrome_python("aba") == True, "Test failed"
```

## TypeScript Corner

```typescript
function validPalindrome(s: string): boolean {
  function isPalindromeRange(str: string, low: number, high: number): boolean {
    while (low < high) {
      if (str[low] !== str[high]) return false;
      low++;
      high--;
    }
    return true;
  }

  let left = 0;
  let right = s.length - 1;

  while (left < right) {
    if (s[left] === s[right]) {
      left++;
      right--;
    } else {
      return isPalindromeRange(s, left + 1, right) || isPalindromeRange(s, left, right - 1);
    }
  }
  return true;
}

const testResult = validPalindrome("abca");
if (testResult !== true) throw new Error("Assertion failed: expected true");
```

## Python Corner

```python
def validPalindrome(s: str) -> bool:
    def is_palindrome_range(sub: str, low: int, high: int) -> bool:
        while low < high:
            if sub[low] != sub[high]:
                return False
            low += 1
            high -= 1
        return True

    left, right = 0, len(s) - 1
    while left < right:
        if s[left] == s[right]:
            left += 1
            right -= 1
        else:
            return is_palindrome_range(s, left + 1, right) or is_palindrome_range(s, left, right - 1)
    return True

assert validPalindrome("abca") == True, "Assertion failed"
```

## Takeaway

雙指標遇不匹配時切勿慌張，透過條件分支探索刪除後的子問題，保持 O(n) 效能。

## Tomorrow Preview

明天我們將探討 Two Pointers 在排序陣列中的進階應用，學習如何處理包含重複元素的複雜情境，並保持演算法的高效性與正確性。

## Today's Challenge

- **680** · 本題為經典的 Valid Palindrome II，完美對應雙指標遇到不匹配時進行條件分支刪除字元的模式。
  - Hint: 當 s[left] !== s[right] 時，分別檢查 s[left+1...right] 與 s[left...right-1] 是否為迴文。
