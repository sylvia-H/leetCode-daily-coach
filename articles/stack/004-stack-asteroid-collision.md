---
id: stack-asteroid-collision
title: Stack Asteroid Collision
module: stack
pattern_label: Collision Resolution
complexity_label: O(n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能模擬目前元素會影響先前已儲存元素的連續交互過程。
  - 能在修改 stack 的同時管理迴圈條件。
---
## Concept

碰撞消解（Collision Resolution）處理的是這樣一類問題：元素依序抵達，每個新元素可能與「先前被保留下來的元素」發生方向性的互動——消滅、抵銷或相安無事。堆疊維護「目前仍存活」的元素序列；新元素只需要和堆疊頂端互動，因為在一維直線上，向左移動的新元素必然先撞上離它最近的向右移動者，而「最近被保留的」正是堆疊頂端。這是昨天括號匹配的升級版：括號比對的是型態，這裡比對的是方向與大小，而且一次進場可能引發連鎖反應，接連摧毀多個舊元素。

## Thinking

以 Asteroid Collision 為例：正數向右移動、負數向左移動，大小為絕對值。逐一掃描，對每個新元素 a 先問「會不會撞」：四種方向組合中，只有「頂端向右（top 為正）且 a 向左（a 為負）」會相向而行；同向、背向（頂端向左、a 向右）或堆疊為空，都直接把 a 推入。會撞時比較絕對值，結果有三種——頂端較小：彈出頂端，用 while 迴圈讓 a 繼續與新頂端交手；兩者相等：頂端彈出、a 也陣亡，雙雙消滅；頂端較大：a 消滅，堆疊不動。實作上用一個存活旗標貫穿：while 迴圈以「a 還活著且仍構成碰撞」為條件，結束後只有倖存的 a 才能入堆疊。

正確性由不變式保證：堆疊中不可能存在「向右者在下、向左者在上」的相鄰組合——因為向左的元素想入堆疊，必須先把上方所有向右的頂端清算完畢。因此掃描結束時，堆疊由底至頂必然是一段向左的元素接一段向右的元素，彼此背向或同向、不再有任何碰撞，這就是最終答案。

## Pattern Recognition

三個辨識特徵：一、元素依序進場，且只與「先前保留的元素」互動；二、互動具方向性或對立性（正負號、左右移動、強弱對決）；三、單一新元素可能連鎖消滅多個舊元素。符合這三點，就套「堆疊＋內層 while」的骨架。同型場景：相鄰字元的成對抵銷消除、任何「新事件會回頭撤銷若干最近事件」的模擬題。

## Common Mistakes

第一，用單次 if 處理碰撞：夠大的新元素會接連摧毀多個頂端，漏了 while 就只撞一次。第二，相等時只做一半：雙滅要求「彈出頂端」且「新元素不入堆疊」，常見 bug 是彈出後仍照常 push。第三，碰撞條件寫錯：誤以為「一正一負就會撞」，但頂端向左、新元素向右（如序列 -2、3）是背向遠離，永不相撞——四種組合只有一種會撞。第四，迴圈條件不完整：彈出頂端後未重新確認「堆疊非空、頂端仍向右、a 仍存活」，就會誤讀空堆疊或多撞一場。

## Complexity

時間複雜度 O(n)：雖然有巢狀迴圈，但每個元素至多入堆疊一次、被彈出一次，內層 while 除了收尾那一次，每次疊代都伴隨一次永久性的彈出，全程操作總數受兩倍元素個數限制，攤銷後為線性。空間複雜度 O(n)：完全沒有碰撞時（例如全部同向），所有元素都留在堆疊中。

## Digest

碰撞消解 Pattern：堆疊維護存活元素，新元素只與頂端互動。唯一的碰撞條件是「頂端向右、新元素向左」；比絕對值分三種結果——頂端小則彈出並用 while 連鎖再撞、相等則雙滅、頂端大則新元素陣亡。存活旗標貫穿迴圈，倖存者才入堆疊。不變式「堆疊內不存在向右者在下、向左者在上的相鄰對」保證終局穩定。每個元素至多一進一出，攤銷 O(n)、空間 O(n)。與括號匹配同骨架：新符號與最近未結案者互動，互動規則從型態比對升級為大小對決。

## TypeScript Tip

while 條件一次收齊四件事：a 還活著、a 向左、堆疊非空、頂端向右。`noUncheckedIndexedAccess` 之下讀頂端要用非空斷言收斂型別。

```typescript
function collide(arr: number[]): number[] {
  const st: number[] = [];
  for (const a of arr) {
    let alive = true;
    while (alive && a < 0 && st.length > 0 && st[st.length - 1]! > 0) {
      const top = st[st.length - 1]!;
      if (top < -a) st.pop();
      else {
        if (top === -a) st.pop();
        alive = false;
      }
    }
    if (alive) st.push(a);
  }
  return st;
}
if (collide([5, 10, -5]).join() !== "5,10") throw new Error("assertion failed");
if (collide([8, -8]).length !== 0) throw new Error("assertion failed");
if (collide([10, 2, -5]).join() !== "10") throw new Error("assertion failed");
```

## Python Tip

`st and st[-1] > 0` 用短路求值同時擋掉空堆疊；負索引讀頂端是 Python 慣用寫法。

```python
def collide(arr: list[int]) -> list[int]:
    st = []
    for a in arr:
        alive = True
        while alive and a < 0 and st and st[-1] > 0:
            if st[-1] < -a:
                st.pop()
            else:
                if st[-1] == -a:
                    st.pop()
                alive = False
        if alive:
            st.append(a)
    return st

assert collide([5, 10, -5]) == [5, 10]
assert collide([8, -8]) == []
assert collide([10, 2, -5]) == [10]
assert collide([-2, -1, 1, 2]) == [-2, -1, 1, 2]
```

## Takeaway

只有「頂端向右、新元素向左」才相撞；while 連鎖比絕對值，倖存者才入堆疊，每個元素至多一進一出。

## Tomorrow Preview

明天堆疊轉戰運算式求值：Reverse Polish Notation 中運算元入堆疊，遇到運算子就彈出頂端兩個元素、計算後再推回——後綴式不需要括號也能決定運算順序。

## Today's Challenge

- **735** · 新的小行星只會與「最近仍存活且向右」的頂端互動，且可能連鎖摧毀多個，LIFO 恰好維護這份存活序列。
  - Hint: 只有新元素為負、頂端為正才會碰撞；用 while 搭配存活旗標處理連鎖，絕對值相等時記得雙滅。
