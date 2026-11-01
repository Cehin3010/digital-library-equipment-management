param(
    [switch]$RemoveVolumes
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $projectRoot

try {
    if ($RemoveVolumes) {
        Write-Warning 'Removing volumes permanently deletes this project database.'
        $confirmation = Read-Host 'Type DELETE to confirm database removal'
        if ($confirmation -cne 'DELETE') {
            Write-Host 'Cancelled. No volumes were removed.'
            return
        }

        docker compose down --volumes
    }
    else {
        docker compose down
    }

    if ($LASTEXITCODE -ne 0) {
        throw 'Could not stop Docker Compose.'
    }
}
finally {
    Pop-Location
}
