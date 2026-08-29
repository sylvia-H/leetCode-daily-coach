---
id: hash-table-existence-tracking
title: Existence Tracking and Set Membership
module: hash-table
pattern_label: HashSet Membership
complexity_label: O(n) / O(n)
estimated_minutes: 10
exit_criteria:
  - >-
    Can choose between a hash map and a hash set based on whether values need to
    be stored
  - Can detect duplicates during iteration using a set
---
## Concept

Existence Tracking and Set Membership 是一種利用雜湊集合（Hash Set）在常數時間內追蹤元素存在性的演算法策略。當我們只需要確認某個值是否曾經出現過，而不需要儲存額外的鍵值對應關係時，使用 Hash Set 是最有效率的選擇。其底層透過雜湊函數將元素對應到位址，使平均查詢與插入時間複雜度達到 O(1)。

## Thinking

在走訪資料結構的過程中，我們通常會維護一個 Hash Set 來紀錄已經拜訪過的元素。每當遇到一個新元素時，首先檢查它是否已經存在於 Set 中。如果存在，代表我們找到了重複的元素或符合特定條件的區間；如果不存在，則將該元素加入 Set 中，繼續進行下一個元素的疊代。這種方法將原本需要巢狀迴圈進行暴力比對的 O(n^2) 時間複雜度，降低至單次走訪的 O(n)。

## Pattern Recognition

當題目明確詢問「是否存在重複元素」、「某個元素是否在之前出現過」或是「在特定條件或範圍內尋找特定數值」時，即可辨識出應使用 HashSet Membership Pattern。常見的線索包含需要在迴圈中快速查詢歷史狀態，或者需要過濾重複資料。

## Common Mistakes

最常見的錯誤是在只需要確認元素存在與否時，誤用完整的 Hash Map（字典）來儲存不必要的鍵值對，這會造成記憶體空間的浪費。另一個常見錯誤是忘記在走訪過程中即時更新 Set，導致查詢結果無法反映當前的最新狀態。

## Complexity

時間複雜度為 O(n)，因為我們只需要對資料進行一次線性走訪，每次在 Hash Set 中進行查詢與插入的平均時間複雜度為 O(1)。空間複雜度為 O(n)，用以儲存資料結構中的元素。

## Digest

本單元探討了 Existence Tracking and Set Membership 的核心觀念與應用。透過 Hash Set，我們能夠在 O(1) 的時間內完成元素存在性的查詢，將原本需要 O(n^2) 的暴力搜尋優化為 O(n) 的線性時間複雜度。在實作時，應當釐清何時該使用 Hash Set 進行單純的成員測試，而非盲目使用 Hash Map。掌握這個模式後，我們能輕鬆解決諸如尋找重複元素、區間存在性檢查等經典演算法問題。

## TypeScript Tip

```typescript
function checkSetOperations(): void {
  const mySet = new Set<number>([1, 2, 3]);
  const hasTwo = mySet.has(2);
  if (!hasTwo) throw new Error("assertion failed");
  mySet.delete(2);
  if (mySet.has(2)) throw new Error("assertion failed");
}
checkSetOperations();
```

## Python Tip

```python
def check_set_operations() -> None:
    my_set = {1, 2, 3}
    has_two = 2 in my_set
    assert has_two is True, "assertion failed"
    my_set.remove(2)
    assert 2 not in my_set, "assertion failed"

check_set_operations()
```

## Takeaway

當需要快速驗證歷史狀態或偵測重複時，優先使用 HashSet Membership 以確保 O(n) 的高效時間複雜度。

## Tomorrow Preview

明天我們將探討 Two Pointers Pattern，學習如何在排序或未排序陣列中使用左右雙指標來有效率地解決搜尋與配對問題。

## Today's Challenge

- **217** · 題號 217 旨在檢查陣列中是否有任何重複元素，利用 Hash Set 走訪並偵測是否已存在即可在 O(n) 時間內完成。
  - Hint: 邊走訪邊將元素放入 Set 中，若遇到已存在的元素即代表有重複。
- **219** · 題號 219 需要在固定的視窗大小內檢查重複元素，利用 Hash Set 維護視窗內的數值即可高效完成條件判斷。
  - Hint: 當視窗大小超過限制時，記得將超出範圍的舊元素從 Set 中移除。
- **128** · 題號 128 使用 Hash Set 儲存所有數字，藉由 O(1) 的存在性查詢來找出數列中每個連續序列的起點，達成 O(n) 的時間複雜度。
  - Hint: 先將所有數字放入 Set，只從沒有左鄰居（num - 1 不在 Set 中）的數字開始計算連續長度。
