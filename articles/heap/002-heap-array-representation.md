---
id: heap-array-representation
title: Array Representation of Binary Heap
module: heap
pattern_label: Array-based Tree Indexing
complexity_label: O(1) index access / O(n) space
estimated_minutes: 15
exit_criteria:
  - 能對任意索引 i 正確計算左子節點、右子節點與父節點的索引。
---
## Concept

昨天說 heap 是一棵完全二元樹，卻沒有說這棵樹存在哪裡。答案是：不需要節點物件，也不需要 left / right / parent 指標，整棵樹就是一條一維陣列。做法是把節點依層序（level order）編號——root 是 0，第二層由左至右是 1、2，第三層是 3、4、5、6……編號就是陣列索引。在這種 0-based 編號下，索引 i 的節點：左 child 在 `2i + 1`，右 child 在 `2i + 2`，parent 在 `floor((i - 1) / 2)`。三條公式互為反函式：對任一 i，`parent(2i + 1)` 與 `parent(2i + 2)` 都回到 i。用昨天那棵 Min-Heap `[1, 5, 2, 9, 7, 3]` 對照：索引 1 的 5 底下是索引 3 與 4 的 9、7；索引 5 的 3 往上算 `floor(4 / 2) = 2`，parent 正是 2。這套映射能成立，關鍵在「完全」二字：層序編號要能無洞地填進陣列，樹裡就不能有空位，而完全二元樹正是「除了最後一層全滿、最後一層由左往右連續」的樹。一棵不完全的樹也能塞進陣列，但中間會出現要用特殊值標記的空洞，既浪費空間，也失去接下來要談的好處。

## Thinking

公式為什麼是 `2i + 1` 而不是別的？從層序編號推一次就不用背。第 d 層（root 是第 0 層）有 `2^d` 個節點，它前面的各層合計 `2^d - 1` 個，所以第 d 層第 p 個（p 從 0 起）節點的索引是 `i = 2^d - 1 + p`。它的左 child 在第 d + 1 層，且是該層第 `2p` 個——因為它前面的每個同層節點各貢獻兩個 child——索引就是 `2^(d+1) - 1 + 2p = 2(2^d - 1 + p) + 1 = 2i + 1`。右 child 緊接其後，是 `2i + 2`。parent 是反過來算：`2i + 1` 與 `2i + 2` 各減 1 再除以 2，得到 `i` 與 `i + 0.5`，取 floor 後都回到 i，這就是 `floor((i - 1) / 2)` 裡那個 floor 的來歷。這個推導同時解釋了為什麼要「完全」：層序編號假設每一層在前一層填滿後才開始、最後一層由左往右不留空，陣列裡才不會出現「索引存在但節點不存在」的洞；於是 n 個節點恰好占用索引 0 到 n - 1，而索引 n - 1 永遠是最後一層最右邊的那個節點。第二件要想清楚的是邊界。索引 i 有左 child 若且唯若 `2i + 1 < n`，有右 child 若且唯若 `2i + 2 < n`；i = 0 是 root，沒有 parent，任何往上走的迴圈都要在此停下。由第一條可以推出「最後一個非葉節點」的位置：i 是葉等價於 `2i + 1 >= n`，所以最後一個有 child 的索引是滿足 `2i + 1 <= n - 1` 的最大 i，即 `floor((n - 2) / 2) = floor(n / 2) - 1`——它剛好也是最後一個節點 n - 1 的 parent。以 n = 6 為例，索引 2 是最後一個非葉節點，索引 3、4、5 全是葉。找 child、找 parent、判斷是否還在樹內，這三件事就是明天插入元素時沿路徑往上修復所需的全部工具：新元素放到索引 n 之後，樹仍是完全的，剩下的只是沿著 parent 公式一路往上檢查。

## Pattern Recognition

線索是「一棵形狀受控的樹」加上「大量父子之間的來回」。只要樹是完全二元樹，或者你能把它維持成完全的，就不必配置節點物件：父子關係全用整數運算表達，記憶體是連續的一塊，沒有指標的額外空間，也沒有追指標帶來的快取失誤。Heap 是最典型的用戶：昨天說插入與取出都只沿一條路徑修復，這條路徑在陣列上就是「反覆套 parent 或 child 公式」，不需要任何額外結構。同樣的映射也出現在 Segment Tree，以及題目直接給你層序序列、要你判斷父子關係的場合——直接算索引即可。反過來，若樹的形狀不受控（一般 BST、任意二元樹），層序編號會留下大片空洞，指標表示法才是對的選擇。

## Common Mistakes

以下都用 `[1, 5, 2, 9, 7, 3]`（n = 6）舉反例。第一，把 1-based 公式套在 0-based 陣列上：1-based 的 child 是 `2i` 與 `2i + 1`，parent 是 `floor(i / 2)`。對索引 1 的 5 套 `2i` 會得到索引 2 的 2——那其實是 root 的右 child，5 的兩個 child 在索引 3、4。反過來對索引 2 套 `floor(i / 2)` 得到 1，會以為 2 的 parent 是 5，但它的 parent 是 root。第二，不檢查邊界就存取 child：索引 3 的 9 是葉，`2 * 3 + 1 = 7 >= 6`。TypeScript 讀 `heap[7]` 得到 `undefined`，`undefined < 9` 是 `false`，程式不報錯而是安靜地做出錯的比較；Python 讀 `heap[7]` 直接拋 IndexError。第三，除法沒取整：TypeScript 寫 `(i - 1) / 2`，i = 2 時得到 0.5，`heap[0.5]` 是 `undefined`，接下來的比較永遠是 `false`，往上修復的判斷因此失效——視迴圈怎麼寫，不是提早停在錯的位置，就是把值寫進 `0.5` 這個不存在的位置；Python 寫 `/` 會得到浮點數，`heap[0.5]` 直接拋 TypeError，要用 `//`。第四，以為陣列是排序好的：這條陣列裡 5 在 2 前面，但它是合法的 Min-Heap——昨天已經說過，兄弟之間沒有順序。

## Complexity

由索引算 child 或 parent 是常數次整數運算，O(1)；n 個節點只占用長度 n 的連續陣列，空間 O(n)，沒有任何指標開銷。判斷某節點是否為葉、找出最後一個非葉節點，同樣是 O(1) 的算式。

## Digest

完全二元樹依層序編號後可以無洞地放進一維陣列：0-based 下索引 i 的左 child 在 `2i + 1`、右 child 在 `2i + 2`、parent 在 `floor((i - 1) / 2)`，三條公式互為反函式。它成立的原因是每一層都在前一層填滿後才開始、最後一層由左往右連續，所以 n 個節點恰好占用索引 0 到 n - 1，索引 n - 1 永遠是最後一層最右的節點。邊界規則：有左 child 若且唯若 `2i + 1 < n`；i = 0 沒有 parent；最後一個非葉節點在 `floor(n / 2) - 1`。整棵樹不需任何指標，父子之間的移動全是 O(1) 整數運算。

## TypeScript Tip

把三條索引公式包成函式，再寫「逐一比對非 root 節點與其 parent」的判定；測資含合法樹與深層違規的樹，並確認 parent 是 child 的反函式。

```typescript
const left = (i: number) => 2 * i + 1;
const right = (i: number) => 2 * i + 2;
const parent = (i: number) => Math.floor((i - 1) / 2);
function isHeap(a: number[]): boolean {
  for (let i = 1; i < a.length; i++) if (a[parent(i)]! > a[i]!) return false;
  return true;
}
const h = [1, 5, 2, 9, 7, 3];
if (left(1) !== 3 || right(1) !== 4 || parent(5) !== 2) throw new Error("formula");
for (let i = 0; i < 6; i++) if (parent(left(i)) !== i || parent(right(i)) !== i) throw new Error("inverse");
if (left(3) < h.length || left(2) >= h.length) throw new Error("leaf bound");
if (!isHeap(h)) throw new Error("valid");
if (isHeap([1, 5, 2, 4, 7, 3])) throw new Error("deep miss");
```

## Python Tip

Python 的整數除法 `//` 直接給出 parent 索引；用同一條判定式檢查 `heapq.heapify` 的結果，並確認「最後一個非葉節點」的位置。

```python
import heapq

def is_min_heap(a: list[int]) -> bool:
    return all(a[(i - 1) // 2] <= a[i] for i in range(1, len(a)))

h = [1, 5, 2, 9, 7, 3]
assert (5 - 1) // 2 == 2 and 2 * 1 + 1 == 3, "index formulas"
assert is_min_heap(h) and h != sorted(h), "valid heap need not be sorted"
assert not is_min_heap([1, 5, 2, 4, 7, 3]), "deep violation missed"
n = len(h)
last = n // 2 - 1
assert 2 * last + 1 < n and 2 * (last + 1) + 1 >= n, "last non-leaf is 2"
data = [9, 4, 7, 1, 8, 2, 6]
heapq.heapify(data)
assert is_min_heap(data) and data[0] == 1, "heapify result must satisfy the formulas"
```

## Takeaway

完全二元樹層序編號後無洞地落在陣列裡：child 在 2i+1、2i+2，parent 在 floor((i-1)/2)，父子移動只是整數運算。

## Tomorrow Preview

明天進入 Heap Insertion and Sift-Up Operation：新元素先放到索引 n，讓樹維持完全，再沿著 parent 公式一路往上比較與交換，直到 heap property 恢復——為什麼只有那一條路徑需要檢查，是明天的主題。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請不看公式，把 `[1, 5, 2, 9, 7, 3]` 畫回樹，再對索引 4 與 5 各算一次 parent、對索引 2 算一次左右 child，最後說出 n = 6 時最後一個非葉節點為什麼是索引 2。
