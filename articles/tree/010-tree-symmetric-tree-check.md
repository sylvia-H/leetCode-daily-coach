---
id: tree-symmetric-tree-check
title: Symmetric Tree Check
module: tree
pattern_label: Mirror Image DFS
complexity_label: O(n) / O(h)
estimated_minutes: 20
exit_criteria:
  - 'Compare left subtree''s left with right subtree''s right, and left with right.'
---
## Concept

Symmetric Tree Check 核心觀念在於驗證一個二元樹是否為其自身的鏡像。這意味著根節點的左子樹必須與右子樹呈鏡像對稱，包含節點數值相等以及結構相對反轉。

## Thinking

思考對稱性時，單一指標往往不足，因為我們需要同時比較兩個相對位置的節點。因此，設計一個接受兩個參數的遞迴輔助函數是標準作法。該函數同時走訪兩個節點，檢查它們的值是否相等，並將左節點的左子樹與右節點的右子樹進行配對，同時將左節點的右子樹與右節點的左子樹進行交叉配對。

## Pattern Recognition

當題目要求驗證某個資料結構、樹狀結構或字串是否以中心軸呈左右對稱、迴文或鏡像反射時，即可辨識為 Mirror Image DFS Pattern。

## Common Mistakes

最常見的錯誤是沿用一般樹狀走訪的思維，去比較左子樹的左子樹與右子樹的左子樹（即同側比較），而忽略了鏡像反射需要進行交叉比較（左對右、右對左）。

## Complexity

時間複雜度為 O(n)，其中 n 為樹中的節點總數，因為每個節點最多被訪問一次。空間複雜度為 O(h)，其中 h 為樹的高度，代表遞迴呼叫堆疊的最大深度。

## Digest

本單元探討 Symmetric Tree 檢查。核心在於使用 Mirror Image DFS 比較左右子樹的對稱性。遞迴函數必須同時接收兩個節點進行交叉比對。

## TypeScript Tip

TS 中注意節點型別與 null 檢查。
```typescript
function check(a: number | null, b: number | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  const ok = a === b;
  if (!ok) throw new Error("mismatch");
  return ok;
}
check(10, 10);
```

## Python Tip

Python 中可利用巢狀函數封裝對稱邏輯。
```python
def check(a: int | None, b: int | None) -> bool:
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    ok = (a == b)
    assert ok, "mismatch"
    return ok
check(10, 10)
```

## Takeaway

對稱樹檢查的關鍵在於交叉比較左右子樹，透過雙指標遞迴確保結構與數值完全鏡像。

## Tomorrow Preview

明天我們將探討 Binary Tree Level Order Traversal，學習如何使用 BFS 逐層走訪樹狀結構。

## Today's Challenge

- **101** · 此題直接要求判斷二元樹是否為自身的鏡像，完全對應 Mirror Image DFS Pattern 的雙指標交叉比較核心邏輯。
  - Hint: 編寫一個輔助函數接收左節點與右節點，同時遞迴檢查左的左與右的右、左的右與右的左。
