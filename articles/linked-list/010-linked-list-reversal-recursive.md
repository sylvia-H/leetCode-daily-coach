---
id: linked-list-reversal-recursive
title: Linked List Reversal (Recursive)
module: linked-list
pattern_label: Recursion
complexity_label: O(n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能寫出遞迴函式，先反轉串列的其餘部分，並在回溯（unwinding）時修正指標方向
  - 能辨識遞迴的 base case
---
## Concept

遞迴反轉把「反轉整條串列」化約成一個更小的同型問題：先信任 reverseList(head.next) 會把 head 之後的部分反轉好並回傳那一段的新頭，剩下的工作只有一件——把 head 與原後繼之間這一條邊翻過來。整個過程是先深入到底、再於回溯（unwinding）時逐層修邊，指標翻轉因此從尾端往前發生，方向恰與迭代法相反。時間 O(n)；空間 O(n)，代價藏在呼叫堆疊裡——每一層遞迴都隱式替你記住一個節點，這正是迭代法用 prev 顯式維護的東西。

## Thinking

用歸納法說服自己它是對的。Base case：head 為 null（空串列）或 head.next 為 null（單一節點），反轉後就是自己，直接回傳 head。歸納步驟：假設遞迴呼叫對更短的串列正確，則 reverseList(head.next) 回傳後，head 之後那段已反轉完成，其新尾正是原本的 head.next——而此刻 head.next 這個指標還沒被動過，仍然指著那個節點。於是 head.next.next = head 恰好把反轉段的尾接向 head；再執行 head.next = null，讓 head 成為新的尾。最後把深處傳回的 newHead 原封不動往上回傳——每一層都不加工它，因為新頭（原串列的尾節點）在遞迴到底時就已確定。寫遞迴的心法是：不要在腦中展開整個堆疊，只驗證兩件事——base case 對不對、以及「假設下層做對了，本層這一條邊有沒有修對」。

## Pattern Recognition

當處理順序天然是「先解決其餘部分、再回頭修自己」，或需要從尾端往前逐一處理節點時，遞迴是貼合的表達方式。每 k 個節點一組的反轉是典型場景：反轉完前 k 個節點後，剩餘串列是一個一模一樣的子問題，遞迴結果直接接在本組的尾巴上。辨識時也要看反面訊號：若題目給出超長串列、或明說只允許 O(1) 空間，呼叫堆疊的線性開銷就是硬傷，應退回迭代法——兩者時間同為 O(n)，差別全在空間與表達力的取捨。

## Common Mistakes

最致命的是遺漏 head.next = null：原頭節點反轉後是新尾，不斷開它與第二個節點的舊連結，兩者會互相指向、形成長度為 2 的環，之後任何一次完整走訪都不會終止。第二是把修邊動作寫在遞迴呼叫之前：head.next 一改，通往深處的路當場斷掉，遞迴無法抵達尾端。第三是 base case 只檢查 head.next 而漏掉 head 本身為 null，空串列輸入會在取值時當場拋錯。第四是畫蛇添足地在回傳路徑上改動 newHead——它必須逐層原樣上傳，任何一層換掉它，最外層拿到的就不是真正的新頭。最後是規模風險：遞迴深度等於串列長度，JavaScript 引擎的呼叫堆疊撐不住上萬層，Python 預設遞迴上限更只有約一千層。

## Complexity

時間 O(n)：每個節點恰好觸發一層遞迴呼叫，每層只做常數個指標賦值。空間 O(n)：深入到底時，呼叫堆疊同時保有 n 層 frame，每層記住一個 head 參照與返回位址——這份隱式狀態正是它與迭代法 O(1) 空間的本質差距。同一個問題、同樣的線性時間，空間卻差了一個等級，是面試追問「能否把遞迴改成迭代」的標準素材。

## Digest

遞迴反轉的骨架：base case 是 head 或 head.next 為 null 時回傳 head；否則先遞迴反轉其餘部分取得 newHead，回溯時用 head.next.next = head 把原後繼的指標翻回來、再以 head.next = null 斷開舊連結，最後把 newHead 逐層原樣上傳。指標翻轉自尾端往前發生，正確性靠歸納法保證。時間 O(n)、空間 O(n)（呼叫堆疊），超長串列請改用迭代。兩個必守細節：修邊只能發生在遞迴呼叫之後；newHead 不可在回傳途中被改動。

## TypeScript Tip

base case 先擋掉空值後，編譯器知道 head.next 非空，head.next.next 的賦值才能通過型別檢查；長度不可控的串列請改用迭代，以免呼叫堆疊溢位。

```typescript
import assert from "node:assert";

class ListNode {
  constructor(public val: number, public next: ListNode | null = null) {}
}

function reverseList(head: ListNode | null): ListNode | null {
  if (head === null || head.next === null) return head; // base case
  const newHead = reverseList(head.next);
  head.next.next = head; // 原後繼反過來指向自己
  head.next = null; // 斷開舊連結，避免成環
  return newHead;
}

const res = reverseList(new ListNode(1, new ListNode(2, new ListNode(3))));
assert.strictEqual(res?.val, 3);
assert.strictEqual(res?.next?.val, 2);
assert.strictEqual(res?.next?.next?.val, 1);
assert.strictEqual(res?.next?.next?.next, null); // 新尾必須是 null
```

## Python Tip

Python 預設遞迴上限約 1000 層（sys.getrecursionlimit() 可查），串列一長就會拋 RecursionError；上限可調，但堆疊記憶體不會變多，工程上長串列仍以迭代為準。

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head: ListNode | None) -> ListNode | None:
    if head is None or head.next is None:
        return head
    new_head = reverse_list(head.next)  # 新頭在最深層確定，逐層原樣上傳
    head.next.next = head
    head.next = None
    return new_head

res = reverse_list(ListNode(1, ListNode(2, ListNode(3))))
assert res.val == 3 and res.next.val == 2 and res.next.next.val == 1
assert res.next.next.next is None
assert reverse_list(None) is None
```

## Takeaway

信任遞迴反轉好其餘部分，回溯時以 head.next.next = head 加 head.next = null 修好自己這條邊。

## Tomorrow Preview

明天探討 Merge Two Sorted Linked Lists：把兩條已排序的串列合而為一，dummy 節點加上逐一比較接尾的手法，是往後所有分治合併類題目的地基。

## Today's Challenge

- **206** · 同一題用遞迴再解一次，親手對照兩種寫法：迭代顯式維護 prev，遞迴讓呼叫堆疊替你記住它。
  - Hint: base case 是 head 或 head.next 為 null；修邊動作放在遞迴呼叫之後。
- **25** · 每 k 個節點一組反轉的難題，「反轉前 k 個、遞迴處理剩餘、把結果接上」正是遞迴分解的教科書示範。
  - Hint: 先確認剩餘節點足足有 k 個再動手，不足 k 的尾段保持原樣直接回傳。
