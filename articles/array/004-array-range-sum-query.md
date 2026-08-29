---
id: array-range-sum-query
title: Range Sum Query Using Prefix Sum
module: array
pattern_label: Prefix Sum Query
complexity_label: O(1) per query / O(n)
estimated_minutes: 15
exit_criteria:
  - '能正確寫出區間 [L, R] 總和公式 P[R] - P[L-1]'
  - 能處理 L = 0 時的邊界情況
---
## Concept

Range Sum Query 處理的場景是：一個不會變動的陣列，配上大量的區間總和查詢。若每次查詢都重新走訪區間，總成本是 O(M * N)（M 為查詢次數、N 為陣列長度），查詢一多，這個乘積就成為效能瓶頸。解法是把昨天學的前綴和轉成查詢介面：初始化時花 O(N) 建好前綴和陣列 P，之後任意區間 [L, R] 的總和都由 P[R] - P[L-1] 在 O(1) 內得出。

它的正確性來自差分抵銷：P[R] 是 A[0..R] 的總和，P[L-1] 是 A[0..L-1] 的總和，相減後共同的前段完全消去，留下的恰是 A[L..R]。之所以扣的是 P[L-1] 而不是 P[L]，是因為被扣掉的部分必須「剛好停在 L 的前一格」——多扣一格就會吃掉區間最左邊的元素。

## Thinking

先面對邊界：當 L = 0 時，公式退化成 P[R] - P[-1]。P[-1] 在語意上是「空前綴的和」，值為 0，所以此時直接回傳 P[R]。寫成一個 if 分支當然可行，但更漂亮的做法是改用補零式前綴和：讓 P 比原陣列多一格，P[0] = 0、P[k] 存放前 k 個元素的總和。查詢公式因此統一成 query(L, R) = P[R+1] - P[L]——當 L = 0 時扣掉的正是 P[0] = 0，分支自然消失。兩種寫法在數學上完全等價，補零式只是把「空前綴的和是 0」這件事實體化成陣列的第一格，讓所有查詢走同一條路徑；少一個分支，就少一個出錯的位置。

把整件事封裝成類別（class）也順理成章：建構子做一次 O(N) 預處理，查詢方法只做兩次讀取與一次減法，前綴和陣列作為內部狀態被封裝起來，讓多次查詢共享同一份預處理成果。

## Pattern Recognition

三個辨識條件。第一，靜態陣列：查詢期間資料不變，前綴和才不會失效；若題目允許頻繁的單點更新，就該換 Fenwick Tree（Binary Indexed Tree）或 Segment Tree，它們把更新與查詢平衡在各 O(log n)。第二，大量區間查詢：immutable 加上多次 query 的組合，幾乎就是在點名前綴和。第三，查詢的運算可差分：加法、XOR 有反運算所以可以；max 與 min 合併後丟失資訊，無法用兩個前綴相減還原區間。

## Common Mistakes

- L = 0 未特判：對齊式公式直接代入會存取 P[-1]。TypeScript 讀 p[-1] 拿到 undefined，一路算出 NaN；Python 更危險——負索引合法，p[-1] 會安靜地拿到陣列最後一個元素，結果錯了也不丟例外。
- 兩種慣例的公式混用：補零式多了一格之後，公式是 P[R+1] - P[L]，不是 P[R] - P[L-1]；把對齊式與補零式的索引位移搞混，是本課最常見的 off-by-one 來源。建議在程式裡註明採用哪種慣例，並用一兩筆小例子驗算。
- 把建表寫進查詢函式：每次查詢都重建前綴和，O(1) 查詢退化回 O(N)，預處理形同虛設。建表只該發生一次，放在建構子。

## Complexity

前處理 O(N) 時間、O(N) 空間建立前綴和陣列；每次查詢 O(1) 時間、O(1) 額外空間。M 次查詢總成本 O(N + M)，對比暴力法的 O(N * M)，查詢次數越多優勢越大。

## Digest

靜態陣列加上大量區間和查詢，就用前綴和查詢介面。補零式前綴和讓 P[0] = 0、P[k] 為前 k 個元素之和，查詢公式統一為 query(L, R) = P[R+1] - P[L]，L = 0 的邊界分支自然消失。正確性來自差分抵銷：兩個前綴相減，重疊的前段互相消去，留下目標區間。建構子中一次 O(N) 預處理，之後每次查詢 O(1)。若資料會頻繁更新，前綴和整段失效，需改用 Fenwick Tree 或 Segment Tree。

## TypeScript Tip

在建構子中一次完成預處理；用累加變數搭配 push 建補零陣列，可同時避開 noUncheckedIndexedAccess 下「自己讀自己」的型別收斂問題。

```typescript
class NumArray {
  private p: number[] = [0];
  constructor(nums: number[]) {
    let acc = 0;
    for (const x of nums) this.p.push((acc += x));
  }
  sumRange(l: number, r: number): number {
    return (this.p[r + 1] ?? 0) - (this.p[l] ?? 0);
  }
}
const na = new NumArray([-2, 0, 3, -5, 2, -1]);
if (na.sumRange(0, 2) !== 1) throw new Error("assertion failed");
if (na.sumRange(2, 5) !== -1) throw new Error("assertion failed");
```

## Python Tip

itertools.accumulate 搭配 initial=0，一行就能產出補零式前綴和，建構子裡的預處理乾淨俐落。

```python
from itertools import accumulate

class NumArray:
    def __init__(self, nums: list[int]):
        self.p = list(accumulate(nums, initial=0))

    def sum_range(self, left: int, right: int) -> int:
        return self.p[right + 1] - self.p[left]

na = NumArray([-2, 0, 3, -5, 2, -1])
assert na.sum_range(0, 2) == 1, "assertion failed"
assert na.sum_range(2, 5) == -1, "assertion failed"
```

## Takeaway

補零式前綴和把區間查詢統一成 P[R+1] - P[L]：一次 O(N) 預處理，每次查詢 O(1)，邊界分支徹底消失。

## Tomorrow Preview

明天暫別 Prefix Sum，進入 Two Pointers from Opposite Ends：讓兩個指標從陣列兩端相向而行，靠單調收斂的移動策略，在 O(n) 內解決配對與夾擠類的問題。

## Today's Challenge

- **303** · 靜態陣列、多次區間和查詢、題名明示 immutable，是前綴和查詢介面的教科書級應用。
  - Hint: 建構子中建立長度 n+1、開頭補 0 的前綴和陣列，查詢直接套 P[R+1] - P[L]。
- **560** · 表面是計數題，核心仍是差分：子陣列和為 k 等價於兩個前綴相差 k，雜湊表負責統計歷史前綴。
  - Hint: 走訪時查「目前前綴減 k」出現過幾次並累加；空前綴 0 要先放進雜湊表。
- **304** · 把差分從一維推廣到二維：以左上角為原點的矩形前綴做排容，任意子矩陣和同樣 O(1) 查得。
  - Hint: 定義 S[i][j] 為左上角到 (i-1, j-1) 的矩形和，查詢時記得加回被扣兩次的重疊區。
