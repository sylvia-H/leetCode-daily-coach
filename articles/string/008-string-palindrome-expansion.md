---
id: string-palindrome-expansion
title: Center Expansion for Palindromes
module: string
pattern_label: Two Pointers
complexity_label: O(n^2) / O(1)
estimated_minutes: 15
exit_criteria:
  - >-
    Can write a helper function to expand around single and double character
    centers.
---
## Concept

Center Expansion for Palindromes 是一種經典的字串處理技巧。其核心觀念在於：任何一個回文（Palindrome）都必然存在一個中心點。針對長度為奇數的回文，其中心為單一字元；針對長度為偶數的回文，其中心則為相鄰的兩個字元。我們不需要檢查所有可能的子字串組合（這需要 O(n^3) 的時間複雜度），而是枚舉字串中的每一個可能中心，並向左右兩側同時擴展，只要兩側的字元相符，就持續擴展直到不匹配為止。這種方法能將尋找回文的時間複雜度有效降低。

## Thinking

當我們著手處理尋找回文的問題時，直覺的暴力解法是檢查所有可能的起始與結束索引，這會消耗 O(n^3) 的時間。進一步思考，與其從邊界向內檢查，不如反向操作——從中心向外擴展。字串長度為 n 時，總共有 2n - 1 個可能的中心點（n 個單字元中心與 n - 1 個雙字元中心）。我們針對每一個中心點設計一個擴展函式，回傳以該中心向外擴展所能形成的最大回文長度。在疊代所有中心點的過程中，維護並記錄全域最長回文的起始位置與長度，即可在 O(n^2) 時間內完成求解。

## Pattern Recognition

當題目要求「尋找最長回分子字串」（Longest Palindromic Substring）或是需要判斷某個字串片段是否為對稱結構時，通常可以聯想到 Two Pointers 與 Center Expansion 模式。辨識線索包含：字串長度限制在合理範圍內（例如 n <= 1000）、需要比對左右兩側元素是否相等、且操作行為是以某個基準點向兩側發散。此時不需使用複雜的 Manacher's Algorithm，Center Expansion 往往是兼顧實作簡潔與效能的最佳選擇。

## Common Mistakes

實作 Center Expansion 時最常見的錯誤為邊界條件（Off-by-one errors）的處理不當。例如：初始化指針時，將雙字元中心的右側位置算錯；或是當回文長度達到字串邊界時，沒有做好索引範圍的檢查導致 Index Out of Bounds 異常。另一個常見錯誤是混淆了奇數長度與偶數長度的中心點迴圈條件，導致漏掉偶數長度的回文檢測。

## Complexity

Time Complexity: O(n^2)，因為總共有 2n - 1 個中心點，每個中心點向外擴展最壞情況需要 O(n) 的時間。Space Complexity: O(1)，我們只需要常數級別的額外變數來記錄起始位置與最大長度，不需額外配置與字串長度成正比的儲存空間。

## Digest

Center Expansion for Palindromes 是處理回文字串問題的核心技巧。本單元介紹如何透過分析回文的對稱特性，將暴力解的 O(n^3) 降至 O(n^2) 時間複雜度與 O(1) 空間複雜度。我們學習了如何同時處理單字元與雙字元中心，並透過向外擴展的輔助函式來尋找最大長度。在實作上必須嚴格注意邊界條件的防護，避免越界存取。掌握此模式後，面對 LeetCode 5 等經典回文題目將能迎刃而解。

## TypeScript Tip

```typescript
function safeExpand(s: string, l: number, r: number): number {
  while (l >= 0 && r < s.length && s[l] === s[r]) {
    l--;
    r++;
  }
  return r - l - 1;
}
const len = safeExpand("racecar", 3, 3);
if (len !== 7) throw new Error("assertion failed");
```

## Python Tip

```python
def safe_expand(s: str, l: int, r: int) -> int:
    while l >= 0 and r < len(s) and s[l] == s[r]:
        l -= 1
        r += 1
    return r - l - 1

length = safe_expand("racecar", 3, 3)
assert length == 7, "assertion failed"
```

## Takeaway

回文必有中心，以 2n - 1 個中心向外擴展可達成 O(n^2) 時間與 O(1) 空間。

## Tomorrow Preview

明天我們將探討 Sliding Window 模式，學習如何在動態調整視窗大小的過程中處理連續子陣列與字串問題，進一步提升陣列與字串題目的解題敏銳度。

## Today's Challenge

- **5** · 題目的核心要求是找出字串中的最長回分子字串，完全符合 Center Expansion 的應用場景，透過逐一檢查每個可能的中心點向外擴展即可高效求解。
  - Hint: 注意中心點分為奇數長度（單一字元）與偶數長度（相鄰兩字元）兩種情況，必須兩者兼顧。
