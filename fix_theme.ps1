$dir = "c:\Users\sagacious wizzy\Desktop\schoolportal\src\components"
$files = @(
    "StudentPortal.tsx",
    "AdminAuth.tsx",
    "AdmissionForm.tsx",
    "CourseRegistration.tsx",
    "ClearanceForm.tsx",
    "HostelAllocation.tsx",
    "Results.tsx",
    "CameraCapture.tsx",
    "AdminDashboard.tsx",
    "LoanApplicationForm.tsx"
)

foreach ($f in $files) {
    $path = Join-Path $dir $f
    if (Test-Path $path) {
        $c = [System.IO.File]::ReadAllText($path)
        
        # Background replacements (dark -> light)
        $c = $c -replace 'bg-slate-950/40', 'bg-slate-50'
        $c = $c -replace 'bg-slate-950/20', 'bg-white'
        $c = $c -replace 'bg-slate-950', 'bg-white'
        $c = $c -replace 'bg-slate-900/60', 'bg-slate-50'
        $c = $c -replace 'bg-slate-900/50', 'bg-slate-50'
        $c = $c -replace 'bg-slate-900', 'bg-white'
        $c = $c -replace 'bg-black/60', 'bg-slate-50'
        $c = $c -replace 'bg-black/50', 'bg-slate-50'
        $c = $c -replace 'bg-black/40', 'bg-slate-50'
        $c = $c -replace 'bg-black/30', 'bg-slate-50'
        $c = $c -replace 'bg-black/20', 'bg-white'
        $c = $c -replace 'bg-black', 'bg-white'
        
        # Text color replacements
        $c = $c -replace 'text-white/80', 'text-[#008751]/80'
        $c = $c -replace 'text-white/60', 'text-[#008751]/50'
        $c = $c -replace 'text-white/40', 'text-[#008751]/35'
        $c = $c -replace 'text-white/30', 'text-[#008751]/25'
        $c = $c -replace 'text-white/20', 'text-[#008751]/15'
        $c = $c -replace 'text-white/10', 'text-[#008751]/10'
        $c = $c -replace 'text-white/5', 'text-[#008751]/5'
        $c = $c -replace 'text-emerald-300', 'text-[#008751]'
        $c = $c -replace 'text-emerald-400', 'text-[#008751]'
        $c = $c -replace 'text-green-300', 'text-[#008751]'
        $c = $c -replace 'text-green-400/80', 'text-[#008751]/60'
        $c = $c -replace 'text-green-400/60', 'text-[#008751]/45'
        $c = $c -replace 'text-green-400/50', 'text-[#008751]/40'
        $c = $c -replace 'text-green-400/40', 'text-[#008751]/30'
        $c = $c -replace 'text-green-400', 'text-[#008751]'
        $c = $c -replace 'text-green-200', 'text-[#008751]'
        $c = $c -replace 'text-green-100', 'text-[#008751]'
        $c = $c -replace 'text-green-500/40', 'text-[#008751]/30'
        $c = $c -replace 'text-green-500/50', 'text-[#008751]/40'
        $c = $c -replace 'text-green-500', 'text-[#008751]'
        $c = $c -replace 'text-green-600', 'text-[#008751]'
        
        # Border replacements
        $c = $c -replace 'border-white/10', 'border-[#008751]/8'
        $c = $c -replace 'border-white/20', 'border-[#008751]/15'
        $c = $c -replace 'border-white/5', 'border-[#008751]/5'
        $c = $c -replace 'border-green-500/20', 'border-[#008751]/10'
        $c = $c -replace 'border-green-500/30', 'border-[#008751]/15'
        $c = $c -replace 'border-green-500/40', 'border-[#008751]/20'
        $c = $c -replace 'border-green-500/50', 'border-[#008751]/25'
        $c = $c -replace 'border-green-500/10', 'border-[#008751]/5'
        $c = $c -replace 'border-green-400', 'border-[#008751]'
        $c = $c -replace 'border-green-500', 'border-[#008751]'
        $c = $c -replace 'border-green-700/50', 'border-[#008751]/20'
        
        # Background accent replacements
        $c = $c -replace 'bg-green-500/10', 'bg-[#008751]/8'
        $c = $c -replace 'bg-green-500/20', 'bg-[#008751]/10'
        $c = $c -replace 'bg-green-500/5', 'bg-[#008751]/5'
        $c = $c -replace 'bg-green-900/80', 'bg-[#008751]/10'
        $c = $c -replace 'bg-green-900/30', 'bg-[#008751]/5'
        $c = $c -replace 'bg-green-900', 'bg-[#008751]/8'
        $c = $c -replace 'bg-green-600', 'bg-[#008751]'
        $c = $c -replace 'bg-white/10', 'bg-[#008751]/5'
        $c = $c -replace 'bg-white/5', 'bg-[#008751]/3'
        
        # Hover states
        $c = $c -replace 'hover:bg-white/10', 'hover:bg-[#008751]/5'
        $c = $c -replace 'hover:bg-white/5', 'hover:bg-[#008751]/3'
        $c = $c -replace 'hover:bg-green-900', 'hover:bg-[#008751]/5'
        $c = $c -replace 'hover:text-white', 'hover:text-[#008751]'
        $c = $c -replace 'hover:text-green-300', 'hover:text-[#008751]'
        $c = $c -replace 'hover:text-green-400', 'hover:text-[#008751]'
        $c = $c -replace 'hover:border-green-500/40', 'hover:border-[#008751]/20'
        $c = $c -replace 'hover:border-green-500/50', 'hover:border-[#008751]/25'
        $c = $c -replace 'hover:border-green-400/40', 'hover:border-[#008751]/20'
        $c = $c -replace 'hover:bg-green-500/40', 'hover:bg-[#008751]/15'
        
        # Glass card replacements
        $c = $c -replace 'glass-card neon-border', 'bg-white border border-[#008751]/8 rounded-2xl'
        $c = $c -replace 'glass-card', 'bg-white border border-[#008751]/8 rounded-2xl'
        $c = $c -replace 'neon-border', 'border-[#008751]/10'
        
        # "text-white" standalone (careful - only where it's the full class)
        $c = $c -replace "text-white'", "text-[#008751]'"
        $c = $c -replace 'text-white"', 'text-[#008751]"'
        $c = $c -replace 'text-white ', 'text-[#008751] '
        $c = $c -replace 'text-white`', 'text-[#008751]`'
        
        # Shadow/glow cleanup
        $c = $c -replace "shadow-\[0_0_10px_rgba\(22,163,74,[\d.]+\)\]", 'shadow-sm'
        $c = $c -replace "shadow-\[0_0_15px_rgba\(22,163,74,[\d.]+\)\]", 'shadow-sm'
        $c = $c -replace "shadow-\[0_0_20px_rgba\(22,163,74,[\d.]+\)\]", 'shadow-md'
        $c = $c -replace "shadow-\[0_0_25px_rgba\(22,163,74,[\d.]+\)\]", 'shadow-md'
        $c = $c -replace "shadow-\[0_0_30px_rgba\(255,255,255,[\d.]+\)\]", 'shadow-lg'
        $c = $c -replace "drop-shadow-\[0_0_\d+px_rgba\(74,222,128,[\d.]+\)\]", ''
        $c = $c -replace "drop-shadow-\[0_0_\d+px_rgba\(255,255,255,[\d.]+\)\]", ''
        
        # Ring replacements
        $c = $c -replace 'ring-1 ring-white/20', 'ring-1 ring-[#008751]/10'
        $c = $c -replace 'ring-1 ring-[#008751]/20', 'ring-1 ring-[#008751]/10'
        
        # Remaining green gradient buttons (keep as-is for buttons - green bg with white text is correct for buttons)
        # bg-gradient-to-b from-green-500 to-green-700 -> bg-[#008751]
        $c = $c -replace 'bg-gradient-to-b from-green-500 to-green-700', 'bg-[#008751]'

        [System.IO.File]::WriteAllText($path, $c)
        Write-Output "Updated: $f"
    } else {
        Write-Output "Not found: $f"
    }
}

Write-Output "Done!"
