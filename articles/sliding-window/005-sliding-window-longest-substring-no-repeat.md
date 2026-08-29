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

Longest Substring Without Repeating Characters 是一個經典的 Variable Sliding Window 問題。核心精神在於維護一個沒有重複字元的有效窗口，透過右指標不斷擴展來尋找最大長度，當遇到重複字元時，則透過左指標的調整來縮減窗口，確保窗口內的字元永遠保持唯一性。

## Thinking

在處理字串子字串問題時，暴力解法需要檢查所有可能的子字串，時間複雜度高達 O(n^2) 甚至 O(n^3)。透過 Variable Sliding Window，我們可以使用兩個指標 left 與 right 來代表當前視窗的邊界。為了在 O(1) 時間內檢測重複字元並定位其上一次出現的位置，我們可以使用 Hash Map 記錄每個字元最後一次出現的索引。當 right 指標掃描到一個已經存在於 Hash Map 中的字元，且該字元上次出現的位置大於或等於 left 指標時，我們必須將 left 指標直接跳轉到該重複字元上次出現位置的下一個位置（即 map[char] + 1），藉此快速排除重複字元並維持視窗的有效性。

## Pattern Recognition

當題目要求找出符合特定條件的「連續子陣列」或「子字串」，且該條件與元素的唯一性、總和限制或頻率限制有關，且視窗大小可變動時，通常就是 Variable Sliding Window 模式的強烈信號。特別是關鍵字包含 'longest substring without repeating characters' 或強調不重複元素時，配合 Hash Map 記錄最後位置是標準解法。

## Common Mistakes

最常見的錯誤是讓左指標（left pointer）往回移動。當使用雜湊表記錄字元索引時，如果字元上次出現的位置小於當前的 left 指標，我們不應該將 left 往回移，因為該重複字元已經不在當前的視窗範圍內。因此，在更新 left 指標時必須取當前 left 與 map[char] + 1 的最大值：left = Math.max(left, map.get(char) + 1)。另一個常見錯誤是忘記在每次遇到字元時更新其在 Hash Map 中的最新索引。

## Complexity

時間複雜度為 O(n)，其中 n 是字串長度。左右指標各自最多只會走訪字串一次。空間複雜度為 O(min(n, m))，其中 m 是字元集的大小（例如英文字母 26 個或 ASCII 128 個），因為 Hash Map 最多儲存字元集大小的鍵值對。

## Digest

本篇探討 Longest Substring Without Repeating Characters，掌握 Variable Sliding Window 搭配 Hash Map 的核心架構。透過記錄字元最後出現的索引，我們能夠在 O(n) 時間內動態調整視窗邊界，避免暴力解法的重複計算。重點在於確保左指標單調遞增，利用 Math.max 避開過期索引的干擾。

## TypeScript Tip

```typescript
import assert from "node:assert";

// TypeScript 提示：使用 Map 時明確指定型別，並注意非空斷言運算子的正確使用。
function optimizedLength(s: string): number {
    const map = new Map<string, number>();
    let max = 0, left = 0;
    for (let right = 0; right < s.length; right++) {
        const c = s[right];
        if (map.has(c)) {
            left = Math.max(left, map.get(c)! + 1);
        }
        map.set(c, right);
        max = Math.max(max, right - left + 1);
    }
    return max;
}

assert.strictEqual(optimizedLength("au"), 2);
```

## Python Tip

```python
# Python 提示：利用 enumerate 同時獲取索引與字元，並善用字典的 get 方法簡化查詢邏輯。
def optimized_length(s: str) -> int:
    char_map = {}
    max_len = 0
    left = 0
    for right, char in enumerate(s):
        if char in char_map:
            left = max(left, char_map[char] + 1)
        char_map[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len

assert optimized_length("au") == 2
```

## Takeaway

Variable Sliding Window 透過動態調整左右指標與 Hash Map 紀錄，將無重複子字串問題優化至 O(n) 時間複雜度。

## Tomorrow Preview

明天我們將探討 Sliding Window 的另一個延伸應用：Fixed Size Sliding Window，學習如何在固定長度的視窗內高效計算統計數據，並搭配雙端佇列或頻率陣列解決更複雜的區間最值問題。

## Today's Challenge

- **3** · 本題為最經典的 Variable Sliding Window 問題，要求找出不含重複字元的最長子字串長度，透過 Hash Map 記錄字元索引可將時間複雜度降至線性。
  - Hint: 使用 Hash Map 記錄每個字元最近出現的索引位置，當遇到重複字元且其位置大於等於左指標時，直接將左指標移動到該位置的下一個。
