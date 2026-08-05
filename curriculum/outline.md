# Curriculum Outline（Stage 1 草稿，唯一人工定稿檢查點）

審核重點：顆粒度（Topic 5–12 / Module 10–30）、Concept 順序、prerequisite/next 依賴方向、
每個 Concept 的候選 `leetcode` 題號是否合理——非逐篇審 Author Hints 文字。

## Level 0 · Programming Mindset（`programming-mindset`）

### Programming Mindset（`programming-mindset`） — 10 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `computational-thinking-basics` | Computational Thinking Basics | easy | — | input-output-contract, array-memory-layout, dp-core-concept-introduction | — |
| 002 | `input-output-contract` | Input-Output Contract | easy | computational-thinking-basics | mental-model-variables | — |
| 003 | `mental-model-variables` | Mental Model of Variables | easy | input-output-contract | tracing-execution-flow, array-memory-layout, linked-list-node-memory-model, stack-core-concept-introduction | — |
| 004 | `tracing-execution-flow` | Tracing Execution Flow | easy | mental-model-variables | conditional-branching-logic, array-two-pointers-sliding | — |
| 005 | `conditional-branching-logic` | Conditional Branching Logic | easy | tracing-execution-flow | loop-invariant-thinking, array-two-pointers-opposite | — |
| 006 | `loop-invariant-thinking` | Loop Invariant Thinking | medium | conditional-branching-logic | problem-simplification-strategy, array-linear-scan | — |
| 007 | `problem-simplification-strategy` | Problem Simplification Strategy | easy | loop-invariant-thinking | edge-case-enumeration, array-in-place-removal | — |
| 008 | `edge-case-enumeration` | Edge Case Enumeration | easy | problem-simplification-strategy | spacetime-tradeoff-awareness, array-two-pointers-variable | — |
| 009 | `spacetime-tradeoff-awareness` | Space-Time Tradeoff Awareness | medium | edge-case-enumeration | error-driven-refinement, array-prefix-sum-basic | — |
| 010 | `error-driven-refinement` | Error-Driven Refinement | easy | spacetime-tradeoff-awareness | array-move-zeroes | — |

## Level 1 · Array（`array`）

### Array（`array`） — 10 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `array-memory-layout` | Array Memory Layout and Indexing | easy | computational-thinking-basics, mental-model-variables | array-linear-scan, binary-search-core-concept, hash-table-concept-introduction, stack-array-implementation | — |
| 002 | `array-linear-scan` | Array Linear Scan and Traversal | easy | array-memory-layout, loop-invariant-thinking | array-prefix-sum-basic, array-two-pointers-opposite, array-in-place-removal, hash-table-frequency-counting, sliding-window-concept-intro, stack-asteroid-collision, stack-daily-temperatures, two-pointer-interval-merging-check | 1480, 1929 |
| 003 | `array-prefix-sum-basic` | Basic Prefix Sum Construction | easy | array-linear-scan, spacetime-tradeoff-awareness | array-range-sum-query, hash-table-prefix-sum-frequency | 1480 |
| 004 | `array-range-sum-query` | Range Sum Query Using Prefix Sum | medium | array-prefix-sum-basic | array-two-pointers-opposite | 303 |
| 005 | `array-two-pointers-opposite` | Two Pointers from Opposite Ends | easy | array-linear-scan, conditional-branching-logic, array-range-sum-query | array-two-pointers-sliding, hash-table-complement-lookup, string-two-pointers-opposite, two-pointer-boats-to-save-people, two-pointer-three-sum-basic, two-pointer-container-water, two-pointer-sort-array-by-parity | 344, 977 |
| 006 | `array-two-pointers-sliding` | Sliding Window Fixed Size | medium | array-two-pointers-opposite, tracing-execution-flow | array-two-pointers-variable, hash-table-sliding-window-distinct | 643 |
| 007 | `array-two-pointers-variable` | Sliding Window Variable Size | medium | array-two-pointers-sliding, edge-case-enumeration | array-in-place-removal | 209 |
| 008 | `array-in-place-removal` | In-Place Element Removal with Fast-Slow Pointers | easy | array-linear-scan, problem-simplification-strategy, array-two-pointers-variable | array-in-place-deduplication | 27 |
| 009 | `array-in-place-deduplication` | In-Place Deduplication in Sorted Array | easy | array-in-place-removal | array-move-zeroes | 26 |
| 010 | `array-move-zeroes` | Moving Zeroes to End | easy | array-in-place-deduplication, error-driven-refinement | — | 283 |

## Level 2 · Hash Table（`hash-table`）

### Hash Table（`hash-table`） — 10 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `hash-table-concept-introduction` | Introduction to Hash Table and Key-Value Mapping | easy | array-memory-layout | hash-table-frequency-counting, hash-table-complement-lookup, hash-table-existence-tracking, hash-table-design-lru-cache, string-ascii-representation | 1, 217 |
| 002 | `hash-table-frequency-counting` | Frequency Counting with Hash Map | easy | hash-table-concept-introduction, array-linear-scan | hash-table-complement-lookup, hash-table-sliding-window-frequency, hash-table-grouping-anagrams, hash-table-prefix-sum-frequency, sliding-window-permutation-in-string, sliding-window-minimum-window-substring | 387, 383 |
| 003 | `hash-table-complement-lookup` | Complement Lookup for Pair Finding | easy | hash-table-concept-introduction, array-two-pointers-opposite, hash-table-frequency-counting | hash-table-existence-tracking | 1, 1679 |
| 004 | `hash-table-existence-tracking` | Existence Tracking and Set Membership | easy | hash-table-concept-introduction, hash-table-complement-lookup | hash-table-sliding-window-distinct, hash-table-longest-consecutive-sequence, sliding-window-longest-substring-no-repeat | 217, 219 |
| 005 | `hash-table-sliding-window-distinct` | Sliding Window with Hash Set for Distinct Elements | medium | hash-table-existence-tracking, array-two-pointers-sliding | hash-table-sliding-window-frequency | 3, 219 |
| 006 | `hash-table-sliding-window-frequency` | Sliding Window with Hash Map Frequency Balancing | medium | hash-table-frequency-counting, hash-table-sliding-window-distinct | hash-table-grouping-anagrams, string-sliding-window-fixed | 438, 76 |
| 007 | `hash-table-grouping-anagrams` | Grouping Elements by Canonical Hash Key | medium | hash-table-frequency-counting, hash-table-sliding-window-frequency | hash-table-prefix-sum-frequency, string-anagram-grouping | 49, 249 |
| 008 | `hash-table-prefix-sum-frequency` | Prefix Sum Frequency for Subarray Counts | medium | array-prefix-sum-basic, hash-table-frequency-counting, hash-table-grouping-anagrams | hash-table-longest-consecutive-sequence | 560, 525 |
| 009 | `hash-table-longest-consecutive-sequence` | Set-Based Sequence Building and Boundary Check | medium | hash-table-existence-tracking, hash-table-prefix-sum-frequency | hash-table-design-lru-cache | 128, 217 |
| 010 | `hash-table-design-lru-cache` | Hash Map with Doubly Linked List for O(1) Cache | medium | hash-table-concept-introduction, hash-table-longest-consecutive-sequence | — | 146, 460 |

## Level 3 · String（`string`）

### String（`string`） — 10 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `string-ascii-representation` | String ASCII and Character Codes | easy | hash-table-concept-introduction | string-linear-scan | 387 |
| 002 | `string-linear-scan` | String Linear Scan | easy | string-ascii-representation | string-two-pointers-opposite, stack-valid-parentheses, stack-remove-adjacent-duplicates, string-sliding-window-fixed, string-anagram-grouping, string-pattern-matching-basic, string-parsing-simulation, two-pointer-backspace-string-compare | 387, 242 |
| 003 | `string-two-pointers-opposite` | String Two Pointers: Opposite Direction | easy | string-linear-scan, array-two-pointers-opposite | string-two-pointers-filtering, string-palindrome-expansion, two-pointer-valid-palindrome-ii | 125 |
| 004 | `string-two-pointers-filtering` | String Two Pointers with Preprocessing | medium | string-two-pointers-opposite | string-sliding-window-fixed | 125, 680 |
| 005 | `string-sliding-window-fixed` | Fixed-Size Sliding Window on Strings | medium | string-linear-scan, hash-table-sliding-window-frequency, string-two-pointers-filtering | string-sliding-window-variable | 438, 567 |
| 006 | `string-sliding-window-variable` | Variable-Size Sliding Window on Strings | medium | string-sliding-window-fixed | string-anagram-grouping | 3, 424 |
| 007 | `string-anagram-grouping` | String Anagram Grouping and Hashing | medium | string-linear-scan, hash-table-grouping-anagrams, string-sliding-window-variable | string-palindrome-expansion | 49 |
| 008 | `string-palindrome-expansion` | Center Expansion for Palindromes | medium | string-two-pointers-opposite, string-anagram-grouping | string-pattern-matching-basic | 5 |
| 009 | `string-pattern-matching-basic` | Basic Substring Search | easy | string-linear-scan, string-palindrome-expansion | string-parsing-simulation | 28 |
| 010 | `string-parsing-simulation` | String Parsing and State Simulation | medium | string-linear-scan, string-pattern-matching-basic | — | 8, 14, 151 |

## Level 4 · Two Pointer（`two-pointer`）

### Two Pointer（`two-pointer`） — 10 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `two-pointer-three-sum-basic` | Three Sum Basic Logic | medium | array-two-pointers-opposite | two-pointer-three-sum-closest, two-pointer-four-sum-extension | 15 |
| 002 | `two-pointer-three-sum-closest` | Three Sum Closest Search | medium | two-pointer-three-sum-basic | two-pointer-four-sum-extension | 16 |
| 003 | `two-pointer-four-sum-extension` | Four Sum Nested Reduction | medium | two-pointer-three-sum-basic, two-pointer-three-sum-closest | two-pointer-container-water | 18 |
| 004 | `two-pointer-container-water` | Container With Most Water | medium | array-two-pointers-opposite, two-pointer-four-sum-extension | two-pointer-trapping-rain-water | 11 |
| 005 | `two-pointer-trapping-rain-water` | Trapping Rain Water Optimization | medium | two-pointer-container-water | two-pointer-boats-to-save-people | 42 |
| 006 | `two-pointer-boats-to-save-people` | Boats to Save People Matching | medium | array-two-pointers-opposite, two-pointer-trapping-rain-water | two-pointer-interval-merging-check | 881 |
| 007 | `two-pointer-interval-merging-check` | Interval Overlap Detection | medium | array-linear-scan, two-pointer-boats-to-save-people | two-pointer-backspace-string-compare | 56 |
| 008 | `two-pointer-backspace-string-compare` | Backspace String Compare Backward | easy | string-linear-scan, two-pointer-interval-merging-check | two-pointer-valid-palindrome-ii | 844 |
| 009 | `two-pointer-valid-palindrome-ii` | Valid Palindrome with Single Deletion | easy | string-two-pointers-opposite, two-pointer-backspace-string-compare | two-pointer-sort-array-by-parity | 680 |
| 010 | `two-pointer-sort-array-by-parity` | Sort Array by Parity Partition | easy | array-two-pointers-opposite, two-pointer-valid-palindrome-ii | — | 905 |

## Level 5 · Binary Search（`binary-search`）

### Binary Search（`binary-search`） — 10 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `binary-search-core-concept` | Binary Search Core Concept | easy | array-memory-layout | binary-search-inclusive-bounds | 704 |
| 002 | `binary-search-inclusive-bounds` | Binary Search Inclusive Bounds | easy | binary-search-core-concept | binary-search-overflow-prevention | 704 |
| 003 | `binary-search-overflow-prevention` | Binary Search Overflow Prevention | medium | binary-search-inclusive-bounds | binary-search-exclusive-bounds | 374 |
| 004 | `binary-search-exclusive-bounds` | Binary Search Exclusive Bounds | medium | binary-search-overflow-prevention | binary-search-lower-bound | 35 |
| 005 | `binary-search-lower-bound` | Binary Search Lower Bound | medium | binary-search-exclusive-bounds | binary-search-upper-bound | 34 |
| 006 | `binary-search-upper-bound` | Binary Search Upper Bound | medium | binary-search-lower-bound | binary-search-rotated-array | 34 |
| 007 | `binary-search-rotated-array` | Binary Search in Rotated Sorted Array | medium | binary-search-upper-bound | binary-search-rotated-duplicates | 33 |
| 008 | `binary-search-rotated-duplicates` | Binary Search Rotated Array with Duplicates | medium | binary-search-rotated-array | binary-search-find-minimum-rotated | 81 |
| 009 | `binary-search-find-minimum-rotated` | Find Minimum in Rotated Sorted Array | medium | binary-search-rotated-duplicates | binary-search-matrix-search | 153 |
| 010 | `binary-search-matrix-search` | Binary Search 2D Matrix | medium | binary-search-find-minimum-rotated | — | 74 |

## Level 6 · Sliding Window（`sliding-window`）

### Sliding Window（`sliding-window`） — 10 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `sliding-window-concept-intro` | Sliding Window Core Concept | easy | array-linear-scan | sliding-window-fixed-size | — |
| 002 | `sliding-window-fixed-size` | Fixed-Size Sliding Window | easy | sliding-window-concept-intro | sliding-window-variable-size-expansion, sliding-window-permutation-in-string | 643 |
| 003 | `sliding-window-variable-size-expansion` | Variable-Size Sliding Window: Expansion Phase | easy | sliding-window-fixed-size | sliding-window-variable-size-contraction, queue-sliding-window-maximum | — |
| 004 | `sliding-window-variable-size-contraction` | Variable-Size Sliding Window: Contraction Phase | medium | sliding-window-variable-size-expansion | sliding-window-longest-substring-no-repeat, sliding-window-max-consecutive-ones, sliding-window-minimum-window-substring | 209 |
| 005 | `sliding-window-longest-substring-no-repeat` | Longest Substring Without Repeating Characters | medium | sliding-window-variable-size-contraction, hash-table-existence-tracking | sliding-window-max-consecutive-ones, sliding-window-fruit-into-baskets | 3 |
| 006 | `sliding-window-max-consecutive-ones` | Max Consecutive Ones with Replacements | medium | sliding-window-variable-size-contraction, sliding-window-longest-substring-no-repeat | sliding-window-fruit-into-baskets | 1004 |
| 007 | `sliding-window-fruit-into-baskets` | Fruit Into Baskets (At Most K Distinct) | medium | sliding-window-longest-substring-no-repeat, sliding-window-max-consecutive-ones | sliding-window-permutation-in-string | 904 |
| 008 | `sliding-window-permutation-in-string` | Permutation in String (Exact Frequency Match) | medium | sliding-window-fixed-size, hash-table-frequency-counting, sliding-window-fruit-into-baskets | sliding-window-find-all-anagrams | 567 |
| 009 | `sliding-window-find-all-anagrams` | Find All Anagrams in a String | medium | sliding-window-permutation-in-string | sliding-window-minimum-window-substring | 438 |
| 010 | `sliding-window-minimum-window-substring` | Minimum Window Substring | medium | sliding-window-variable-size-contraction, hash-table-frequency-counting, sliding-window-find-all-anagrams | — | 76 |

## Level 7 · Stack（`stack`）

### Stack（`stack`） — 11 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `stack-core-concept-introduction` | Stack Core Concept Introduction | easy | mental-model-variables | stack-array-implementation, queue-core-concept-introduction, queue-using-stacks, stack-using-queues | — |
| 002 | `stack-array-implementation` | Stack Array Implementation | easy | stack-core-concept-introduction, array-memory-layout | stack-valid-parentheses, stack-asteroid-collision, stack-evaluate-reverse-polish-notation, stack-remove-adjacent-duplicates, stack-daily-temperatures | 155 |
| 003 | `stack-valid-parentheses` | Stack Valid Parentheses | easy | stack-array-implementation, string-linear-scan | stack-asteroid-collision | 20 |
| 004 | `stack-asteroid-collision` | Stack Asteroid Collision | medium | stack-array-implementation, array-linear-scan, stack-valid-parentheses | stack-evaluate-reverse-polish-notation | 735 |
| 005 | `stack-evaluate-reverse-polish-notation` | Stack Evaluate Reverse Polish Notation | medium | stack-array-implementation, stack-asteroid-collision | stack-remove-adjacent-duplicates | 150 |
| 006 | `stack-remove-adjacent-duplicates` | Stack Remove Adjacent Duplicates | easy | stack-array-implementation, string-linear-scan, stack-evaluate-reverse-polish-notation | stack-daily-temperatures | 1047 |
| 007 | `stack-daily-temperatures` | Stack Daily Temperatures | medium | stack-array-implementation, array-linear-scan, stack-remove-adjacent-duplicates | stack-next-greater-element-ii, stack-online-stock-span, stack-sum-of-subarray-minimums | 739 |
| 008 | `stack-next-greater-element-ii` | Stack Next Greater Element II | medium | stack-daily-temperatures | stack-online-stock-span | 503 |
| 009 | `stack-online-stock-span` | Stack Online Stock Span | medium | stack-daily-temperatures, stack-next-greater-element-ii | stack-sum-of-subarray-minimums | 901 |
| 010 | `stack-sum-of-subarray-minimums` | Stack Sum of Subarray Minimums | medium | stack-daily-temperatures, stack-online-stock-span | stack-maximal-rectangle-foundation | 907 |
| 011 | `stack-maximal-rectangle-foundation` | Stack Maximal Rectangle Foundation | medium | stack-sum-of-subarray-minimums | — | 84 |

## Level 8 · Queue（`queue`）

### Queue（`queue`） — 10 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `queue-core-concept-introduction` | Queue Core Concept Introduction | easy | stack-core-concept-introduction | queue-array-implementation, queue-using-stacks, stack-using-queues, queue-bfs-level-order-traversal, queue-sliding-window-maximum | — |
| 002 | `queue-array-implementation` | Queue Array Implementation | easy | queue-core-concept-introduction | queue-linked-list-implementation | — |
| 003 | `queue-linked-list-implementation` | Queue Linked List Implementation | medium | queue-array-implementation | queue-circular-buffer | — |
| 004 | `queue-circular-buffer` | Queue Circular Buffer | medium | queue-linked-list-implementation | queue-using-stacks | 622 |
| 005 | `queue-using-stacks` | Implement Queue using Stacks | easy | queue-core-concept-introduction, stack-core-concept-introduction, queue-circular-buffer | stack-using-queues | 232 |
| 006 | `stack-using-queues` | Implement Stack using Queues | easy | queue-core-concept-introduction, stack-core-concept-introduction, queue-using-stacks | queue-bfs-level-order-traversal | 225 |
| 007 | `queue-bfs-level-order-traversal` | Queue BFS Level Order Traversal | medium | queue-core-concept-introduction, stack-using-queues | queue-shortest-path-unweighted | 102 |
| 008 | `queue-shortest-path-unweighted` | Queue Shortest Path in Unweighted Graph | medium | queue-bfs-level-order-traversal | queue-matrix-multi-source-bfs | 111, 934 |
| 009 | `queue-matrix-multi-source-bfs` | Matrix Multi-Source BFS | medium | queue-shortest-path-unweighted | queue-sliding-window-maximum | 542, 994 |
| 010 | `queue-sliding-window-maximum` | Sliding Window Maximum with Monotonic Queue | medium | queue-core-concept-introduction, sliding-window-variable-size-expansion, queue-matrix-multi-source-bfs | — | 239 |

## Level 9 · Linked List（`linked-list`）

### Linked List（`linked-list`） — 12 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `linked-list-node-memory-model` | Linked List Node Memory Model | easy | mental-model-variables | linked-list-traversal-basics, tree-core-concept-introduction | — |
| 002 | `linked-list-traversal-basics` | Linked List Traversal Basics | easy | linked-list-node-memory-model | linked-list-insertion-head-tail | 876 |
| 003 | `linked-list-insertion-head-tail` | Linked List Insertion at Head and Tail | easy | linked-list-traversal-basics | linked-list-deletion-by-value-or-index | 707 |
| 004 | `linked-list-deletion-by-value-or-index` | Linked List Deletion by Value or Index | easy | linked-list-insertion-head-tail | linked-list-dummy-head-pattern | 237, 203 |
| 005 | `linked-list-dummy-head-pattern` | Linked List Dummy Head Pattern | easy | linked-list-deletion-by-value-or-index | linked-list-two-pointers-slow-fast | 203, 83 |
| 006 | `linked-list-two-pointers-slow-fast` | Linked List Two Pointers: Slow and Fast | medium | linked-list-dummy-head-pattern | linked-list-cycle-detection-floyd | 876, 19 |
| 007 | `linked-list-cycle-detection-floyd` | Linked List Cycle Detection (Floyd's Algorithm) | medium | linked-list-two-pointers-slow-fast | linked-list-cycle-start-node | 141 |
| 008 | `linked-list-cycle-start-node` | Linked List Cycle Start Node | medium | linked-list-cycle-detection-floyd | linked-list-reversal-iterative | 142 |
| 009 | `linked-list-reversal-iterative` | Linked List Reversal (Iterative) | medium | linked-list-cycle-start-node | linked-list-reversal-recursive | 206 |
| 010 | `linked-list-reversal-recursive` | Linked List Reversal (Recursive) | medium | linked-list-reversal-iterative | linked-list-merge-two-sorted | 206 |
| 011 | `linked-list-merge-two-sorted` | Merge Two Sorted Linked Lists | easy | linked-list-reversal-recursive | linked-list-palindrome-check | 21 |
| 012 | `linked-list-palindrome-check` | Palindrome Linked List Check | medium | linked-list-merge-two-sorted | — | 234 |

## Level 10 · Tree（`tree`）

### Tree（`tree`） — 11 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `tree-core-concept-introduction` | Tree Core Concept Introduction | easy | linked-list-node-memory-model | tree-binary-tree-node-representation, graph-core-concept-introduction, heap-core-concept-introduction | — |
| 002 | `tree-binary-tree-node-representation` | Binary Tree Node Representation | easy | tree-core-concept-introduction | tree-dfs-preorder-traversal | — |
| 003 | `tree-dfs-preorder-traversal` | DFS Preorder Traversal | easy | tree-binary-tree-node-representation | tree-dfs-inorder-traversal | 144 |
| 004 | `tree-dfs-inorder-traversal` | DFS Inorder Traversal | easy | tree-dfs-preorder-traversal | tree-dfs-postorder-traversal | 94 |
| 005 | `tree-dfs-postorder-traversal` | DFS Postorder Traversal | easy | tree-dfs-inorder-traversal | tree-maximum-depth-bottom-up | 145 |
| 006 | `tree-maximum-depth-bottom-up` | Maximum Depth of Binary Tree (Bottom-Up) | easy | tree-dfs-postorder-traversal | tree-maximum-depth-top-down, tree-balanced-binary-tree-check, tree-same-tree-validation | 104 |
| 007 | `tree-maximum-depth-top-down` | Maximum Depth of Binary Tree (Top-Down) | medium | tree-maximum-depth-bottom-up | tree-balanced-binary-tree-check | 104 |
| 008 | `tree-balanced-binary-tree-check` | Balanced Binary Tree Check | medium | tree-maximum-depth-bottom-up, tree-maximum-depth-top-down | tree-same-tree-validation | 110 |
| 009 | `tree-same-tree-validation` | Same Tree Validation | easy | tree-maximum-depth-bottom-up, tree-balanced-binary-tree-check | tree-symmetric-tree-check | 100 |
| 010 | `tree-symmetric-tree-check` | Symmetric Tree Check | easy | tree-same-tree-validation | tree-invert-binary-tree | 101 |
| 011 | `tree-invert-binary-tree` | Invert Binary Tree | easy | tree-symmetric-tree-check | — | 226 |

## Level 11 · Graph（`graph`）

### Graph（`graph`） — 10 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `graph-core-concept-introduction` | Graph Core Concept Introduction | easy | tree-core-concept-introduction | graph-adjacency-list-representation, dfs-bfs-core-concept-introduction | — |
| 002 | `graph-adjacency-list-representation` | Graph Adjacency List Representation | easy | graph-core-concept-introduction | graph-adjacency-matrix-representation, graph-dfs-traversal | 133 |
| 003 | `graph-adjacency-matrix-representation` | Graph Adjacency Matrix Representation | easy | graph-adjacency-list-representation | graph-dfs-traversal | — |
| 004 | `graph-dfs-traversal` | Graph DFS Traversal | medium | graph-adjacency-list-representation, graph-adjacency-matrix-representation | graph-bfs-traversal, backtracking-core-concept-introduction, backtracking-word-search, graph-connected-components | 200 |
| 005 | `graph-bfs-traversal` | Graph BFS Traversal | medium | graph-dfs-traversal | graph-connected-components | 994 |
| 006 | `graph-connected-components` | Graph Connected Components | easy | graph-dfs-traversal, graph-bfs-traversal | graph-detect-cycle-undirected | 323 |
| 007 | `graph-detect-cycle-undirected` | Graph Detect Cycle in Undirected Graph | medium | graph-connected-components | graph-detect-cycle-directed | 261 |
| 008 | `graph-detect-cycle-directed` | Graph Detect Cycle in Directed Graph | medium | graph-detect-cycle-undirected | graph-topological-sort-dfs | 207 |
| 009 | `graph-topological-sort-dfs` | Graph Topological Sort DFS | medium | graph-detect-cycle-directed | graph-topological-sort-bfs-kahns | 210 |
| 010 | `graph-topological-sort-bfs-kahns` | Graph Topological Sort BFS (Kahn's Algorithm) | medium | graph-topological-sort-dfs | — | 207 |

## Level 12 · Heap / Priority Queue（`heap`）

### Heap / Priority Queue（`heap`） — 10 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `heap-core-concept-introduction` | Heap and Priority Queue Core Concept | easy | tree-core-concept-introduction | heap-array-representation | — |
| 002 | `heap-array-representation` | Array Representation of Binary Heap | easy | heap-core-concept-introduction | heap-sift-up-insertion | — |
| 003 | `heap-sift-up-insertion` | Heap Insertion and Sift-Up Operation | easy | heap-array-representation | heap-sift-down-extraction | — |
| 004 | `heap-sift-down-extraction` | Heap Extraction and Sift-Down Operation | medium | heap-sift-up-insertion | heapify-linear-time-construction | 215 |
| 005 | `heapify-linear-time-construction` | Linear Time Heap Construction (Heapify) | medium | heap-sift-down-extraction | heap-kth-largest-element | — |
| 006 | `heap-kth-largest-element` | Finding Kth Element with Heap | medium | heapify-linear-time-construction | heap-top-k-frequent-elements | 215, 703 |
| 007 | `heap-top-k-frequent-elements` | Top K Frequent Elements | medium | heap-kth-largest-element | heap-merge-k-sorted-lists | 347 |
| 008 | `heap-merge-k-sorted-lists` | Merge K Sorted Lists | medium | heap-top-k-frequent-elements | heap-find-median-from-data-stream | 23 |
| 009 | `heap-find-median-from-data-stream` | Find Median from Data Stream | medium | heap-merge-k-sorted-lists | heap-task-scheduler | 295 |
| 010 | `heap-task-scheduler` | Task Scheduler with Cooldown | medium | heap-find-median-from-data-stream | — | 621 |

## Level 13 · Backtracking（`backtracking`）

### Backtracking（`backtracking`） — 10 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `backtracking-core-concept-introduction` | Backtracking Core Concept Introduction | easy | graph-dfs-traversal | backtracking-subset-generation, backtracking-permutation-basics, backtracking-palindrome-partitioning, backtracking-word-search, backtracking-n-queens-diagonal-pruning | 78 |
| 002 | `backtracking-subset-generation` | Backtracking Subset Generation | easy | backtracking-core-concept-introduction | backtracking-subset-with-duplicates, backtracking-combination-sum | 78, 90 |
| 003 | `backtracking-subset-with-duplicates` | Backtracking Subset with Duplicates | medium | backtracking-subset-generation | backtracking-combination-sum, backtracking-combination-sum-ii, backtracking-permutation-with-duplicates | 90 |
| 004 | `backtracking-combination-sum` | Backtracking Combination Sum | medium | backtracking-subset-generation, backtracking-subset-with-duplicates | backtracking-combination-sum-ii | 39 |
| 005 | `backtracking-combination-sum-ii` | Backtracking Combination Sum II | medium | backtracking-combination-sum, backtracking-subset-with-duplicates | backtracking-permutation-basics | 40 |
| 006 | `backtracking-permutation-basics` | Backtracking Permutation Basics | medium | backtracking-core-concept-introduction, backtracking-combination-sum-ii | backtracking-permutation-with-duplicates | 46 |
| 007 | `backtracking-permutation-with-duplicates` | Backtracking Permutation with Duplicates | medium | backtracking-permutation-basics, backtracking-subset-with-duplicates | backtracking-palindrome-partitioning | 47 |
| 008 | `backtracking-palindrome-partitioning` | Backtracking Palindrome Partitioning | medium | backtracking-core-concept-introduction, backtracking-permutation-with-duplicates | backtracking-word-search | 131 |
| 009 | `backtracking-word-search` | Backtracking Word Search | medium | backtracking-core-concept-introduction, graph-dfs-traversal, backtracking-palindrome-partitioning | backtracking-n-queens-diagonal-pruning | 79 |
| 010 | `backtracking-n-queens-diagonal-pruning` | Backtracking N-Queens Diagonal Pruning | medium | backtracking-core-concept-introduction, backtracking-word-search | — | 51 |

## Level 14 · DFS / BFS（`dfs-bfs`）

### DFS / BFS（`dfs-bfs`） — 10 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `dfs-bfs-core-concept-introduction` | DFS / BFS 核心觀念介紹 | easy | graph-core-concept-introduction | dfs-recursive-implementation, bfs-queue-level-order | — |
| 002 | `dfs-recursive-implementation` | 遞迴式 DFS 實作 | easy | dfs-bfs-core-concept-introduction | dfs-visited-state-management | 200 |
| 003 | `dfs-visited-state-management` | DFS 已造訪狀態管理 | easy | dfs-recursive-implementation | bfs-queue-level-order, matrix-dfs-grid-exploration, graph-connected-components-count | 733 |
| 004 | `bfs-queue-level-order` | BFS 與佇列層級走訪 | easy | dfs-bfs-core-concept-introduction, dfs-visited-state-management | bfs-shortest-path-unweighted, matrix-bfs-multi-directional, graph-bipartite-check | 102 |
| 005 | `bfs-shortest-path-unweighted` | 未加權圖的最短路徑 | medium | bfs-queue-level-order | matrix-dfs-grid-exploration | 111 |
| 006 | `matrix-dfs-grid-exploration` | 二維網格的 DFS 探索 | medium | dfs-visited-state-management, bfs-shortest-path-unweighted | matrix-bfs-multi-directional | 695 |
| 007 | `matrix-bfs-multi-directional` | 二維網格的 BFS 擴散 | medium | bfs-queue-level-order, matrix-dfs-grid-exploration | graph-connected-components-count | 994 |
| 008 | `graph-connected-components-count` | 圖形連通分量計算 | medium | dfs-visited-state-management, matrix-bfs-multi-directional | graph-cycle-detection-undirected | 323 |
| 009 | `graph-cycle-detection-undirected` | 無向圖環路偵測 | medium | graph-connected-components-count | graph-bipartite-check | 261 |
| 010 | `graph-bipartite-check` | 二分圖判定 | medium | bfs-queue-level-order, graph-cycle-detection-undirected | — | 785 |

## Level 15 · Dynamic Programming（`dynamic-programming`）

### Dynamic Programming（`dynamic-programming`） — 11 Concept

| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | `dp-core-concept-introduction` | Dynamic Programming Core Concept Introduction | easy | computational-thinking-basics | dp-memoization-top-down | 509, 70 |
| 002 | `dp-memoization-top-down` | Top-Down DP with Memoization | easy | dp-core-concept-introduction | dp-tabulation-bottom-up | 509, 70 |
| 003 | `dp-tabulation-bottom-up` | Bottom-Up DP with Tabulation | medium | dp-memoization-top-down | dp-space-optimization-rolling, dp-grid-path-counting | 70, 746 |
| 004 | `dp-space-optimization-rolling` | Space Optimization with Rolling Variables | medium | dp-tabulation-bottom-up | dp-linear-robber-pattern | 70, 198 |
| 005 | `dp-linear-robber-pattern` | Linear House Robber Pattern | medium | dp-space-optimization-rolling | dp-grid-path-counting, dp-knapsack-01-basic | 198, 213 |
| 006 | `dp-grid-path-counting` | Grid Path Counting | medium | dp-tabulation-bottom-up, dp-linear-robber-pattern | dp-grid-minimum-path-sum, dp-string-lcs-basic | 62, 63 |
| 007 | `dp-grid-minimum-path-sum` | Grid Minimum Path Sum | medium | dp-grid-path-counting | dp-knapsack-01-basic | 64, 120 |
| 008 | `dp-knapsack-01-basic` | 0/1 Knapsack Basic Pattern | medium | dp-linear-robber-pattern, dp-grid-minimum-path-sum | dp-knapsack-unbounded | 416, 494 |
| 009 | `dp-knapsack-unbounded` | Unbounded Knapsack Pattern | medium | dp-knapsack-01-basic | dp-string-lcs-basic | 322, 518 |
| 010 | `dp-string-lcs-basic` | Longest Common Subsequence | medium | dp-grid-path-counting, dp-knapsack-unbounded | dp-string-edit-distance | 1143, 583 |
| 011 | `dp-string-edit-distance` | Edit Distance Pattern | medium | dp-string-lcs-basic | — | 72, 712 |
