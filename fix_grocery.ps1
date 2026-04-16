$file = "src\components\pantry\GroceryPlan.tsx"
$content = Get-Content $file -Raw
$old = '<h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Monthly Grocery Plan</h2>'
$new = '<SectionTitle>Monthly Grocery Plan</SectionTitle>'
$content = $content.Replace($old, $new)
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $file), $content, [System.Text.Encoding]::UTF8)
Write-Host "Done"
