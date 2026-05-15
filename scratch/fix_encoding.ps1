$content = Get-Content -Path Antigravity.md -Encoding Default
$content | Set-Content -Path Antigravity.md -Encoding UTF8
$content2 = Get-Content -Path ForLearning.md -Encoding Default
$content2 | Set-Content -Path ForLearning.md -Encoding UTF8
