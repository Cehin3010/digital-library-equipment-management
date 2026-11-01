$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $projectRoot

try {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Docker CLI not found. Install and start Docker Desktop first.'
    }

    docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker Engine is not running. Start Docker Desktop, wait until it is ready, then retry.'
    }

    if (-not (Test-Path 'backend\.env')) {
        Copy-Item 'backend\.env.example' 'backend\.env'
        Write-Host 'Created backend\.env from its example.'
    }

    if (-not (Test-Path 'frontend\.env')) {
        Copy-Item 'frontend\.env.example' 'frontend\.env'
        Write-Host 'Created frontend\.env from its example.'
    }

    docker compose up -d --build db frontend app
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker build/start failed. Review the error above or run: docker compose logs'
    }

    docker compose exec -T app composer install --no-interaction
    if ($LASTEXITCODE -ne 0) {
        throw 'Laravel dependency installation failed.'
    }

    docker compose restart app
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not restart the Laravel application after installing dependencies.'
    }

    $appKeyLine = Get-Content 'backend\.env' | Where-Object { $_ -match '^APP_KEY=' } | Select-Object -First 1
    if ($appKeyLine -match '^APP_KEY=(.*)$' -and [string]::IsNullOrWhiteSpace($Matches[1])) {
        docker compose exec -T app php artisan key:generate --force
        if ($LASTEXITCODE -ne 0) {
            throw 'Could not generate the Laravel APP_KEY.'
        }
    }

    Write-Warning 'Demo mode: this startup resets all database data and recreates the sample data.'
    docker compose exec -T app php artisan migrate:fresh --seed --force
    if ($LASTEXITCODE -ne 0) {
        throw 'Database reset and sample data initialization failed.'
    }

    docker compose up -d nginx scheduler queue-worker
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not start the reverse proxy or background services.'
    }

    Write-Host ''
    Write-Host 'Services are running.'
    Write-Host 'Frontend: http://localhost:5174'
    Write-Host 'API health: http://localhost:8080/api/health'
    Write-Host 'Stop services: .\stop_all.ps1'
}
finally {
    Pop-Location
}
