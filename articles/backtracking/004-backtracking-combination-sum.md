---
id: backtracking-combination-sum
title: Backtracking Combination Sum
module: backtracking
pattern_label: Reusable Elements Sum Pattern
complexity_label: O(2^(t/min)) / O(t/min)
estimated_minutes: 20
exit_criteria:
  - 能在遞迴過程中管理目標值的扣減。
  - 能把當前索引原樣傳回遞迴呼叫，以允許元素重複使用。
---
## Concept

Backtracking Combination Sum 屬於組合問題的延伸，核心在於處理元素可以被「無限次重複使用」以達到特定目標總和（Target Sum）的情境。在一般的組合或子集問題中，為了避免重複排列，我們在遞迴時通常會將索引加一（i + 1）；然而，在此 Pattern 中，由於允許重複選取同一個元素，我們在向下遞迴時會將當前索引（i）原封不動地傳遞下去，並在每次選擇時從目標值中扣除該元素的大小。

## Thinking

當我們著手處理這類問題時，思考的起點在於決策樹（Decision Tree）的建立。對於候選陣列中的每一個元素，我們都有兩種主要選擇：第一，選擇該元素並繼續在同一個或後續元素中進行組合（允許重複使用）；第二，跳過該元素，考慮下一個不同的元素以尋找其他組合。在寫程式時，我們通常會維護一個暫時的路徑陣列（Path）來記錄目前的選擇。當剩餘的目標值（Target）歸零時，代表我們找到了一組有效解，應将其加入結果集中。若剩餘目標值小於零，則代表目前的遞迴路徑超過了目標，應立即進行剪枝（Pruning）以節省計算資源。

## Pattern Recognition

辨識此 Pattern 的關鍵線索在於題目的敘述中是否明確指出「元素可以被使用無限次」或「同一個數字可以被重複選取」，且最終目標是找出所有相加等於特定目標值的組合（Combinations）。若題目要求的結果是不重複的組合，且候選陣列包含正整數，通常這就是典型的 Reusable Elements Sum Pattern。透過將遞迴指針維持在當前位置而非推進到下一個位置，即可實現元素的重複選取。

## Common Mistakes

最常見的錯誤是未能正確處理遞迴的終止條件，導致程式進入無窮迴合或引發 Stack Overflow。另一個常見問題是忘記在剩餘目標值小於零時進行早期剪枝（Early Pruning），這會導致遞迴深度過深、運算時間複雜度暴增。此外，如果在組合過程中沒有妥善排序候選陣列，或是在遞迴傳遞索引時寫成了 i + 1，將會導致無法重複選取元素，進而漏掉正確的解答。

## Complexity

時間空間複雜度分析：時間複雜度在最壞情況下為 O(2^(t/min))，其中 t 代表目標值（Target），min 代表候選陣列中的最小值。這是因為每個元素都可以被重複選取直到目標達成，產生類似二元或多元的決策樹。空間複雜度為 O(t/min)，主要取決於遞迴呼叫堆疊的最大深度以及儲存當前路徑所需的記憶體空間。

## Digest

Backtracking Combination Sum 核心在於允許元素重複選取。透過傳遞當前索引 i 而非 i + 1，遞迴能夠再次使用相同的數字。必須注意 target < 0 的剪枝條件，以防無窮遞迴。

## TypeScript Tip

```typescript
// TypeScript 效能優化建議：先排序再剪枝
function optimizedSum(candidates: number[], target: number): number[][] {
  const res: number[][] = [];
  candidates.sort((a, b) => a - b);
  
  const dfs = (idx: number, rem: number, path: number[]) => {
    if (rem === 0) {
      res.push([...path]);
      return;
    }
    for (let i = idx; i < candidates.length; i++) {
      if (candidates[i] > rem) break; // 提前中斷迴圈
      path.push(candidates[i]);
      dfs(i, rem - candidates[i], path);
      path.pop();
    }
  };
  
  dfs(0, target, []);
  return res;
}
if (optimizedSum([2], 1).length !== 0) throw new Error("assertion failed");
```

## Python Tip

```python
# Python 效能優化建議：利用排序與條件判斷進行早退（Early Exit）
def optimized_sum(candidates: list[int], target: int) -> list[list[int]]:
    res = []
    candidates.sort()
    
    def dfs(idx: int, rem: int, path: list[int]):
        if rem == 0:
            res.append(list(path))
            return
        for i in range(idx, len(candidates)):
            if candidates[i] > rem:
                break
            path.append(candidates[i])
            dfs(i, rem - candidates[i], path)
            path.pop()
            
    dfs(0, target, [])
    return res

assert len(optimized_sum([2], 1)) == 0, "assertion failed"
```

## Takeaway

掌握 Backtracking 時的索引傳遞（i 而非 i + 1）與 target 扣減剪枝，是解決元素無限重複選取組合題目的核心關鍵。

## Tomorrow Preview

明天我們將探討 Combination Sum 系列的延伸題型，重點在於限制每個元素只能使用一次且組合不能重複的處理方式。

## Today's Challenge

- **39** · 此題為 Reusable Elements Sum Pattern 的標準範本，候選陣列中的數字可以被無限次選取以達到目標值。
  - Hint: 在遞迴呼叫時傳入當前索引 i 以允許重複選取，並在剩餘目標值小於零時終止遞迴。
