---
id: loop-invariant-thinking
title: Loop Invariant Thinking
module: programming-mindset
pattern_label: Invariant
complexity_label: O(n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能說明迴圈開始前、執行中、結束後維持不變的性質
---
## Concept

Loop Invariant Thinking（迴圈不變量思考）是設計與證明迴圈正確性的核心方法。所謂「不變量」（Invariant），是一段在迴圈開始前、每一次迭代的前後、以及迴圈結束後都保持為真的性質。它的威力在於：你不必追蹤每一輪的執行細節，只要確認這個性質從頭到尾沒被破壞，就能嚴格論證整個迴圈是對的。這套論證與數學歸納法同構——初始化對應「基底成立」，維持性對應「若這一步成立則下一步也成立」，最後結合終止條件收割結論。舉個最小的例子：在陣列中找最大值時，不變量是「max 永遠等於已看過區間的最大值」。進入迴圈前只看過第一個元素，性質顯然成立；每一輪把新元素與 max 比較後更新，性質對更大的區間重新成立；迴圈結束時「已看過區間」就是整個陣列，答案自動正確。

## Thinking

面對需要反覆處理資料的問題，不要憑直覺寫出 `while` 或 `for` 再靠測試反覆修補。正確流程是先用一句話寫下不變量，再依四個支柱逐一檢查。第一，初始化（Initialization）：進入迴圈前，不變量是否已經成立？這決定變數初始值該怎麼設。第二，維持性（Maintenance）：假設某輪開始前成立，主體執行完後，它是否在下一輪開始前重新成立？這決定主體內每一行更新的內容與順序。第三，終止性（Termination）：迴圈停下來時，不變量加上終止條件能否直接推出你要的答案？第四，進展（Progress）：每一輪是否確實朝終止條件推進？不變量保證「不出錯」，進展才保證「會結束」，兩者缺一不可。

## Pattern Recognition

當你需要設計複雜的迴圈或指標移動——雙指標向內收斂、區間逐步縮減、原地搬移元素、排序演算法的分割步驟——就是套用 Invariant Pattern 的時機。另一個明確訊號是：你常分不清邊界該用 `<` 還是 `<=`、指標該從 0 還是 1 起步、或反覆寫出 Off-by-one Error。這些困惑的根源都是沒有先寫下區間定義。只要明確寫出「左閉右開區間 `[0, i)` 已處理完畢」這類敘述，邊界符號與初始值就不再靠猜測，而是由定義直接推導出來的必然結果。

## Common Mistakes

第一，忽略初始狀態：變數初始值與不變量不合，迴圈第一輪就建立在錯誤假設上。第二，主體更新破壞不變量：例如先移動指標再使用它，讓性質描述的區間與實際狀態錯位。第三，混淆半開區間與閉區間：同一個 `right`，在 `[left, right)` 與 `[left, right]` 兩種定義下的合法操作完全不同，混用就會漏掉最後一個元素或發生越界（Index Out of Bounds）。第四，只顧維持不變量卻忘了進展：每一輪都正確、卻沒有任何變數朝終止條件靠近，就成了無限迴圈（Infinite Loop）。這些錯誤的共同根源，是動筆寫程式碼前沒有先用一句話講清楚「每一輪前後必須成立的事」。

## Complexity

O(n) / O(1)。要小心區分：進展支柱保證的是迴圈會終止，並不保證線性——是「每一輪固定推進一步」這個更強的條件，才讓找最大值這類線性走訪落在 O(n)。空間上，不變量本身只是論證工具，通常只需常數個指標或狀態變數來維持；實際複雜度仍由你設計的演算法本身決定。

## Digest

迴圈不變量是「每一輪前後都保持為真的性質」，論證方式與數學歸納法同構：初始化立基底、維持性推每一步、終止時結合結束條件得出答案，再用進展保證迴圈會停。先寫下不變量與區間定義，`<` 或 `<=`、初始值怎麼設，都會變成可推導的結論而非反覆試錯的猜測。例如找最大值時，不變量就是「max 等於已看過區間的最大值」——終止時區間涵蓋整個陣列，答案自動正確。

## TypeScript Tip

用明確的變數命名與註解把不變量寫進程式碼，讓區間定義一目了然：

```typescript
function findMax(nums: number[]): number {
  if (nums.length === 0) throw new Error("empty array");
  let max = nums[0]!;
  // Invariant: 進入第 i 輪前，max 等於 nums[0..i-1] 的最大值
  for (let i = 1; i < nums.length; i++) {
    const v = nums[i]!;
    if (v > max) max = v; // 比較後，不變量對 nums[0..i] 重新成立
  }
  return max;
}
if (findMax([3, 9, 4]) !== 9) throw new Error("assertion failed");
if (findMax([7]) !== 7) throw new Error("assertion failed");
```

`noUncheckedIndexedAccess` 下索引存取需用 `!` 或 `?? 0` 收斂型別——這也在提醒你論證「這個索引一定合法嗎」。

## Python Tip

`range(n)` 是左閉右開區間 `[0, n)`，恰好對應「已處理 `[0, i)`」這種不變量寫法：

```python
def running_sum(nums: list[int]) -> list[int]:
    total, out = 0, []
    # Invariant: 每輪開始時 total == sum(nums[:i])
    for i in range(len(nums)):
        total += nums[i]
        out.append(total)
    return out

assert running_sum([1, 2, 3]) == [1, 3, 6]
assert running_sum([]) == []
```

空輸入時 `range(0)` 一輪都不跑，初始化的正確性直接成為最終答案。

## Takeaway

先用一句話寫下不變量，讓初始值、更新邏輯與邊界符號都由它推導出來，迴圈就不再靠試錯。

## Tomorrow Preview

明天課程沿兩條路線前進：一條是 Problem Simplification Strategy，學習把抽象問題縮成長度 1 或 2 的極小案例來找規律；另一條進入 Array 的 Linear Scan，把今天的不變量直接應用在最基本的線性走訪上。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透，並替你最近寫過的一個迴圈補上一句不變量敘述。
