---
id: sliding-window-longest-substring-no-repeat
title: Longest Substring Without Repeating Characters
module: sliding-window
pattern_label: Variable Sliding Window + Hash Map
complexity_label: 'O(n) / O(min(n, charset))'
estimated_minutes: 20
exit_criteria:
  - >-
    Can use a hash map or frequency array to detect duplicate characters in O(1)
    time.
  - >-
    Can jump or contract the left pointer past the previous occurrence of a
    duplicate character.
---
## Concept

Longest Substring Without Repeating Characters 是一種結合 Variable Sliding Window 與 Hash Map 的經典演算法技巧。核心概念是維護一個動態調整大小的滑動視窗，透過右指標（right pointer）不斷擴展視窗以納入新字元，同時利用左指標（left pointer）在遇到重複字元時進行收縮。透過 Hash Map 記錄每個字元最近一次出現的索引位置，視窗能夠在發生重複時直接將左指標跳躍（jump）至該重複字元的歷史索引加一處，從而將尋找最長無重複子字串的時間複雜度從線性暴力解的 O(n^2) 降低至線性時間 O(n)。

## Thinking

在解決此問題時，思考的核心在於如何有效率地檢測重複字元並調整視窗邊界。我們可以使用一個 Hash Map（或物件、字典）來儲存每一個字元及其對應的最後出現索引（char-to-index mapping）。當右指標掃描到一個新字元時，我們檢查該字元是否已經存在於 Map 中，且其對應的索引是否大於或等於目前的左指標位置。如果是，代表當前視窗內已經包含了這個重複字元，此時我們必須將左指標更新為 map[char] + 1。無論是否重複，我們都需要更新該字元的最新索引，並在每次疊代中計算當前視窗的長度（right - left + 1）來更新最大長度紀錄。

## Pattern Recognition

當題目要求尋找「最長子字串」（Longest Substring）、「不包含重複字元」（Without Repeating Characters）或具有「唯一性約束」（Unique Elements Constraint）時，應立即聯想至 Variable Sliding Window Pattern。若題目允許視窗大小動態變化，且需要快速定位重複元素的位置以進行 O(1) 的視窗收縮，則必須搭配 Hash Map 或頻率陣列來紀錄狀態。

## Common Mistakes

最常見的錯誤是讓左指標（left pointer）發生倒退（Backward Movement）。當使用 Hash Map 記錄字元索引時，如果沒有限制「只有當歷史索引大於或等於當前左指標時才更新左指標」，左指標可能會不小心被設定回較小的舊位置，導致視窗範圍錯誤地擴大。另一個常見錯誤是忘記在每次疊代中更新當前字元在 Map 中的最新索引，或是混淆了「字元頻率計算」與「字元最新索引跳躍」兩種不同的視窗收縮策略。

## Complexity

時間複雜度為 O(n)，其中 n 是字串的長度。因為左右指標都只會單向向右移動，每個字元最多被訪問兩次。空間複雜度為 O(min(n, m))，其中 m 是字元集（character set）的大小（例如 ASCII 字符集最大為 128 或 256），Hash Map 最多儲存字元集大小的鍵值對。

## Digest

Longest Substring Without Repeating Characters 是一道結合 Variable Sliding Window 與 Hash Map 的經典演算法題。核心邏輯是利用右指標擴展視窗，並用 Hash Map 記錄每個字元的最後出現索引。當遇到重複字元且其位置大於等於左指標時，左指標直接跳至該重複索引的下一個位置，避免了暴力解的重複掃描。時間複雜度為 O(n)，空間複雜度為 O(min(n, charset))。實作時務必注意防止左指標發生倒退，並確保每次都更新字元的最新索引。

## TypeScript Tip

```typescript
function lengthOfLongestSubstring(s: string): number {
  const charMap = new Map<string, number>();
  let left = 0;
  let maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    const lastSeen = charMap.get(char);
    if (lastSeen !== undefined && lastSeen >= left) {
      left = lastSeen + 1;
    }
    charMap.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
const ans = lengthOfLongestSubstring("bbbbb");
if (ans !== 1) throw new Error("Test failed");
```

## Python Tip

```python
def length_of_longest_substring(s: str) -> int:
    seen = {}
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        if char in seen and seen[char] >= left:
            left = seen[char] + 1
        seen[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len

ans = length_of_longest_substring("bbbbb")
assert ans == 1, "Test failed"
```

## TypeScript Corner

```typescript
function lengthOfLongestSubstring(s: string): number {
  const map = new Map<string, number>();
  let left = 0;
  let maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (map.has(char) && map.get(char)! >= left) {
      left = map.get(char)! + 1;
    }
    map.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
const result = lengthOfLongestSubstring("abcabcbb");
if (result !== 3) throw new Error("Assertion failed: expected 3");
```

## Python Corner

```python
def length_of_longest_substring(s: str) -> int:
    char_index_map = {}
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        if char in char_index_map and char_index_map[char] >= left:
            left = char_index_map[char] + 1
        char_index_map[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len

result = length_of_longest_substring("pwwkew")
assert result == 3, "Assertion failed: expected 3"
```

## Takeaway

掌握 Variable Sliding Window 搭配 Hash Map 紀錄索引的技巧，遇重複字元時將左指標直接跳躍至歷史索引加一，確保 O(n) 高效解法。

## Tomorrow Preview

預告明天的課程將進入 Sliding Window 的另一個重要變體：Fixed Sliding Window 與字元頻率匹配（Permutation in String），探討如何使用固定長度的視窗配合陣列比對來解決字安重排與子字串包含問題。

## Today's Challenge

- **3** · This is the foundational problem for variable sliding window with character uniqueness constraint, perfectly solved by tracking character indices in a hash map.
  - Hint: Keep track of the last seen index of each character and jump the left pointer when a duplicate is encountered inside the current window.
