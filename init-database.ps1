$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $projectRoot

try {
    docker compose ps --status running --services | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not read Docker Compose status. Run .\start_all.ps1 first.'
    }

    $runningServices = docker compose ps --status running --services
    if ($LASTEXITCODE -ne 0 -or $runningServices -notcontains 'app') {
        throw 'The backend is not running. Run .\start_all.ps1 before initializing the database.'
    }

    docker compose exec -T app php artisan migrate --seed --force
    if ($LASTEXITCODE -ne 0) {
        throw 'Database initialization failed.'
    }

    Write-Host 'Migrations and sample data seeding completed.'
}
finally {
    Pop-Location
}
