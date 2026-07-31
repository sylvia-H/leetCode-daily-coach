---
id: string-sliding-window-variable
title: Variable-Size Sliding Window on Strings
module: string
pattern_label: Sliding Window
complexity_label: O(n) / O(k)
estimated_minutes: 20
exit_criteria:
  - >-
    Can solve longest substring problems without repeating characters or with
    character constraints.
---
## Concept

Variable-Size Sliding Window on Strings 是一種在處理字串子字串問題時非常強大的演算法技巧。透過維護一個動態調整大小的視窗（由左右兩個指標 left 與 right 界定），我們可以在一次線性掃描中找到符合特定條件的最長或最短子字串。視窗的右端點不斷向右擴展以納入新的字元，而當視窗違反約束條件時，左端點則向右收縮，直到視窗重新恢復合法狀態。

## Thinking

在解決此類問題時，我們的思考核心在於維護當前視窗 [left, right] 內的字元狀態，例如字元的出現頻率或是唯一性。我們使用 right 指標持續擴展視窗，並將新字元的統計數據更新到資料結構中。每當條件不滿足（例如出現重複字元或超出替換次數上限）時，我們啟動迴圈移動 left 指標並從統計數據中移除對應字元，直到條件再次成立。在每次視窗合法時，更新我們所求的最佳解。

## Pattern Recognition

當題目要求尋找滿足特定條件的「最長子字串」（Longest Substring）或「最短子字串」（Shortest Substring），且條件與字元頻率、不重複性或字元替換次數有關時，即可強烈識別出此 Pattern 的適用性。關鍵特徵在於視窗大小不固定，需要根據內部條件動態伸縮。

## Common Mistakes

最常見的錯誤包含在收縮視窗時忘記更新對應的字元頻率或狀態，導致統計數據失真；另一個常見錯誤是在視窗收縮後、或每次迴圈迭代的錯誤時間點更新最大長度，導致漏掉合法的最佳解。

## Complexity

時間複雜度為 O(n)，因為左右指標在整個過程中最多各走過字串一次。空間複雜度為 O(k)，其中 k 為字元集的大小，用於儲存視窗內字元的頻率或索引。

## Digest

Variable-Size Sliding Window 透過動態調整 left 與 right 指標來處理字串的子字串問題。右指標擴展以引入新元素，左指標在違反條件時收縮。配合 Hash Map 追蹤頻率或索引，能將原本需要 O(n^2) 的暴力解法優化至 O(n) 時間複雜度。

## TypeScript Tip

```typescript
import assert from "node:assert";
function longestOnes(s: string, k: number): number {
  let left = 0, right = 0, maxLen = 0, zeros = 0;
  while (right < s.length) {
    if (s[right] === '0') zeros++;
    while (zeros > k) {
      if (s[left] === '0') zeros--;
      left++;
    }
    maxLen = Math.max(maxLen, right - left + 1);
    right++;
  }
  assert(maxLen >= 0);
  return maxLen;
}
assert.strictEqual(longestOnes("101101", 1), 4);
```

## Python Tip

```python
def longest_ones(s: str, k: int) -> int:
    left = 0
    max_len = 0
    zeros = 0
    for right, char in enumerate(s):
        if char == '0':
            zeros += 1
        while zeros > k:
            if s[left] == '0':
                zeros -= 1
            left += 1
        max_len = max(max_len, right - left + 1)
    assert max_len >= 0
    return max_len

assert longest_ones("101101", 1) == 4
```

## TypeScript Corner

```typescript
function lengthOfLongestSubstring(s: string): number {
  const charMap = new Map<string, number>();
  let left = 0;
  let maxLength = 0;
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (charMap.has(char) && charMap.get(char)! >= left) {
      left = charMap.get(char)! + 1;
    }
    charMap.set(char, right);
    maxLength = Math.max(maxLength, right - left + 1);
  }
  if (maxLength < 0) throw new Error("assertion failed");
  return maxLength;
}
const res = lengthOfLongestSubstring("abcabcbb");
if (res !== 3) throw new Error("assertion failed");
```

## Python Corner

```python
def length_of_longest_substring(s: str) -> int:
    char_index = {}
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        if char in char_index and char_index[char] >= left:
            left = char_index[char] + 1
        char_index[char] = right
        max_len = max(max_len, right - left + 1)
    assert max_len >= 0, "assertion failed"
    return max_len

result = length_of_longest_substring("abcabcbb")
assert result == 3, "assertion failed"
```

## Takeaway

掌握動態滑動視窗的伸縮時機與狀態維護，是解決各類字串子字串最佳化問題的關鍵。

## Tomorrow Preview

明天我們將探討 Fixed-Size Sliding Window 技巧，學習如何在固定長度的限制下，有效率地維護視窗內的狀態與極值。

## Today's Challenge

- **3** · 尋找無重複字元的的最長子字串，非常適合使用動態滑動視窗來維護視窗內的唯一性。
  - Hint: 當右指標遇到已存在視窗內的字元時，將左指標移動到該重複字元上次出現位置的下一個位置。
- **424** · 允許替換最多 k 個字元來形成最長重複字元子字串，可用變動視窗配合最高頻率字元統計來解。
  - Hint: 視窗大小減去最高頻率字元的數量若大於 k，則必須收縮左指標。
- **1876** · 檢查長度為 3 的子字串是否所有字元都相異，可作為理解滑動視窗基本操作的入門題。
  - Hint: 雖然是固定長度，但維持視窗內不重複的概念與變動視窗相通。
