---
id: tree-balanced-binary-tree-check
title: Balanced Binary Tree Check
module: tree
pattern_label: Bottom-Up Validation
complexity_label: O(n) / O(h)
estimated_minutes: 25
exit_criteria:
  - 能及早偵測不平衡並將失敗向上傳遞，不做多餘的高度計算。
---
## Concept

Balanced Binary Tree Check 旨在驗證一棵二元樹是否為高度平衡二元樹（Height-Balanced Binary Tree）。所謂高度平衡，定義為任一節點的左右子樹高度差絕對值不超過 1，且其左右子樹本身也必須是高度平衡二元樹。在資料結構的操作中，這類驗證若採用最直覺的 Top-Down 遞迴，會因為重複計算節點高度而導致效能劣化。因此，本單元探討的 Bottom-Up Validation（由底而上驗證）核心概念在於：在遞迴計算子樹高度的同時，一併檢核平衡狀態，若發現不平衡則立即向外傳遞失敗訊號，從而將整體時間複雜度優化至線性等級。

## Thinking

在思考 Balanced Binary Tree Check 的解法時，必須避免將「計算樹的高度」與「檢查平衡狀態」拆開為兩個獨立的遞迴函式。如果對每個節點都呼叫一次高度計算函式，再檢查左右子樹高度差，最差情況下的時間複雜度會退化至 O(n^2)。正確的思維是採用 Bottom-Up 策略：設計一個遞迴輔助函式，讓它同時回傳兩個關鍵資訊——該子樹是否平衡，以及該子樹的實際高度。如果在遞迴過程中發現某個子樹不平衡，則無需繼續計算其餘高度，直接回傳一個特殊的錯誤標記（例如 -1 或狀態旗標），將失敗訊息一路向上傳遞，達成早期終止（Early Exit）的效果。

## Pattern Recognition

當題目要求驗證整棵樹或所有子樹是否滿足某項性質（如高度差、區間範圍、對稱性等），且該性質依賴於子樹的量化指標（如高度、總和、最大最小值）時，若直接對每個節點獨立計算指標會造成重複運算，這便是 Bottom-Up Validation 樣式的強烈訊號。此 Pattern 的特徵是：遞迴函式不只回傳單一布林值或單一數值，而是將「狀態是否合法」與「計算指標」結合成單一回傳值，利用合併的回傳結構在單次走訪（Post-order Traversal）中同時完成資料收集與條件驗證。

## Common Mistakes

最常見的錯誤是使用 Top-Down 的思維，寫出一個獨立的 height() 函式，然後在主函式中寫出 `if (Math.abs(height(left) - height(right)) > 1) return false;` 並遞迴檢查整棵樹。這種寫法會導致許多節點的高度被重複計算多次，當樹的結構偏向鏈結串列時，效能會直接惡化為 O(n^2)。另一個常見錯誤是在回傳錯誤狀態時，使用容易混淆的 sentinel value（例如用 0 代表高度為 0 同時也代表錯誤），導致無法正確區分「高度為 0 的合法葉節點」與「發生不平衡的錯誤狀態」。

## Complexity

時間複雜度為 O(n)，因為我們僅對二元樹進行了一次後序走訪（Post-order Traversal），每個節點只被造訪並處理一次。空間複雜度為 O(h)，其中 h 為樹的高度；在最壞情況下（如偏斜樹），遞迴呼叫堆疊（Call Stack）的深度會達到 n，因此空間複雜度為 O(n)；在完全二元樹的情況下，空間複雜度則為 O(log n)。

## Digest

本單元深入探討了 Balanced Binary Tree Check 的核心架構與最佳化思維。透過 Bottom-Up Validation 樣式，我們學會了如何在單次後序走訪中同時計算子樹高度並檢核平衡狀態，徹底擺脫了 Top-Down 寫法產生的 O(n^2) 效能陷阱。在 TypeScript 實作中，我們利用 sentinel value（如 -1）作為錯誤狀態的載體，達到早期終止的優化效果；而在 Python 實作中，則善用了 Tuple 回傳機制來清晰分離布林狀態與高度數值。掌握這種雙重回傳的遞迴設計，是解決各類樹狀性質驗證題目的關鍵能力。

## TypeScript Tip

在 TypeScript 中編寫遞迴函式時，若需要回傳多重狀態，使用 sentinel value（如 -1）可以避免建立額外物件所帶來的記憶體配置開銷。然而，務必確保 sentinel value 不會與正常業務邏輯產生的數值衝突。以下展示一個簡單的型別與輔助檢查驗證片段。

```typescript
function validateHelper(node: { left: any; right: any } | null): number {
  if (!node) return 0;
  return 1;
}
if (validateHelper(null) !== 0) throw new Error("TypeScript tip assertion failed");
```

## Python Tip

Python 的 Tuple 展開賦值（例如 `is_bal, h = helper(node.left)`）不僅可讀性極高，且在效能上非常輕量。善用 Python 的短路求值與明確的型別提示（如 `tuple[bool, int]`），能夠讓遞迴狀態傳播的程式碼既安全又容易維護。以下為一個簡單的狀態解構測試片段。

```python
def get_status() -> tuple[bool, int]:
    return True, 5

status, height = get_status()
assert status is True and height == 5, "Python tip assertion failed"
```

## Takeaway

Bottom-Up Validation 的精髓在於結合高度計算與平衡檢查，以 O(n) 時間一次搞定。善用錯誤訊號向上傳遞，徹底告別低效的 O(n^2) 重複運算。

## Tomorrow Preview

明日課程將進入二元樹結構變形與建構的領域，探討如何利用前序與中序走訪的陣列結果重建唯一的一棵二元樹。我們將剖析分治法（Divide and Conquer）在樹狀結構重建中的應用，並學習如何透過雜湊表優化尋找根節點索引的時間開銷。

## Today's Challenge

- **110** · 本題要求檢驗整棵二元樹是否為高度平衡，完美對應 Bottom-Up Validation 樣式，透過在走訪同時回傳高度與狀態來避免 O(n^2) 的重複計算。
  - Hint: 設計一個遞迴函式，若子樹平衡則回傳其實際高度，若不平衡則回傳 -1 作為終止訊號。
