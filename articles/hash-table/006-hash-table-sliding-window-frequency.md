---
id: hash-table-sliding-window-frequency
title: Sliding Window with Hash Map Frequency Balancing
module: hash-table
pattern_label: Sliding Window Frequency Map
complexity_label: O(n) / O(k)
estimated_minutes: 15
exit_criteria:
  - Can update frequency map when sliding window boundaries move
  - Can evaluate window validity based on frequency conditions
---
## Concept

Sliding Window with Hash Map Frequency Balancing 是一種用來處理複雜子字串約束條件的進階演算法技巧。當我們需要在動態的滑動視窗內追蹤字元或元素的出現頻率，並依此判斷視窗是否滿足特定條件時（例如字元數量匹配、包含所有必要元素等），單純依賴指針移動已不足夠，此時必須藉由 Hash Map 或陣列來維護視窗內部的頻率狀態。

## Thinking

在思考此類問題時，核心策略在於動態維護滑動視窗的左右邊界與內部頻率。當右指針擴展視窗時，我們將新加入元素的頻率在 Hash Map 中遞增；當視窗滿足特定條件或需要收縮時，我們則移動左指針並將對應元素的頻率遞減。為了避免每次調整視窗時都重新掃描整個 Hash Map 來驗證條件，我們通常會引入一個匹配計數器（如 matchedCount），只在頻率達到目標值時才增減該計數器，藉此達到高效的狀態追蹤。

## Pattern Recognition

當題目要求尋找符合特定頻率分佈的子字串、進行 Anagram 檢索，或是尋找包含另一個字串所有字元的最小子字串時，即可辨識出此 Pattern。其特徵在於：問題涉及連續區間（Subarray 或 Substring），且條件取決於元素出現的「次數」而非單純的數值大小或存在與否。

## Common Mistakes

常見的錯誤在於當元素的頻率降為零時，直接從 Hash Map 中刪除該鍵，這可能會導致後續比對時無法正確區分「頻率為零」與「鍵不存在」的狀態。另一個常見錯誤是在視窗收縮時，更新頻率與移動指針的順序發生邏輯錯亂，導致狀態未能確實還原。

## Complexity

Time Complexity: O(n) where n is the length of the input string, since each character enters and leaves the sliding window at most once. Space Complexity: O(k) where k is the size of the character set stored in the Hash Map.

## Digest

Sliding Window with Hash Map Frequency Balancing 是一種結合雙指針與頻率統計的經典演算法。透過維持一個固定或變動大小的視窗，並利用 Hash Map 實時記錄內部元素的出現次數，我們能夠在線性時間內解決複雜的子字串約束問題。關鍵在於避免重複掃描狀態，而是藉由狀態變數的增減來 O(1) 判斷視窗是否合法。

## TypeScript Tip

```typescript
function verifyFrequencyMap(): void {
  const map = new Map<string, number>();
  map.set('a', 1);
  if (map.get('a') !== 1) throw new Error("assertion failed");
}
verifyFrequencyMap();
```

## Python Tip

```python
from collections import Counter
def verify_counter():
    c = Counter("abc")
    assert c["a"] == 1, "assertion failed"
verify_counter()
```

## TypeScript Corner

```typescript
function checkInclusion(s1: string, s2: string): boolean {
  if (s1.length > s2.length) return false;
  const need = new Map<string, number>();
  const window = new Map<string, number>();
  for (const char of s1) {
    need.set(char, (need.get(char) || 0) + 1);
  }
  let matched = 0;
  let left = 0;
  for (let right = 0; right < s2.length; right++) {
    const c = s2[right];
    if (need.has(c)) {
      window.set(c, (window.get(c) || 0) + 1);
      if (window.get(c) === need.get(c)) matched++;
    }
    while (right - left + 1 >= s1.length) {
      if (matched === need.size) return true;
      const d = s2[left];
      if (need.has(d)) {
        if (window.get(d) === need.get(d)) matched--;
        window.set(d, window.get(d)! - 1);
      }
      left++;
    }
  }
  return false;
}
if (checkInclusion("ab", "eidbaooo") !== true) throw new Error("assertion failed");
```

## Python Corner

```python
from collections import Counter

def checkInclusion(s1: str, s2: str) -> bool:
    if len(s1) > len(s2):
        return False
    need = Counter(s1)
    window = Counter()
    matched = 0
    left = 0
    for right, c in enumerate(s2):
        if c in need:
            window[c] += 1
            if window[c] == need[c]:
                matched += 1
        while right - left + 1 >= len(s1):
            if matched == len(need):
                return True
            d = s2[left]
            if d in need:
                if window[d] == need[d]:
                    matched -= 1
                window[d] -= 1
            left += 1
    return False

assert checkInclusion("ab", "eidbaooo") == True, "assertion failed"
```

## Takeaway

掌握 Sliding Window 頻率平衡的核心在於動態更新 Hash Map 與匹配計數器，達成 O(n) 的高效能驗證。

## Tomorrow Preview

明天我們將探討 Two Pointers 與 Sliding Window 在無重複字元區間優化上的變體應用，學習如何處理更具挑戰性的動態邊界調整問題。

## Today's Challenge

- **438** · Find All Anagrams in a String 要求在字串中尋找固定長度的字元排列組合，完美對應固定大小滑動視窗與頻率平衡的特性。
  - Hint: 維護一個長度等於 s1 的視窗，每次右移時更新兩端字元的頻率與匹配狀態。
- **76** · Minimum Window Substring 要求尋找包含目標字串所有字元的最小子字串，需要動態擴張與收縮視窗大小來平衡頻率條件。
  - Hint: 當視窗滿足條件時嘗試收縮左邊界以尋找最小長度，並在過程中更新頻率匹配數。
