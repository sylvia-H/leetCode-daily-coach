---
id: stack-remove-adjacent-duplicates
title: Stack Remove Adjacent Duplicates
module: stack
pattern_label: Duplicate Elimination
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - Can compare current element with stack top to remove duplicates.
  - Can reconstruct the resulting string from the stack.
---
## Concept

Stack Remove Adjacent Duplicates 是一種透過堆疊資料結構來動態過濾相鄰重複元素的核心演算法技巧。在處理字串或陣列時，當我們需要消除成對或連續出現的相同相鄰元素時，堆疊的後進先出（Last-In, First-Out, LIFO）特性使得我們能夠在單一線性掃描過程中，精確地比對當前元素與前一個尚未被消除的元素。這種方法避免了重複掃描整個序列，能有效維持時間複雜度在線性級別。

## Thinking

在解決此類問題時，直覺的思考方式是維護一個堆疊（在程式實作中通常使用動態陣列或列表）。當我們依序迭代輸入字串的每一個字元時，我們將其與堆疊的頂部（top）元素進行比較。如果堆疊不為空且當前字元與堆疊頂部字元相符，則代表發現了相鄰重複項，此時應將堆疊頂部元素彈出（pop），同時不將當前字元壓入堆疊；如果不相符，則將當前字元壓入堆疊（push）。當整個序列遍歷完成後，堆疊中所剩餘的元素依序組合即為消除相鄰重複項之後的最終結果。

## Pattern Recognition

當題目描述中出現「消除相鄰重複字元」、「消除相鄰相同對」、「消除 K 個連續相鄰重複項」等關鍵字，且操作順序會影響後續相鄰關係時，即應立即聯想到 Stack Remove Adjacent Duplicates Pattern。這類問題的特徵在於元素被消除後，原本不相鄰的元素可能會變成相鄰並產生新的可消除對，而堆疊結構剛好能完美追蹤這種動態的相鄰狀態變化。

## Common Mistakes

常見的錯誤之一是在將堆疊轉換回字串時，忽略了堆疊的 LIFO 順序而導致輸出結果順序顛倒。在大多數語言中，若直接從堆疊底部讀取或未正確處理陣列的左右方向，會產生相反的字串排列。另一個常見錯誤是未先檢查堆疊是否為空就去存取堆疊頂部元素，導致在執行階段發生索引越界或空指標異常。

## Complexity

時間複雜度為 O(n)，其中 n 是輸入字串或陣列的長度。因為每個字元最多被推入堆疊一次並被彈出一次，整體迭代與堆疊操作皆為常數時間。空間複雜度亦為 O(n)，在最壞的情況下（即完全沒有相鄰重複字元可以消除），堆疊將儲存輸入序列中的所有元素。

## Digest

本單元深入探討 Stack Remove Adjacent Duplicates 技巧，學習利用堆疊的 LIFO 特性在 O(n) 時間內動態消除相鄰重複元素。文章詳細說明了從比對堆疊頂部到重建結果的核心思考邏輯、識別此 Pattern 的線索，並點出轉換字串順序時的常見陷阱，幫助讀者在處理字串壓縮與消除類型的題目時建立穩固的架構。

## TypeScript Tip

```typescript
function removeDuplicates(s: string): string {
  const stack: string[] = [];
  for (const char of s) {
    if (stack.length > 0 && stack[stack.length - 1] === char) {
      stack.pop();
    } else {
      stack.push(char);
    }
  }
  const result = stack.join("");
  if (result !== "ca") throw new Error("assertion failed");
  return result;
}
removeDuplicates("abbaca");
```

## Python Tip

```python
def remove_duplicates(s: str) -> str:
    stack = []
    for char in s:
        if stack and stack[-1] == char:
            stack.pop()
        else:
            stack.append(char)
    result = "".join(stack)
    assert result == "ca", "assertion failed"
    return result

remove_duplicates("abbaca")
```

## Takeaway

運用堆疊追蹤相鄰狀態，能在線性時間內完美解決相鄰重複消除問題。

## Tomorrow Preview

明天我們將探討堆疊結構在表達式求值與括號匹配中的進階應用，學習如何處理不同優先級與巢狀結構的運算。

## Today's Challenge

- **1047** · 題目要求移除字串中相鄰且相同的兩個字元，且消除後可能產生新的相鄰重複項，完全符合 Stack Remove Adjacent Duplicates 的 LIFO 消除特性。
  - Hint: 使用陣列作為堆疊，遍歷字元時檢查堆疊頂端是否與當前字元相同。
- **1209** · 題目要求刪除 k 個相鄰且相同的字元，是相鄰重複消除 Pattern 的計數擴充版本，堆疊中需要同時記錄字元與其連續出現的次數。
  - Hint: 在堆疊中儲存包含字元與計數的物件或陣列，當計數達到 k 時執行彈出操作。
