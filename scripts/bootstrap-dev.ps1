param(
  [string]$SourcePath = (Get-Location).Path,
  [string]$SafePath = 'C:\dev\Taxsentry-UAE',
  [switch]$RefreshCopy,
  [switch]$SkipInstall,
  [switch]$NoStart
)

function Write-Step {
  param([string]$Message)
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Stop-StaleNodeProcesses {
  param(
    [string[]]$PathMarkers
  )

  Write-Step 'Stopping stale Node dev processes (Next/Nest/concurrently)'

  $processes = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue
  if (-not $processes) {
    return
  }

  foreach ($p in $processes) {
    $cmd = [string]$p.CommandLine
    if ([string]::IsNullOrWhiteSpace($cmd)) {
      continue
    }

    $isDevCmd = $cmd -match 'next dev|nest start|concurrently|npm run dev'
    $matchesPath = $false
    foreach ($marker in $PathMarkers) {
      if (-not [string]::IsNullOrWhiteSpace($marker) -and $cmd -like "*$marker*") {
        $matchesPath = $true
        break
      }
    }

    if ($isDevCmd -and $matchesPath) {
      try {
        Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop
        Write-Host "Stopped node PID $($p.ProcessId)" -ForegroundColor DarkGray
      } catch {
        Write-Host "Could not stop PID $($p.ProcessId): $($_.Exception.Message)" -ForegroundColor Yellow
      }
    }
  }
}

function Stop-PortListeners {
  param([int[]]$Ports)

  foreach ($port in $Ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if (-not $connections) {
      continue
    }

    foreach ($c in $connections) {
      try {
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction Stop
        Write-Host "Stopped process $($c.OwningProcess) on port $port" -ForegroundColor DarkGray
      } catch {
        Write-Host "Could not stop process $($c.OwningProcess) on port $port" -ForegroundColor Yellow
      }
    }
  }
}

function Ensure-SafeCopy {
  param(
    [string]$From,
    [string]$To,
    [switch]$ForceRefresh
  )

  if (-not (Test-Path $From)) {
    throw "SourcePath does not exist: $From"
  }

  $parent = Split-Path -Path $To -Parent
  if (-not (Test-Path $parent)) {
    New-Item -Path $parent -ItemType Directory | Out-Null
  }

  Write-Step "Syncing repo to safe path: $To"
  $null = robocopy $From $To /MIR /XD node_modules .next dist .git /R:1 /W:1 /NFL /NDL /NJH /NJS /NC /NS /NP
  $exitCode = $LASTEXITCODE
  if ($exitCode -gt 7) {
    throw "robocopy failed with exit code $exitCode"
  }
}

function Remove-IfExists {
  param([string]$Path)
  if (Test-Path $Path) {
    Remove-Item -Path $Path -Recurse -Force -ErrorAction SilentlyContinue
  }
}

try {
  Stop-StaleNodeProcesses -PathMarkers @($SourcePath, $SafePath)
  Stop-PortListeners -Ports @(3000, 3001)

  Ensure-SafeCopy -From $SourcePath -To $SafePath -ForceRefresh:$RefreshCopy

  Write-Step "Switching to safe repo path: $SafePath"
  Set-Location $SafePath

  if (-not $SkipInstall) {
    Write-Step 'Cleaning install/build artifacts'
    Remove-IfExists -Path (Join-Path $SafePath 'node_modules')
    Remove-IfExists -Path (Join-Path $SafePath 'apps\web\.next')
    Remove-IfExists -Path (Join-Path $SafePath 'apps\api\dist')

    $lockPath = Join-Path $SafePath 'package-lock.json'
    if (Test-Path $lockPath) {
      Remove-Item -Path $lockPath -Force -ErrorAction SilentlyContinue
    }

    Write-Step 'Installing dependencies'
    npm install
    if ($LASTEXITCODE -ne 0) {
      throw 'npm install failed'
    }

    Write-Step 'Generating Prisma client'
    npm run db:generate --workspace=apps/api
    if ($LASTEXITCODE -ne 0) {
      throw 'Prisma generate failed'
    }
  }

  if ($NoStart) {
    Write-Step 'Bootstrap completed (NoStart mode)'
    exit 0
  }

  Write-Step 'Starting monorepo dev servers from safe path'
  Write-Host "Web: http://localhost:3000" -ForegroundColor Green
  Write-Host "API: http://localhost:3001" -ForegroundColor Green
  npm run dev
} catch {
  Write-Host "Bootstrap failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
