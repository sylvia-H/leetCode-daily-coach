---
id: sliding-window-find-all-anagrams
title: Find All Anagrams in a String
module: sliding-window
pattern_label: Fixed Sliding Window
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - >-
    Can record the starting index of the window whenever the frequency match
    condition is satisfied.
  - >-
    Can traverse the entire string while maintaining the fixed window
    efficiently.
---
## Concept

Find All Anagrams in a String 核心概念在於利用 Fixed Sliding Window 維持與目標字串 p 等長的窗口，並在字串 s 上進行線性掃描。當窗口內的字元頻率完全符合目標頻率簽章時，記錄當前窗口的起始索引，最終收集所有符合條件的起始位置。

## Thinking

思考過程從維護字元頻率匹配狀態開始。我們需要使用兩個頻率陣列或雜湊表，分別記錄目標字串 p 與當前滑動窗口的字元計數。透過維護一個有效匹配計數器，當新增字元或移除字元使得某字元的計數達成一致時更新匹配狀態。當所有唯一字元的頻率完全吻合時，透過公式 i - p.length + 1 計算出窗口起始索引並加入結果集。

## Pattern Recognition

當題目要求在一個序列中尋找所有長度固定且滿足特定頻率條件的子字串起始位置時，即可辨識為 Fixed Sliding Window Pattern。這與 Permutation in String 相似，但後者僅需回傳布林值，而此 Pattern 必須收集所有符合條件的起始索引。

## Common Mistakes

常見錯誤包含在滑動窗口右移時漏掉更新左側移出字元的計數，或是計算起始索引時發生 Off-by-one 錯誤，導致記錄到錯誤的子字串開頭位置。此外，頻率陣列的比較若每次都以 O(k) 進行，會導致時間複雜度劣化。

## Complexity

時間複雜度為 O(n)，其中 n 為字串 s 的長度，因為每個字元最多進出窗口各一次；空間複雜度為 O(1)，因為字元集大小固定為常數 26。

## Digest

本單元深入探討 Find All Anagrams in a String 的 Fixed Sliding Window 解法。我們學習了如何透過雙指標與固定長度陣列維護字元頻率，並在線性時間內收集所有符合條件的起始索引。掌握這個模式能有效解決各類子字串頻率匹配問題，確保時間複雜度維持在 O(n)。

## TypeScript Tip

在 TypeScript 中，使用固定大小的 Array 記錄字元頻率效能極佳。比對陣列時可抽離比對邏輯以避免重複計算。
```typescript
function matchCount(a: number[], b: number[]): boolean {
  for (let i = 0; i < 26; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
function testMatch(): void {
  const arr1 = [1, 2, 3];
  const arr2 = [1, 2, 3];
  if (!matchCount(arr1, arr2)) throw new Error('assertion failed');
}
testMatch();
```

## Python Tip

在 Python 中，串列相等性比較在底層高度優化，直接比較 `p_count == s_count` 既直觀又具備極佳執行效能。
```python
def test_list_compare() -> None:
    a = [1, 2, 3] + [0] * 23
    b = [1, 2, 3] + [0] * 23
    assert a == b, 'assertion failed'
test_list_compare()
```

## TypeScript Corner

TypeScript 實作使用固定長度陣列記錄字元頻率，並在線性掃描中收集所有符合條件的起始索引。
```typescript
function findAnagrams(s: string, p: string): number[] {
  const res: number[] = [];
  if (s.length < p.length) return res;
  const pCount = new Array(26).fill(0);
  const sCount = new Array(26).fill(0);
  const aCode = 'a'.charCodeAt(0);
  for (let i = 0; i < p.length; i++) {
    pCount[p.charCodeAt(i) - aCode]++;
    sCount[s.charCodeAt(i) - aCode]++;
  }
  if (pCount.every((val, idx) => val === sCount[idx])) {
    res.push(0);
  }
  for (let i = p.length; i < s.length; i++) {
    sCount[s.charCodeAt(i) - aCode]++;
    sCount[s.charCodeAt(i - p.length) - aCode]--;
    if (pCount.every((val, idx) => val === sCount[idx])) {
      res.push(i - p.length + 1);
    }
  }
  if (res.length !== 2 || res[0] !== 0 || res[1] !== 6) throw new Error('assertion failed');
  return res;
}
findAnagrams('cbaebabacd', 'abc');
```

## Python Corner

Python 實作利用串列或 Counter 維持窗口頻率，透過高效的線性掃描找出所有符合條件的起始位置。
```python
def findAnagrams(s: str, p: str) -> list[int]:
    res = []
    if len(s) < len(p):
        return res
    p_count = [0] * 26
    s_count = [0] * 26
    a_code = ord('a')
    for i in range(len(p)):
        p_count[ord(p[i]) - a_code] += 1
        s_count[ord(s[i]) - a_code] += 1
    if p_count == s_count:
        res.append(0)
    for i in range(len(p), len(s)):
        s_count[ord(s[i]) - a_code] += 1
        s_count[ord(s[i - len(p)]) - a_code] -= 1
        if p_count == s_count:
            res.append(i - len(p) + 1)
    assert res == [0, 6], 'assertion failed'
    return res
findAnagrams('cbaebabacd', 'abc')
```

## Takeaway

透過 Fixed Sliding Window 維護頻率簽章，能有效在 O(n) 時間內找出所有 Anagrams 的起始索引。

## Tomorrow Preview

明天將探討 Variable Sliding Window 的核心概念與實作技巧，學習如何動態調整窗口大小以解決字串極值與子陣列問題。

## Today's Challenge

- **438** · 題號 438 要求在字串 s 中尋找所有字串 p 的 Anagrams 的起始索引，這正是 Fixed Sliding Window 頻率匹配的標準應用場景。
  - Hint: 維持與 p 等長的窗口，利用進出窗口的字元更新計數器並記錄起始索引。
