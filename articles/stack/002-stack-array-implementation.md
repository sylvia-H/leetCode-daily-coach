---
id: stack-array-implementation
title: Stack Array Implementation
module: stack
pattern_label: Dynamic Array Wrapper
complexity_label: O(1) amortized
estimated_minutes: 15
exit_criteria:
  - 能用陣列實作 push、pop、top 與 isEmpty 操作。
  - 理解為何在陣列尾端進行 push/pop 是攤銷 O(1)。
---
## Concept

用動態陣列實作 stack，本質是一層「限制介面」的封裝（Dynamic Array Wrapper）：陣列本來什麼位置都能讀寫，我們刻意只暴露對**尾端**的操作，讓尾端扮演堆疊頂端。對應關係很直接——push 是在尾端附加一個元素，pop 是移除尾端元素，top 是讀取索引 `length - 1`，isEmpty 是檢查 `length === 0`。為什麼選尾端而不是開頭？陣列元素在記憶體中連續排列，在開頭插入或刪除，必須把後面**全部**元素搬移一格，成本 O(n)；在尾端操作則什麼都不用搬，直接讀寫最後一格即可。這裡的封裝重點不是「增加功能」，而是「**拿走功能**」——把隨機寫入、中段插入都藏起來，呼叫端就不可能不小心破壞 LIFO 的結構約束。

## Thinking

從零設計時依序回答三個問題。一、頂端對應到哪裡？答：陣列尾端，頂端索引恆為 `length - 1`，這個不變式讓四個操作都變成一行。二、pop 實際上做了什麼？只是把有效長度減一——被移除的那格不需要真的清空或歸還記憶體，之後的 push 直接覆寫它。三、陣列滿了怎麼辦？動態陣列採**倍增策略**：容量不足時配置一塊兩倍大的新空間，把 n 個元素搬過去。單次擴容是 O(n)，但從容量 1 開始倍增，做完 n 次 push 的擴容總搬移量是 1 + 2 + 4 + … + n，這個等比級數合計小於 2n——把總帳攤平到 n 次 push，**每次平均成本仍是常數**，這就是「攤銷 O(1)」的完整論證。在 TypeScript 與 Python 裡，內建的 array / list 已經替你做完容量管理，wrapper 只需要負責介面約束。

## Pattern Recognition

當題目要求「設計／實作」一個有特定介面與複雜度保證的容器，就是 Dynamic Array Wrapper 出場的時機：例如要求常數時間取得最小值、限制容量上限、或統計歷史狀態。辨識關鍵：不需要節點與指標的鏈結結構，只需要在現成動態陣列外面包一層存取規則。延伸思考：若介面要多支援一種 O(1) 查詢（如目前最小值），常見解法是**同步維護一個輔助陣列**，與主堆疊一起 push、一起 pop，讓額外資訊也遵守 LIFO 節奏。

## Common Mistakes

一、把頂端設在陣列開頭：用 `unshift`/`shift`（Python 的 `insert(0, x)`/`pop(0)`）進出，邏輯仍是 LIFO，但每次操作都搬移全部元素，O(1) 惡化成 O(n)。二、空堆疊防禦缺席：pop 與 top 在空堆疊上，JavaScript 安靜回傳 `undefined`、Python 拋 `IndexError`；介面要嘛回傳 `undefined`/`None`、要嘛拋錯，但必須挑一種並讓呼叫端知道。三、封裝後又繞過封裝：外部直接對內部陣列 `splice` 或改索引，不變式立刻失效——TypeScript 的 `private` 只在編譯期擋誤用，執行期仍可存取；要真正的執行期私有，得改用 `#` 開頭的私有欄位。四、誤解攤銷：攤銷 O(1) 不等於每次都 O(1)，觸發擴容的那一次仍是 O(n)；對單次延遲敏感的場景，應預先配置足夠容量。

## Complexity

push 為攤銷 O(1)：擴容雖是 O(n)，但倍增策略讓 n 次 push 的總搬移量小於 2n。pop、top、isEmpty 為嚴格 O(1)：各只讀寫尾端一格或長度變數。空間為 O(n)：倍增最多預留一倍閒置容量，仍是線性。

## Digest

把陣列尾端當堆疊頂端：push 附加尾端、pop 長度減一、top 讀 `length - 1`、isEmpty 檢查長度為零，全部免搬移。選尾端的理由：開頭插入刪除要位移全部元素（O(n)），尾端什麼都不用動。攤銷論證：倍增擴容下，n 次 push 的總搬移量是等比級數 1 + 2 + 4 + … + n < 2n，攤平每次 O(1)；但單次擴容仍是 O(n)，攤銷不是「每次都快」。封裝的意義是拿走功能——只露出四個操作，LIFO 不變式就不可能被呼叫端破壞。防禦邊界：空堆疊 pop/top，JavaScript 回 undefined、Python 拋 IndexError，介面要明確選一種行為。

## TypeScript Tip

用 `private` 藏住內部陣列，介面只露出四個操作；空堆疊時 `pop`/`top` 一致地回傳 `undefined`：

```typescript
import assert from "node:assert";
class Stack<T> {
  private data: T[] = [];
  push(v: T): void { this.data.push(v); }
  pop(): T | undefined { return this.data.pop(); }
  top(): T | undefined { return this.data[this.data.length - 1]; }
  isEmpty(): boolean { return this.data.length === 0; }
}
const s = new Stack<number>();
assert.strictEqual(s.pop(), undefined); // 空堆疊：一致回傳 undefined
s.push(1);
s.push(2);
assert.strictEqual(s.top(), 2);
assert.strictEqual(s.pop(), 2);
assert.strictEqual(s.pop(), 1);
assert.ok(s.isEmpty());
```

## Python Tip

Python 以底線慣例標示內部 list，空堆疊時 `pop`/`top` 一致地回傳 `None` 而非拋錯：

```python
class Stack:
    def __init__(self) -> None:
        self._data: list[int] = []
    def push(self, v: int) -> None:
        self._data.append(v)
    def pop(self) -> int | None:
        return self._data.pop() if self._data else None
    def top(self) -> int | None:
        return self._data[-1] if self._data else None
    def is_empty(self) -> bool:
        return not self._data

s = Stack()
assert s.pop() is None  # 空堆疊：一致回傳 None
s.push(1)
s.push(2)
assert s.top() == 2 and s.pop() == 2
assert s.pop() == 1 and s.is_empty()
```

## Takeaway

陣列尾端當頂端，push/pop 免搬移；倍增擴容的總量是等比級數，攤平後 push 仍是攤銷 O(1)。

## Tomorrow Preview

明天把 stack 用在第一個經典應用——括號匹配：最晚打開的括號必須最先閉合，正是 LIFO 的天然舞台。

## Today's Challenge

- **155** · 要在標準 stack 介面之外再提供 O(1) 取得最小值，考驗你如何在不破壞 LIFO 介面的前提下同步維護輔助資訊。
  - Hint: 用第二個陣列同步記錄「每一層當下的最小值」：push 時存入 min(新值, 目前最小)（堆疊為空時直接存新值），pop 時一起彈出，最小值永遠在輔助陣列頂端。
