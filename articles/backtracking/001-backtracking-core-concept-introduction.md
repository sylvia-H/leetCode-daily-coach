---
id: backtracking-core-concept-introduction
title: Backtracking Core Concept Introduction
module: backtracking
pattern_label: Decision Tree Exploration
complexity_label: O(2^n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能說明「選擇—探索—撤銷選擇」（choose–explore–unchoose）的模式。
  - 能追蹤狀態如何被修改與還原。
---
## Concept

Backtracking 是在一棵**隱式**的狀態樹上做 DFS：根是「什麼都還沒選」的空狀態，每個節點是一個部分解（目前的 `path`），每條邊是一個選擇；沿邊往下走就是多做一個選擇，走到底或違反限制時退回上一層，改試下一個選擇。它用的正是圖 DFS 那一課的遞迴堆疊——堆疊記住「退回去要回到哪」，而每往下一層，`path` 就多一個選擇。

與圖 DFS 有兩個差別。第一，樹是隱式的：節點不存在任何資料結構裡，「u 的鄰居」變成「目前狀態還能做哪些選擇」，邊走邊生成。第二，也是最容易寫錯的：圖 DFS 的 visited 標記**永不撤銷**，因為它只在乎每個頂點到不到得了，進一次就夠；Backtracking 裡每一條「根到節點」的路徑都是一個不同的候選解，同一個元素在別的分支必須能再被選——所以進入節點時對狀態做的修改，離開時必須原樣還原。這就是三步模板：**choose**（把選擇加進 `path`）→ **explore**（遞迴深入）→ **unchoose**（把剛加的選擇移除）。push 與 pop 必須成對且對稱，遞迴呼叫夾在中間。

正確性靠一條不變式：**進入 `bt` 時，`path` 恰好是根到此節點的選擇序列；`bt` 返回時，`path` 與進入時完全相同**。有了它，每個兄弟分支都從乾淨的狀態出發，樹上每個節點恰被造訪一次，所以每個候選解恰被生成一次、不多不漏。

## Thinking

用 Subsets 把模板走一遍：給 `[1, 2, 3]`，回傳所有子集（含空集與全集，順序任意）。定義 `bt(start)`：進入時先把 `path` 的**拷貝**存進結果——樹上**每個節點**都是一個合法子集，所以不必等到葉節點；接著對 `i` 從 `start` 到最後一個索引：push `nums[i]`、呼叫 `bt(i + 1)`、pop。

追蹤一次：`bt(0)` 存 `[]`；選 1 → `bt(1)` 存 `[1]`；選 2 → `bt(2)` 存 `[1, 2]`；選 3 → `bt(3)` 存 `[1, 2, 3]`，迴圈沒東西可選，返回。pop 掉 3，`bt(2)` 的迴圈也結束，返回；pop 掉 2，回到 `bt(1)`，`i = 2` 選 3 → 存 `[1, 3]`；pop，回到 `bt(0)`，pop 掉 1，`path` 回到 `[]`。接著 `i = 1` 選 2 → 存 `[2]`、`[2, 3]`；最後 `i = 2` 存 `[3]`。共 8 筆，正好 2 的 3 次方。

為什麼要用 `start` 只往後挑？每個子集對應到**恰好一個遞增的索引序列**，而這棵樹的每條路徑正是一個遞增序列，所以一個子集只會被生成一次。若拿掉 `start` 從 0 開始挑，同一個元素會被一選再選，`path` 無限成長直到堆疊溢位；就算加一個 used 集合擋重選，也會把 `[1, 2]` 與 `[2, 1]` 當成兩個結果，跑出 16 筆而不是 8 筆——那是排列樹，不是子集樹。明天會看到同一棵樹的另一種切法：對每個索引問「取或不取」。

## Pattern Recognition

看到「列出**所有**組合／排列／子集／切法」，或「是否**存在**一種擺法滿足限制」，就想 Backtracking。共同特徵是：答案是一串**選擇序列**，單一迴圈拼不出來；候選解可以逐步建構，而且部分解就能判斷合不合法（合法才繼續往下，否則整個子樹跳過，這就是剪枝）。反過來，若問的是「最少幾步」「有幾種方法」而不需要列出每一種，先想 BFS 或 DP，窮舉狀態樹通常太貴。

## Common Mistakes

第一，**忘記 pop**。`[1, 2, 3]` 會得到 8 筆，數量看起來對，內容卻是 `[]、[1]、[1, 2]、[1, 2, 3]、[1, 2, 3, 3]、[1, 2, 3, 3, 2]…`——上一個分支的選擇殘留在 `path` 裡被帶進下一個分支。只檢查結果長度的測試抓不到它。第二，**存 `path` 本身而不是拷貝**：JavaScript 的 `res.push(path)` 或 Python 的 `res.append(path)` 存的是同一個物件的參考，8 個元素全指向同一個陣列，而跑完時 `path` 已被 pop 空，輸出是八個 `[]`。要寫 `[...path]`、`path[:]` 或 `list(path)`。第三，**把圖 DFS 的 visited 直接搬來且不撤銷**：選過的索引永久標記，`[1, 2, 3]` 只會得到 `[]、[1]、[1, 2]、[1, 2, 3]` 四筆，所有需要「重新使用 3」的分支全被擋掉。第四，**遞迴傳 `start` 或 `i` 而不是 `i + 1`**：同一元素可以被反覆選入，`path` 無界成長，JavaScript 在約一萬層時拋 RangeError，Python 約一千層拋 RecursionError。

## Complexity

子集樹恰有 2^n 個節點（每個節點對應一個子集），每個節點做 O(1) 的 push／pop，但存拷貝要 O(n)，所以嚴格說是 O(n · 2^n)；課程標籤寫的 O(2^n) 指的是節點數。排列類問題的樹則有 n! 量級的葉節點。額外空間 O(n)：遞迴深度最多 n + 1 層，`path` 長度最多 n；輸出本身的 O(n · 2^n) 不計入。

## Digest

Backtracking＝在隱式狀態樹上做 DFS：節點是部分解 `path`，邊是一個選擇。三步模板 choose → explore → unchoose，push 與 pop 對稱夾住遞迴呼叫；不變式是「返回時 `path` 與進入時相同」，所以每個分支都從乾淨狀態出發、每個候選解恰生成一次。與圖 DFS 的差別：樹是邊走邊生成的，而且 visited 式的標記在這裡必須撤銷，因為同一元素要能出現在別的分支。子集用 `bt(start)` 只往後挑，每個子集對應唯一遞增索引序列所以不重複；每個節點都存一份 `path` 的拷貝。忘記 pop 會讓內容錯但數量對，存參考會得到一堆空陣列。時間 O(n · 2^n)、額外空間 O(n)。

## TypeScript Tip

三步模板加拷貝；測資同時驗證內容與順序，所以忘記 pop、存參考、少寫 `+ 1` 都會被斷言抓到。

```typescript
import { strict as assert } from 'node:assert';

function subsets(nums: number[]): number[][] {
  const res: number[][] = [];
  const path: number[] = [];
  const bt = (start: number): void => {
    res.push([...path]); // 存拷貝：每個節點都是一個子集
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]!); // choose
      bt(i + 1);           // explore：只往後挑才不重複
      path.pop();          // unchoose
    }
  };
  bt(0);
  return res;
}

assert.deepEqual(subsets([1, 2, 3]),
  [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]);
assert.deepEqual(subsets([]), [[]]); // 根節點本身就是空集
```

## Python Tip

`path[:]` 才是拷貝；`res.append(path)` 會讓八個結果全是同一個被 pop 空的 list。

```python
def subsets(nums: list[int]) -> list[list[int]]:
    res: list[list[int]] = []
    path: list[int] = []

    def bt(start: int) -> None:
        res.append(path[:])  # 存拷貝，不是 path 本身
        for i in range(start, len(nums)):
            path.append(nums[i])  # choose
            bt(i + 1)             # explore
            path.pop()            # unchoose

    bt(0)
    return res

assert subsets([1, 2, 3]) == [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
assert subsets([]) == [[]]  # 空輸入只有空集
```

## Takeaway

Backtracking＝隱式狀態樹上的 DFS：choose → explore → unchoose，返回時 `path` 必須與進入時相同。

## Tomorrow Preview

明天把同一棵子集樹換一種切法：對每個索引只問「取或不取」，二元分支走到底才收集結果，並比較它與今天「從 `start` 往後挑」的樹形有何不同。

## Today's Challenge

- **78** · 本課用它把模板教到位：每個節點都是一個合法子集，所以進入時就收集；`start` 只往後挑保證不重複。明天會用同一題換另一種分支切法再解一次。
  - Hint: `bt(start)` 進入時先把 `path` 的拷貝存進結果（空集會在根節點被收進去），再對 `i` 從 `start` 往後：push、`bt(i + 1)`、pop；最後恰有 2^n 筆，順序不拘。
