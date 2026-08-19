$ErrorActionPreference = 'Stop'

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Label,

        [Parameter(Mandatory = $true)]
        [scriptblock]$Command
    )

    Write-Output "VERIFY_START: $Label"
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }
    Write-Output "VERIFY_OK: $Label"
}

$env:NODE_OPTIONS = '--max-old-space-size=4096'

Invoke-CheckedCommand -Label 'tests' -Command { npm.cmd test }
Invoke-CheckedCommand -Label 'typecheck' -Command { npx.cmd tsc --noEmit --pretty false }
Invoke-CheckedCommand -Label 'production build' -Command { npm.cmd run build }

Write-Output 'VERIFICATION_COMPLETE'
