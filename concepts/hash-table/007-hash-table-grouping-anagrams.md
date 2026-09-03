---
id: hash-table-grouping-anagrams
title: Grouping Elements by Canonical Hash Key
module: hash-table
topic: hash-table
difficulty: medium
estimated_minutes: 15
pattern_label: Canonical Key Grouping
complexity_label: O(n * k log k) / O(n * k)
prerequisite:
  - hash-table-frequency-counting
  - hash-table-sliding-window-frequency
next:
  - hash-table-prefix-sum-frequency
  - string-anagram-grouping
learning_goal:
  - '使用排序後的字串或頻率 tuple 作為 hash map 的 key，將相關項目分組到各個桶中。'
exit_criteria:
  - '能為具有共同性質的項目產生 canonical 表示'
  - '能在 hash map 內以 list 儲存並附加項目'
leetcode:
  - 49
  - 249
tags:
  - hash-table
  - grouping
---

## Author Hints

- 核心觀念：Transform items into a canonical form (e.g., sorted string) to use as a hash map key for grouping.
- Pattern 辨識線索：Problem asks to group anagrams, shifted strings, or items with identical characteristics.
- Thinking：Sort each string to form a signature key, then append the original string to map.get(key).
- Common Mistakes：Using the unsorted string or raw sum of characters which can cause hash collisions across different words.
- TypeScript 重點：Convert keys to strings if using arrays as keys (e.g., join('')), since JS maps use reference equality for objects.
- Python 重點：Use tuples of counts or sorted strings as dictionary keys because tuples are hashable.
- 題號 49 為何適合此 Pattern：Group Anagrams groups strings by their sorted character sequence.
- 題號 249 為何適合此 Pattern：Group Shifted Strings groups strings by normalized distance differences.
