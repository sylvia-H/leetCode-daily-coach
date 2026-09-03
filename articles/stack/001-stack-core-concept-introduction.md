---
id: stack-core-concept-introduction
title: Stack Core Concept Introduction
module: stack
pattern_label: Last-In-First-Out (LIFO)
complexity_label: O(1) push/pop
estimated_minutes: 10
exit_criteria:
  - 能說明為何元素會以與加入相反的順序被取出。
  - 能手動追蹤 push 與 pop 操作。
---
## Concept

Stack（堆疊）是一種線性資料結構，規則只有一條：**所有插入與刪除都發生在同一端**，這一端稱為頂端（Top）。插入叫 push，刪除叫 pop，另外還有 peek（只讀取頂端元素、不移除）與 isEmpty（判斷是否為空）。這條「只開一個出入口」的限制，正是 LIFO（Last-In-First-Out，後進先出）的來源：越晚 push 的元素離出口越近，pop 時自然最先離開。換句話說，LIFO 不是額外設計的規則，而是單一出入口的必然結果——理解這層因果，比背「後進先出」四個字重要得多。

為什麼取出順序一定與加入順序相反？完整論證如下：任取兩個元素 x 與 y，若 x 先進、y 後進，且兩者曾**同時**待在堆疊中，那麼 y 一定壓在 x 上方；出口只有頂端，所以 y 必定先出。這對堆疊中任意一對共存元素都成立，因此共存元素的取出順序整體反轉。注意前提是「同時在堆疊中」：若操作序列是 push A、pop、push B、pop，A 與 B 從未共存，取出順序 A、B 反而與加入順序相同。精確的說法是——stack 反轉的是「尚未取出的元素」之間的順序，不是整條操作歷史。

## Thinking

心智模型是一疊垂直堆放的盤子：放盤子只能放最上面，拿盤子也只能拿最上面，最後放的必然最先被拿走。手動追蹤時，建議用「由底至頂」的清單記錄狀態：依序 push 1、2、3 後狀態是 [1, 2, 3]（3 在頂端）；pop 回傳 3，狀態變 [1, 2]；再 push 4，狀態變 [1, 2, 4]。每一步只有最右端在變動，這就是單一出入口的視覺化。程式世界處處是這個模型：函式呼叫（call stack）——最後被呼叫的函式最先返回；編輯器的 undo——最近的修改最先被撤銷；巢狀括號——最晚打開的括號最先閉合。它們的共同特徵是「**最近的未完成事項要最先處理**」。

## Pattern Recognition

看到以下訊號就該想到 stack：問題需要反覆存取「最近一個」狀態；需要把處理順序反轉；結構是巢狀配對（開與關必須就近呼應）；需要回溯到上一步。經典場景：括號匹配、瀏覽器上一頁、DFS 的疊代實作、運算式求值。也做反向檢查：若需要「最早的優先處理」，那是 queue 的 FIFO；若需要隨機讀取任意位置的元素，那是 array——stack 刻意放棄了這些能力，換來規則單純與操作高效。

## Common Mistakes

一、把 LIFO 與 FIFO 搞混。判斷法是問一句：「誰先被處理？」最新加入的優先是 stack（疊盤子），最早加入的優先是 queue（排隊）。二、對空堆疊 pop 或 peek。JavaScript 的 `pop()` 對空陣列回傳 `undefined` 且**不報錯**，錯誤值會安靜地往下游擴散；Python 的 `list.pop()` 對空 list 直接拋出 `IndexError`。兩種行為一個太安靜、一個會炸，都應該先用 isEmpty 判空。三、用錯端：JavaScript 用 `shift`/`unshift`、Python 用 `pop(0)`/`insert(0, x)` 對開頭操作——只要進出同一端，邏輯上仍是 LIFO，但每次都要搬移全部元素，成本 O(n)；固定操作尾端才是正解。

## Complexity

push、pop、peek、isEmpty 皆為 O(1)：每個操作都只碰觸頂端一個位置，成本與堆疊內元素總數無關。空間複雜度為 O(n)，n 為堆疊中的元素數。（以動態陣列實作時，push 嚴格來說是攤銷 O(1)，明天實作時詳細論證。）

## Digest

Stack 只有一條規則：所有插入（push）與刪除（pop）都發生在頂端這唯一的出入口。LIFO 是這條限制的必然結果——任兩個同時在堆疊中的元素，後進者一定壓在先進者上方，因此必先取出；但從未共存的元素不受此限。手動追蹤用「由底至頂」清單：push 1、2、3 得 [1, 2, 3]，pop 回傳 3 得 [1, 2]，再 push 4 得 [1, 2, 4]，永遠只有最右端變動。push/pop/peek/isEmpty 全是 O(1)。適用訊號：需要「最近的優先處理」、反轉順序、巢狀配對、回溯上一步——call stack、undo、括號匹配都是這個模型。對空堆疊 pop 前務必判空：JavaScript 安靜回傳 undefined，Python 直接拋錯。

## TypeScript Tip

JavaScript 陣列的 `push`/`pop` 天生就是 stack 介面；`arr[arr.length - 1]` 充當 peek。注意空陣列 `pop()` 回傳 `undefined` 而不報錯：

```typescript
import assert from "node:assert";
const stack: number[] = [];
stack.push(1);
stack.push(2);
stack.push(3);
assert.strictEqual(stack.pop(), 3);
assert.strictEqual(stack[stack.length - 1], 2); // peek：只看不拿
stack.push(4);
assert.deepStrictEqual(stack, [1, 2, 4]);
const empty: number[] = [];
assert.strictEqual(empty.pop(), undefined); // 不會拋錯，要自行判空
```

## Python Tip

Python 用 list 的 `append`/`pop` 實作 stack；`stack[-1]` 充當 peek。與 JavaScript 不同，空 list 的 `pop()` 會直接拋出 `IndexError`：

```python
stack = []
stack.append(1)
stack.append(2)
stack.append(3)
assert stack.pop() == 3
assert stack[-1] == 2  # peek：只看不拿
stack.append(4)
assert stack == [1, 2, 4]
try:
    [].pop()
    raise AssertionError("空 list pop 應拋 IndexError")
except IndexError:
    pass  # 先判空再 pop 才安全
```

## Takeaway

Stack 只開頂端一個出入口，LIFO 是這條限制的必然結果；push、pop、peek 全是 O(1)。

## Tomorrow Preview

明天親手用動態陣列實作一個 stack：把陣列尾端當作頂端，實作 push、pop、top 與 isEmpty，並論證為何尾端操作是攤銷 O(1)。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請在紙上追蹤：依序 push 1 到 5，接著 pop 兩次、push 6、再 pop 三次，寫出每一步「由底至頂」的堆疊狀態與每次 pop 的回傳值。
