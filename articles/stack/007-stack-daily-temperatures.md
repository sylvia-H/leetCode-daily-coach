---
id: stack-daily-temperatures
title: Stack Daily Temperatures
module: stack
pattern_label: Monotonic Stack (Next Greater Element)
complexity_label: O(n) / O(n)
estimated_minutes: 25
exit_criteria:
  - 能在 stack 中儲存索引，同時維持對應值的遞減順序。
  - 能在遇到更大的元素時，結算尚待處理的索引。
---
## Concept

Monotonic Stack（單調堆疊）不是一種新的資料結構，而是一種使用慣例：讓堆疊內元素恆保持單調順序。本課用的是「由底至頂對應溫度遞減」的堆疊，專門解決一類問題——對陣列中每個元素，找出它右側第一個嚴格更大的元素。以每日溫度為例：對每一天，要回答「還要等幾天才會出現更高溫」。暴力解是每一天都向右掃到底，最壞 O(n^2)。單調堆疊的關鍵洞察是：一個還沒等到更高溫的日子，不需要被反覆重新掃描——把它的索引留在堆疊裡，等未來某天溫度真的超過它時，一次結算。每個索引至多入堆疊一次、出堆疊一次，總工作量因此壓在 O(n)。

## Thinking

從左至右掃描，堆疊裡放的是「尚未找到答案」的日子的索引。處理第 i 天時：只要堆疊頂端的索引 j 對應的溫度嚴格低於第 i 天，就把 j 彈出並結算 ans[j] = i - j；重複到頂端溫度不低於當天、或堆疊已空，再把 i 壓入。這個做法為什麼是對的？彈出的瞬間，憑什麼說 i 是 j 右側「第一個」更高溫？用反證：若 j 與 i 之間存在某天 k 的溫度高於第 j 天，那麼掃描到 k 時 j 就會被彈出，不可能留到現在。所以 j 還在堆疊裡，正代表中間每一天都不比它熱，i 就是第一個突破者。同樣的推理給出迴圈不變式：任何時刻，堆疊由底至頂的對應溫度遞減（允許相等）——因為每個新索引壓入前，所有比它低溫的索引都已被彈掉。這條不變式保證「只跟頂端比較」就足夠，不必檢查堆疊深處。拿 [73, 74, 75, 71, 69, 72, 76, 73] 走一遍最有感：71、69 接連壓入等待；72 出現時一口氣結算 69（等 1 天）與 71（等 2 天）；76 再清掉 72 與 75；最後 76 與 73 等不到更高溫，答案維持 0。

## Pattern Recognition

三個訊號指向這個 pattern：題目在問「下一個更大（或更小）」的元素；答案與位置或距離有關；暴力解需要雙重迴圈。只要每個元素只關心「單一方向上第一個突破某種大小關係的元素」，單調堆疊幾乎就是標準解，包括 next smaller、往左找，以及之後會遇到的環狀變形。反例辨識：若題目要的是任意區間的最值、或排序後的大小關係，那是別的工具，不要硬套。

## Common Mistakes

第一，存溫度值而不是索引：比較大小沒問題，但彈出時算不出天數差。判準很簡單——答案跟距離或位置有關，就存索引。第二，把彈出條件寫成「大於等於」：相等的溫度不是「更高」，提前彈出會讓答案指向溫度相同的那天。第三，用 if 取代 while：一個新高溫可能同時是多個舊日子的答案，只彈一次會漏算其餘的。第四，迴圈結束後畫蛇添足：殘留在堆疊裡的索引右側沒有更高溫，依題意答案就是 0，把答案陣列初始化為 0 即可，不需要再補一輪處理。

## Complexity

時間 O(n)：雖然迴圈裡套著 while，但彈出總次數受壓入總次數限制——每個索引至多壓入一次、彈出一次，攤銷後整體是線性。空間 O(n)：最壞情況是溫度嚴格遞減，全程沒有任何彈出，n 個索引全部留在堆疊中。

## Digest

單調堆疊解「下一個更高溫」：從左至右掃描，堆疊存「尚未結算」日子的索引，由底至頂對應溫度遞減（允許相等）。第 i 天溫度嚴格高於頂端索引 j 的溫度時，彈出並結算 ans[j] = i - j，用 while 連續彈到條件不成立，再壓入 i。正確性來自反證——j 若中途遇過更高溫早就被彈出，所以彈出當下 i 必是 j 右側第一個更高溫。掃描結束後殘留的索引等不到更高溫，答案保持 0。每個索引至多進出堆疊一次，時間 O(n)、空間最壞 O(n)。記住三件事：存索引不存值、嚴格大於才彈、用 while 不用 if。

## TypeScript Tip

堆疊存索引，用 `stack[stack.length - 1]` 讀頂端。專案開了 `noUncheckedIndexedAccess`，索引存取會得到 `T | undefined`，在邏輯已保證非空之處用 `!` 收斂型別。

```typescript
function dailyTemperatures(t: number[]): number[] {
  const ans = new Array<number>(t.length).fill(0);
  const stack: number[] = []; // 存索引，對應溫度由底至頂遞減
  for (let i = 0; i < t.length; i++) {
    while (stack.length > 0 && t[stack[stack.length - 1]!]! < t[i]!) {
      const j = stack.pop()!;
      ans[j] = i - j;
    }
    stack.push(i);
  }
  return ans;
}
const r = dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]);
if (r.join(",") !== "1,1,4,2,1,1,0,0") throw new Error("assertion failed");
const r2 = dailyTemperatures([75, 75, 76]); // 相等不彈：<= 版會誤得 [1,1,0]
if (r2.join(",") !== "2,1,0") throw new Error("assertion failed");
```

## Python Tip

list 即堆疊：`append` 壓入、`pop` 彈出、`stack[-1]` 讀頂端。`while stack and ...` 一行同時處理「堆疊非空」與彈出條件。

```python
def daily_temperatures(t: list[int]) -> list[int]:
    ans = [0] * len(t)
    stack: list[int] = []  # 存索引
    for i, cur in enumerate(t):
        while stack and t[stack[-1]] < cur:
            j = stack.pop()
            ans[j] = i - j
        stack.append(i)
    return ans

assert daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73]) == [1, 1, 4, 2, 1, 1, 0, 0]
assert daily_temperatures([75, 75, 76]) == [2, 1, 0]  # 相等不彈
```

## Takeaway

單調遞減堆疊存索引：嚴格更高溫出現才彈出結算距離，每個索引至多進出一次，O(n) 解決 next greater。

## Tomorrow Preview

明天把同一招搬上環狀陣列：Next Greater Element II 中尾端元素的答案可能繞回陣列開頭，我們將學會用兩倍長度的走訪搭配 modulo 索引，讓單調堆疊跨越頭尾邊界。

## Today's Challenge

- **739** · 對每一天求「距離下一個更高溫還要幾天」，是 next greater element 加上距離計算的原型題，存索引與遞減堆疊缺一不可。
  - Hint: 堆疊存索引；當天溫度嚴格大於頂端索引的溫度時彈出 j，答案為 i - j；掃描結束後殘留的索引答案為 0。
