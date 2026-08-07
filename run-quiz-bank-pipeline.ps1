# F11 題庫產線人工執行腳本（T037-T039，quickstart.md §1／§1.1／§1.2）
# 執行前提：本 session 已設定 $env:GEMINI_API_KEY（你稍早已設定過，若換了新視窗請重新設定）。
# 用法：在 repo root 開一個 PowerShell，執行： .\run-quiz-bank-pipeline.ps1
# 產出：repo root 下的 generate-quiz-bank-run1.log／run2.log（*.log 已在 .gitignore，不會被誤 commit）。
# 執行時間提醒：165 個 Concept、預估約 1,500 次 LLM 呼叫，預設 RPM 上限 10（每分鐘 10 次），
# 保守估計整體會跑數小時。請保持這個視窗不要關閉／不要讓電腦睡眠，過程中可以先去做別的事。

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

if (-not $env:GEMINI_API_KEY) {
    Write-Error "GEMINI_API_KEY 未設定於本 session。請先執行：`$env:GEMINI_API_KEY = '<your key>'，再重新執行本腳本。"
    exit 1
}

Write-Output "===== T037：首次執行 npm run generate:quiz-bank（產出 data/quiz-bank.json）====="
Write-Output "開始時間：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
npm run generate:quiz-bank *> generate-quiz-bank-run1.log
$exit1 = $LASTEXITCODE
Write-Output "結束時間：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output "Exit code: $exit1"
Write-Output "---- 尾端 60 行 ----"
Get-Content generate-quiz-bank-run1.log -Tail 60

if ($exit1 -ne 0) {
    Write-Output ""
    Write-Output "⚠️ 第一次執行非零 exit code，可能有 Concept 需要人工檢視（needsHumanReview）或 Gate 違規。"
    Write-Output "完整記錄在 generate-quiz-bank-run1.log，可先貼給 Claude 檢視，不一定要立即重跑。"
}

Write-Output ""
Write-Output "===== T038：第二次執行驗證冪等（預期全部印出「跳過」、零 LLM 呼叫、data/quiz-bank.json 不變）====="
Write-Output "開始時間：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
npm run generate:quiz-bank *> generate-quiz-bank-run2.log
$exit2 = $LASTEXITCODE
Write-Output "結束時間：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output "Exit code: $exit2"
Write-Output "---- 尾端 60 行 ----"
Get-Content generate-quiz-bank-run2.log -Tail 60

Write-Output ""
Write-Output "===== 驗證 data/quiz-bank.json 在第二次執行後未變更 ====="
git status --porcelain -- data/quiz-bank.json

Write-Output ""
Write-Output "===== 驗證未觸碰其他生成物目錄（concepts/ articles/ schedules/ curriculum/）====="
git status --porcelain -- concepts/ articles/ schedules/ curriculum/

Write-Output ""
Write-Output "===== 完成。請把 generate-quiz-bank-run1.log／run2.log 的路徑或內容回報給 Claude 繼續驗收 ====="