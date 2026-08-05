---
id: string-sliding-window-fixed
title: Fixed-Size Sliding Window on Strings
module: string
pattern_label: Sliding Window
complexity_label: O(n) / O(k)
estimated_minutes: 15
exit_criteria:
  - >-
    Can slide a window of size k across a string while updating frequency maps
    efficiently.
---
## Concept

Fixed-Size Sliding Window on Strings 是一種用於處理字串與陣列問題的演算法技巧。當題目要求在長度為 n 的字串中尋找或匹配長度固定為 k 的某種特徵（例如子字串的排列組合、字元頻率匹配等）時，我們可以維護一個大小固定的視窗。隨著視窗在字串上向右滑動，每次只需要將新進入視窗的字元納入統計，並將離開視窗的字元從統計中移除，即可在維持常數時間內更新狀態，避免重複計算。

## Thinking

在處理字串中的固定長度子字串問題時，直覺的暴力解法是針對每一個可能的起始位置，重新計算長度為 k 的子字串頻率，這會導致的時間複雜度。然而，當視窗向右移動一位時，大部分的字元其實是重疊的。透過 Thinking 的調整，我們只需要處理兩個字元：加入視窗右側的新字元與移出視窗左側的舊字元。我們可以使用頻率陣列或雜湊表來追蹤目前視窗內的字元狀態，並與目標狀態進行比對，將每次移動的更新時間降至 O(1)。

## Pattern Recognition

當題目具備以下特徵時，高度對應到 Fixed-Size Sliding Window on Strings 的 Pattern：
1. 輸入為字串或陣列。
2. 要求尋找特定長度（固定為 k）的子字串或子陣列。
3. 涉及尋找字母異位詞、固定長度的字元頻率匹配、或子字串排列組合是否存在。
4. 時間複雜度要求為線性時間 O(n)。

## Common Mistakes

最常見的錯誤是在每次視窗滑動時，重新從頭計算整個視窗內的字元頻率，這會使整體時間複雜度退化為 O(n * k)。另一個常見錯誤是當視窗大小小於 k 時就過早進行頻率比對，或是在指標更新時沒有正確處理邊界條件，導致漏掉最後一個有效視窗的檢查。

## Complexity

時間複雜度為 O(n)，其中 n 為字串長度，因為每個字元最多進入與離開視窗各一次。空間複雜度為 O(k) 或 O(1)，取決於字元集的大小（若為英文字母則固定為 26，空間為 O(1)）。

## Digest

Fixed-Size Sliding Window on Strings 核心在於維護大小固定的視窗。透過滑動時對應移除舊字元與加入新字元，達成 O(1) 狀態更新。實作上使用固定大小陣列追蹤頻率，能有效解決字串排列與匹配問題。

## TypeScript Tip

```typescript
function slidingWindowTip(s: string, k: number): number {
  const window = new Array(26).fill(0);
  const base = 'a'.charCodeAt(0);
  let matchCount = 0;
  for (let i = 0; i < k; i++) {
    const code = s.charCodeAt(i) - base;
    window[code]++;
  }
  if (window[0] > 0) matchCount++;
  return matchCount;
}
const ans = slidingWindowTip("abc", 3);
if (ans !== 1) throw new Error("assertion failed");
```

## Python Tip

```python
from collections import Counter

def sliding_window_tip(s: str, k: int) -> int:
    window = Counter(s[:k])
    match_count = 1 if window['a'] > 0 else 0
    return match_count

ans = sliding_window_tip("abc", 3)
assert ans == 1, "assertion failed"
```

## TypeScript Corner

```typescript
function checkFixedWindow(s: string, k: number): boolean {
  if (s.length < k) return false;
  const count = new Array(26).fill(0);
  const charCodeA = 'a'.charCodeAt(0);
  for (let i = 0; i < k; i++) {
    count[s.charCodeAt(i) - charCodeA]++;
  }
  return count.some(c => c > 0);
}
const result = checkFixedWindow("abc", 2);
if (!result) throw new Error("assertion failed");
```

## Python Corner

```python
def check_fixed_window(s: str, k: int) -> bool:
    if len(s) < k:
        return False
    count = [0] * 26
    for i in range(k):
        count[ord(s[i]) - ord('a')] += 1
    return any(c > 0 for c in count)

result = check_fixed_window("abc", 2)
assert result == True, "assertion failed"
```

## Takeaway

固定大小滑動視窗透過維持 O(1) 的狀態轉移，將字串區間搜尋優化至線性時間，是處理排列與子字串問題的利器。

## Tomorrow Preview

明天我們將探討 Dynamic-Size Sliding Window on Strings，學習如何處理視窗大小不固定、根據條件自動擴張與收縮的字串題型。

## Today's Challenge

- **438** · 要求在字串中找出所有字母異位詞的起始索引，子字串長度固定為p的長度，完美契合固定大小滑動視窗。
  - Hint: 維持兩個頻率陣列，一個記錄p的字元分佈，另一個記錄s中當前視窗的字元分佈。
- **567** · 需要檢查某個字串是否包含另一個字串的排列組合，本質上就是固定長度為s1長度的視窗匹配問題。
  - Hint: 當視窗向右滑動時，僅需更新移出與移入的字元頻率，並與目標頻率進行比對。
