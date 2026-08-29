---
id: dp-linear-robber-pattern
title: Linear House Robber Pattern
module: dynamic-programming
pattern_label: Choice Selection
complexity_label: O(n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能夠列出包含取與不取當前元素的狀態轉移方程式
  - 能夠處理邊界條件如陣列長度為 1 或 2 的情況
---
## Concept

Linear House Robber Pattern 是一種核心的動態規劃策略，專門用於解決在無法選擇相鄰元素的情況下尋求最佳總和的問題。每一步的決策都在於評估『選擇當前元素並累加跳過相鄰元素的先前結果』與『跳過當前元素並保留前一個元素的最佳總和』兩者之間的取捨。透過維護狀態轉移，能夠以線性時間複雜度有效求解。

## Thinking

在建構狀態轉移方程式時，我們定義 dp[i] 代表考慮到第 i 個元素時能夠獲得的最大累計總和。當我們處於位置 i 時，面臨兩種互斥的選擇：第一種是選擇偷取當前房屋的價值 nums[i]，此時我們不能選擇相鄰的前一個房屋 i-1，因此總和為 dp[i-2] + nums[i]；第二種是選擇不偷取當前房屋，此時總和為前一個房屋的最佳結果 dp[i-1]。結合這兩種選擇，我們得到核心的狀態轉移方程式：dp[i] = max(dp[i-1], dp[i-2] + nums[i])。

## Pattern Recognition

當題目明確指出不能選擇相鄰的元素（例如連續索引不能同時被選取），且要求找出最大總和或最佳效益時，即可辨識出此 Pattern。常見的特徵包含具有一維陣列結構的序列資料，且每個元素帶有正數權重或代價，要求在特定約束條件下進行最佳化選擇。

## Common Mistakes

最常見的錯誤是在處理邊界條件時未考慮陣列長度小於 2 的情況，導致直接存取索引 i-2 時引發陣列越界或未定義的錯誤。另一個常見迷思是嘗試記錄具體的選擇路徑，但實際上此 Pattern 的動態規劃本質僅需關注最大數值的遞推，無需保存完整的組合狀態。

## Complexity

O(n) / O(1)

## Digest

Linear House Robber Pattern 透過動態規劃解決相鄰互斥的最佳化問題。核心精神在於每個元素面臨『選或不選』的抉擇：若選擇當前元素則必須加上跳過相鄰元素的歷史總和；若不選則繼承前一步的總和。利用狀態壓縮技巧，我們僅需常數級別的空間複雜度即可完成整體運算，是掌握一維動態規劃的重要基石。

## TypeScript Tip

```typescript
function robOptimized(nums: number[]): number {
  let rob1 = 0;
  let rob2 = 0;
  for (const n of nums) {
    const temp = Math.max(n + rob1, rob2);
    rob1 = rob2;
    rob2 = temp;
  }
  if (rob2 < 0) throw new Error("assertion failed");
  return rob2;
}
const res = robOptimized([2, 7, 9, 3, 1]);
if (res !== 12) throw new Error("assertion failed");
```

## Python Tip

```python
def rob_optimized(nums: list[int]) -> int:
    rob1, rob2 = 0, 0
    for n in nums:
        temp = max(n + rob1, rob2)
        rob1 = rob2
        rob2 = temp
    assert rob2 >= 0, "assertion failed"
    return rob2

res = rob_optimized([2, 7, 9, 3, 1])
assert res == 12, "assertion failed"
```

## Takeaway

掌握動態規劃的狀態轉移方程式與空間優化技巧，透過記錄前兩步的數值即可在 O(n) 時間與 O(1) 空間內解決相鄰約束的最佳化問題。

## Tomorrow Preview

明天我們將探討環形結構下的 House Robber 變體，學習如何將環形限制拆解為多次線性問題來求解。

## Today's Challenge

- **198** · 這是最經典的線性打家劫舍問題，完美對應相鄰不可同時選取的限制與最大總和求取需求。
  - Hint: 注意處理陣列長度小於 2 的邊界情況。
- **213** · 此題將房屋排成環狀，首尾相連，可透過將問題拆解為兩次線性打家劫舍來解決。
  - Hint: 分別計算不包含最後一個元素與不包含第一個元素的線性結果，取兩者最大值。
