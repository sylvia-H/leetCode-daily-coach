# 驗證修改後的 quiz-aspects.ts / quiz-items.ts prompt 是否改善題數分布
# 只對已產生的 6 個低題數 Concept 用 --force 重跑，不動其餘 159 個（省時間、省額度）

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

if (-not $env:GEMINI_API_KEY) {
    Write-Error "GEMINI_API_KEY 未設定於本 session。請先執行：`$env:GEMINI_API_KEY = '<your key>'，再重新執行本腳本。"
    exit 1
}

$targets = "computational-thinking-basics,input-output-contract,mental-model-variables,tracing-execution-flow,conditional-branching-logic,loop-invariant-thinking"

Write-Output "===== 驗證跑：對 6 個既有低題數 Concept 用 --force --only 重新產生 ====="
Write-Output "目標：$targets"
Write-Output "開始時間：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
npm run generate:quiz-bank -- --force --only $targets *> generate-quiz-bank-validate.log
$exitCode = $LASTEXITCODE
Write-Output "結束時間：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Output "Exit code: $exitCode"
Write-Output "---- 完整輸出 ----"
Get-Content generate-quiz-bank-validate.log

Write-Output ""
Write-Output "===== 完成。請把 generate-quiz-bank-validate.log 回報給 Claude 檢視改善幅度 ====="