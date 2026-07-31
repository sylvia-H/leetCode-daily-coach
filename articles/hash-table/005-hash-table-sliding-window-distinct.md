---
id: hash-table-sliding-window-distinct
title: Sliding Window with Hash Set for Distinct Elements
module: hash-table
pattern_label: Sliding Window Set
complexity_label: O(n) / O(k)
estimated_minutes: 15
exit_criteria:
  - Can expand window and add to set
  - Can shrink window from the left and remove from set when duplicates occur
---
## Concept

Sliding Window 結合 Hash Set 是一種用來追蹤子字串或子陣列中「不重複元素」的高效演算法模式。當我們需要在動態或固定大小的區間內維護唯一性時，可以使用兩個指標（Left Pointer 與 Right Pointer）來界定視窗範圍，並利用 Hash Set 在 O(1) 的平均時間複雜度內進行元素的查詢、新增與刪除。

## Thinking

在處理這類問題時，我們的思考邏輯是透過 Right Pointer 不斷向右擴展視窗，將新遇到的元素加入 Hash Set 中。若新元素已經存在於 Set 內，代表違反了不重複的條件。此時，我們必須啟動內層的收縮機制，讓 Left Pointer 向右移動，並從 Hash Set 中依序移除左側的元素，直到該重複元素被完全排除在視窗之外，視窗重新恢復合法狀態。透過這種擴展與收縮的交替，我們能夠掃描整個資料結構。

## Pattern Recognition

當題目要求尋找「包含唯一元素的的最長子字串」、「不含重複字元的子陣列長度」，或是「在固定大小 k 視窗內是否存在重複元素」時，即可高度識別出此 Pattern 的應用時機。

## Common Mistakes

最常見的錯誤在於當視窗發生衝突需要收縮時，開發者容易忘記將移出視窗範圍的元素從 Hash Set 中刪除。這會導致 Hash Set 內仍殘留舊元素，進而引發後續的邏輯判斷錯誤。另一個錯誤則是混淆了指標移動的條件，導致進入無窮迴圈。

## Complexity

Time Complexity: O(n)，其中 n 為陣列或字串長度，因為每個元素最多被 Right Pointer 訪問一次、被 Left Pointer 移除一次。
Space Complexity: O(k)，其中 k 為視窗內的元素數量或字元集大小，用以儲存 Hash Set。

## Digest

本篇介紹了 Sliding Window 搭配 Hash Set 的核心觀念，透過動態調整左右指標並維護集合內的唯一元素，將暴力解法的 O(n^2) 降至線性時間 O(n)。這種技巧在處理字串與子陣列問題時非常實用。

## TypeScript Tip

```typescript
function containsNearbyDuplicate(nums: number[], k: number): boolean {
  const windowSet = new Set<number>();
  for (let i = 0; i < nums.length; i++) {
    if (windowSet.has(nums[i])) return true;
    windowSet.add(nums[i]);
    if (windowSet.size > k) {
      windowSet.delete(nums[i - k]);
    }
  }
  return false;
}
const result = containsNearbyDuplicate([1,2,3,1], 3);
if (result !== true) throw new Error("assertion failed");
```

## Python Tip

```python
def contains_nearby_duplicate(nums: list[int], k: int) -> bool:
    window_set = set()
    for i, num in enumerate(nums):
        if num in window_set:
            return True
        window_set.add(num)
        if len(window_set) > k:
            window_set.remove(nums[i - k])
    return False

assert contains_nearby_duplicate([1, 2, 3, 1], 3) == True, "assertion failed"
```

## TypeScript Corner

```typescript
function lengthOfLongestSubstring(s: string): number {
  const charSet = new Set<string>();
  let left = 0;
  let maxLength = 0;
  for (let right = 0; right < s.length; right++) {
    while (charSet.has(s[right])) {
      charSet.delete(s[left]);
      left++;
    }
    charSet.add(s[right]);
    maxLength = Math.max(maxLength, right - left + 1);
  }
  if (maxLength !== 3) throw new Error("assertion failed");
  return maxLength;
}
lengthOfLongestSubstring("abcabcbb");
```

## Python Corner

```python
def length_of_longest_substring(s: str) -> int:
    char_set = set()
    left = 0
    max_length = 0
    for right in range(len(s)):
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
        char_set.add(s[right])
        max_length = max(max_length, right - left + 1)
    assert max_length == 3, "assertion failed"
    return max_length

length_of_longest_substring("abcabcbb")
```

## Takeaway

運用 Sliding Window 搭配 Hash Set 時，務必確保擴展時加入、收縮時移除，才能維持正確的視窗狀態。

## Tomorrow Preview

明天我們將探討 Two Pointers 在排序陣列中的進階應用，學習如何利用雙向夾擠來解決更複雜的查找問題。

## Today's Challenge

- **3** · 要求找出不含重複字元的最長子字串，完美對應動態視窗與 Hash Set 追蹤唯一元素的特性。
  - Hint: 當右側字元已存在於 Set 中時，持續移動左側指標並從 Set 移除元素。
- **219** · 要求檢查陣列中是否存在相同元素且其索引距離小於或等於 k，適合使用大小為 k 的固定視窗來維護。
  - Hint: 當視窗大小超過 k 時，必須移除最左側的元素以維持視窗邊界。
