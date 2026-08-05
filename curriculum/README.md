# Curriculum 骨架（`modules.json`）

`modules.json` 是課程 **Module → Topic 骨架的手寫來源真相**（`docs/spec.md` §8.1）。
Deterministic、版本控制、**授權手寫**（與 `schedules/*.json` 這類 MUST NOT 手寫的生成物不同）。

## 凍結紀律（FR-001b / FR-001c）

- **Module 的身分與順序 MUST 嚴格凍結**：`modules` 陣列即完整 16 個 Level（Level 0 Programming
  Mindset ～ Level 15 Dynamic Programming），`level` 欄位 MUST 等於陣列索引。**MUST NOT 於後續
  Feature 重排或增刪 Module**（Deterministic Curriculum，憲章 IV）。
- **Topic 清單為 F2 交付的骨架**：每個 Module 的第一個（主）Topic id **沿用該 Module 的 id**
  （對應 `concepts/{topic}/` 資料夾）；需再細分時才增列其他 Topic id（`topic.id` MUST 跨全部
  Module 全域唯一）。
- F7 outline 若需在**不改 Module 順序**的前提下調整某 Module 的 Topic，MUST 走既定紀律：
  **改 `modules.json` → 重跑 `npm run validate:curriculum` → review diff → commit**。
  MUST NOT 於 runtime 變更。

## 驗證

`npm run validate:curriculum` 會載入本檔 + `concepts/**`，執行 schema / DAG / 顆粒度驗證
（單一實作 `src/compiler/curriculum.ts`，供 F5 / F7 / CI 重用）。
