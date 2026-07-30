---
id: hash-table-frequency-counting
title: Frequency Counting with Hash Map
module: hash-table
topic: hash-table
difficulty: easy
estimated_minutes: 10
pattern_label: Frequency Map
complexity_label: O(n) / O(n)
prerequisite:
  - hash-table-concept-introduction
  - array-linear-scan
next:
  - hash-table-complement-lookup
  - hash-table-sliding-window-frequency
  - hash-table-grouping-anagrams
  - hash-table-prefix-sum-frequency
  - sliding-window-permutation-in-string
  - sliding-window-minimum-window-substring
learning_goal:
  - Count occurrences of elements in a collection efficiently using a hash map.
exit_criteria:
  - Can build a frequency map from an array
  - Can iterate through map entries to find maximum or matching frequencies
leetcode:
  - 387
  - 383
tags:
  - hash-table
  - counting
---

## Author Hints

- 核心觀念：Count the frequency of each element by using elements as keys and counts as values.
- Pattern 辨識線索：Problem asks for counts, duplicates, most frequent, or unique occurrences.
- Thinking：Iterate through the collection once, incrementing the count for each key encountered.
- Common Mistakes：Forgetting to initialize the count to 0 or 1 when encountering a key for the first time.
- TypeScript 重點：Use map.get(key) || 0 to safely handle missing keys when incrementing counts.
- Python 重點：Use collections.Counter for concise frequency counting.
- 題號 387 為何適合此 Pattern：First Unique Character requires counting character frequencies first.
- 題號 383 為何適合此 Pattern：Ransom Note checks if magazine character counts satisfy ransom note requirements.
