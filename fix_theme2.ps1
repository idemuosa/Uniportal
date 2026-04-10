$dir = "c:\Users\sagacious wizzy\Desktop\schoolportal\src\components"
$files = @(
    "StudentPortal.tsx",
    "LoanApplicationForm.tsx",
    "ClearanceForm.tsx"
)

foreach ($f in $files) {
    $path = Join-Path $dir $f
    if (Test-Path $path) {
        $c = [System.IO.File]::ReadAllText($path)
        $c = $c -replace 'bg-emerald-950/40', 'bg-slate-50'
        $c = $c -replace 'bg-emerald-950/20', 'bg-[#008751]/5'
        $c = $c -replace 'bg-emerald-950', 'bg-slate-50'
        $c = $c -replace 'text-emerald-950', 'text-[#008751]'
        [System.IO.File]::WriteAllText($path, $c)
        Write-Output "Fixed: $f"
    }
}
Write-Output "Done!"
