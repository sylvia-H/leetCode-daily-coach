---
id: stack-next-greater-element-ii
title: Stack Next Greater Element II
module: stack
pattern_label: Circular Monotonic Stack
complexity_label: O(n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能用 modulo 索引模擬環狀陣列的走訪。
  - 能跨越陣列的環狀邊界找出 next greater element。
---
## Concept

Next Greater Element II 把單調堆疊搬上環狀陣列：陣列頭尾相接，每個元素要找的是「沿著環往後看，第一個嚴格更大的值」，尾端元素因此可能繞回開頭找到答案；若整圈都找不到（例如全域最大值），答案記為 -1。核心技巧是邏輯延長——不真的複製一份陣列接在後面，而是讓走訪次數變成 2n，並用 i % n 把虛擬索引摺回合法範圍。為什麼延長一倍就足夠？若某元素的 next greater 存在，從它出發沿環走至多 n - 1 步必然遇到；走第二圈看到的序列與第一圈一模一樣，不會冒出新的候選。所以 2n 的視野已涵蓋所有可能的答案。

## Thinking

採用由右至左的走訪：i 從 2n - 1 遞減到 0，堆疊存候選「值」，由底至頂遞減。每一步令 cur = nums[i % n]，先把堆疊中小於或等於 cur 的值全部彈掉；接著若 i < n，頂端（若存在）就是 ans[i]，堆疊空則保持 -1；最後把 cur 壓入。兩個關鍵論證：其一，被彈掉的候選為何能永久丟棄？對任何更左的位置而言，cur 比那些候選更近、又不比它們小，答案若不是 cur 本身，也只會是比 cur 更大的值，被彈掉的永遠不可能當選。其二，前半段（i ≥ n）在做什麼？它不寫任何答案，只是預熱——先把環狀意義下位於「後方」的候選鋪進堆疊，讓 i < n 的正式作答階段一開始就看得到繞圈後的元素；沒有這個階段，尾端元素會漏掉開頭的候選。以 [1, 2, 1] 為例：唯一的 2 是全域最大值，作答時堆疊被彈空，答案為 -1；兩個 1 的答案都是 2——尾端那個 1 正是靠繞圈才拿到的。對照昨天：每日溫度存索引，因為答案是距離；今天答案是值本身，堆疊直接存值即可。

## Pattern Recognition

題目寫明 circular、頭尾相接，或出現「最後一個元素的下一個更大元素是第一個元素」這類敘述，同時又在問 next greater 或 next smaller，就是環狀單調堆疊。環狀問題有兩個常見策略：實際複製一份串接在後（多花一份記憶體與複製時間），或走訪 2n 次搭配 modulo（免複製）。後者是本課重點，適用於所有「單方向第一個突破者」加上環狀的組合。

## Common Mistakes

第一，i 超過 n - 1 之後忘記取 i % n：Python 直接 IndexError；TypeScript 不會拋錯——比較運算遇到 undefined 一律得到 false，`?? -1` 再把空值吞掉，只會安靜算出錯的答案，比爆掉更難察覺。第二，只走 n 次：尾端元素永遠看不到開頭的候選，環等於白接。第三，彈出條件漏掉等號：頂端與 cur 相等時若不彈，cur 自己的答案會誤指向相等的值，但題目要的是嚴格更大。這和昨天「相等不彈」並不矛盾：兩邊判準都出自同一句「答案必須嚴格更大」，只是掃描方向讓不等號落在不同側——昨天彈的是等待中的舊索引，相等不算它的答案，所以不彈；今天彈的是未來的候選，相等當不了嚴格更大的答案，所以要彈。第四，忘記初始化為 -1 或堆疊空時沒填 -1：全域最大值不存在更大者，這一格必為 -1。順帶一提，若不加 i < n 守門而把每一步都寫進 ans[i % n]，右至左時後半段會覆寫前半段的暫值，結果仍正確；但照本文程式碼的形狀直接寫 ans[i]，TypeScript 會把陣列撐長到 2n、Python 直接 IndexError。守門版更能表達「前半段只是預熱」的語意。

## Complexity

時間 O(n)：迴圈跑 2n 次，每次壓入一個值，總壓入 2n 次；彈出總次數不超過壓入總次數，攤銷後仍是線性。空間 O(n)：堆疊內的值由底至頂嚴格遞減，同一時刻高度至多 n，加上長度 n 的答案陣列。與實際複製陣列相比，邏輯延長省下一次 O(n) 的複製與一份記憶體，複雜度級距不變，換來的是更精簡的程式。

## Digest

環狀 next greater 的解法：走訪 2n 次、用 i % n 摺回索引，模擬陣列接上自己一份。由右至左掃描，堆疊存值、由底至頂遞減：每步先彈掉小於等於 cur 的候選（它們被 cur 擋住，永遠不會是更左元素的答案），i < n 時頂端即為答案，堆疊空則填 -1，最後壓入 cur。前半段 i ≥ n 只負責預熱堆疊，把繞圈後的候選先鋪好。延長一倍就夠，因為 next greater 若存在，沿環至多 n - 1 步內必然遇到，第二圈只是重播。時間 O(n)、空間 O(n)。

## TypeScript Tip

`stack[stack.length - 1]` 在空堆疊時是 `undefined`，配 `?? -1` 正好把「找不到」收斂成題目要的預設值，也順便滿足 `noUncheckedIndexedAccess`。

```typescript
function nextGreaterElements(nums: number[]): number[] {
  const n = nums.length;
  const ans = new Array<number>(n).fill(-1);
  const stack: number[] = []; // 存候選值，由底至頂遞減
  for (let i = 2 * n - 1; i >= 0; i--) {
    const cur = nums[i % n]!;
    while (stack.length > 0 && stack[stack.length - 1]! <= cur) stack.pop();
    if (i < n) ans[i] = stack[stack.length - 1] ?? -1;
    stack.push(cur);
  }
  return ans;
}
const r = nextGreaterElements([1, 2, 1]);
if (r.join(",") !== "2,-1,2") throw new Error("assertion failed");
```

## Python Tip

反向 range 記得第二個參數是「停在它之前」：`range(2 * n - 1, -1, -1)` 才會含 0。負索引 `stack[-1]` 讀頂端。

```python
def next_greater_elements(nums: list[int]) -> list[int]:
    n = len(nums)
    ans = [-1] * n
    stack: list[int] = []  # 存候選值
    for i in range(2 * n - 1, -1, -1):
        cur = nums[i % n]
        while stack and stack[-1] <= cur:
            stack.pop()
        if i < n and stack:
            ans[i] = stack[-1]
        stack.append(cur)
    return ans

assert next_greater_elements([1, 2, 1]) == [2, -1, 2]
```

## Takeaway

環狀 next greater：走 2n 次、i % n 摺回索引，遞減堆疊彈掉小於等於自己的候選，繞完一圈仍無解就是 -1。

## Tomorrow Preview

明天輪到 Online Stock Span：資料一筆一筆進來，要即時回答「含今天在內，連續多少天的價格不高於今天」。同樣的單調堆疊換個問法使用，還要學會在串流情境下壓縮歷史資訊。

## Today's Challenge

- **503** · 教科書等級的環狀 next greater：尾端元素必須繞回開頭找答案，逼你把單調堆疊與 modulo 走訪組合起來。
  - Hint: i 從 2n - 1 走到 0，cur 取 nums[i % n]；彈掉堆疊中小於等於 cur 的值，i < n 時頂端即答案，空則 -1。
