---
id: stack-asteroid-collision
title: Stack Asteroid Collision
module: stack
pattern_label: Collision Resolution
complexity_label: O(n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能模擬目前元素會影響先前已儲存元素的連續交互過程。
  - 能在修改 stack 的同時管理迴圈條件。
---
## Concept

使用 Stack 結構來解決碰撞與消除問題（Collision Resolution）。當序列中的元素會依據方向或條件與前方已儲存的元素發生互動、消除或合併時，Stack 能有效率地維護存活的元素，並在每次進場時處理連鎖反應。

## Thinking

當我們面對像隕石碰撞這類會受到方向性影響且可能產生連鎖反應的問題時，陣列中的每個元素都會對前方的元素造成影響。我們可以使用一個 Stack 來追蹤目前所有存活的元素。當遇到一個會向左移動的新元素時，我們必須檢查 Stack 頂端是否有向右移動的元素，若有則發生碰撞。此時必須比較兩者的大小：較小的元素會被銷毀，若兩者相等則雙雙毀滅。這個消除過程可能是連續的，因此需要一個 while 迴圈持續進行碰撞判定，直到沒有衝突或 Stack 為空為止。

## Pattern Recognition

當題目具有以下特徵時，即可辨識為 Collision Resolution Pattern：1. 元素依序進入處理流程，且可能與之前保留的元素產生交互作用或消除。2. 互動具有方向性或對立性（例如正負號、左右移動、上下夾擊）。3. 單次新元素的加入可能引發多次連鎖反應，銷毀多個先前的元素。

## Common Mistakes

最常見的錯誤是只用一次 if 判斷來處理碰撞，而忽略了碰撞可能會摧毀多個先前的 Stack 元素。由於新元素的體積可能足夠大，它在消滅頂端元素後，還必須繼續和下一個頂端元素碰撞，因此必須使用 while 迴圈來完整模擬連鎖反應。另一個常見錯誤是未妥善處理元素相等時雙雙銷毀的邏輯。

## Complexity

時間複雜度為 O(n)，因為每個元素最多被推入 Stack 一次並被彈出一次。空間複雜度為 O(n)，在最壞情況下（沒有發生任何碰撞）所有元素都會被保留在 Stack 中。

## Digest

本篇探討使用 Stack 解決元素碰撞與連鎖消除問題。核心思維是維護一個存活元素的 Stack，當遇到反向或衝突的新元素時，透過 while 迴圈持續比較並彈出受影響的元素，直到滿足穩定狀態。這種方法能將原本可能需要平方級時間的暴力比對，降低至線性時間 O(n)。學習重點在於正確處理邊界條件、連鎖碰撞以及相等元素的抵銷邏輯。

## TypeScript Tip

```typescript
// TypeScript 提示：利用陣列當作 Stack 時，使用 push 與 pop 操作可以維持 O(1) 的效能。
const stack: number[] = [];
stack.push(1);
const top = stack.pop();
if (top !== 1) throw new Error("assertion failed");
```

## Python Tip

```python
# Python 提示：Python 的 list 原生支援 append 與 pop，非常適合作為 Stack 使用。
stack = []
stack.append(1)
top = stack.pop()
assert top == 1, "assertion failed"
```

## Takeaway

運用 Stack 模擬碰撞時，務必使用 while 迴圈處理連鎖反應，並細心處理元素相等時的雙向銷毀。

## Tomorrow Preview

明天我們將探討 Monotonic Stack 在下一個更大元素問題中的應用，學習如何維持 Stack 的單調性以優化搜尋效率。

## Today's Challenge

- **735** · 隕石依據移動方向相向而行，且單一新隕石可能連續撞毀多個前方隕石，非常適合使用 Stack 來模擬消除過程。
  - Hint: 注意當新隕石小於 0 且 Stack 頂端大於 0 時才會觸發碰撞判定。
