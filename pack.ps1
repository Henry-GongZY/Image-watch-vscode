[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$manifestPath = Join-Path $PSScriptRoot 'package.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$vsixName = '{0}-{1}.vsix' -f $manifest.name, $manifest.version
$vsixPath = Join-Path $PSScriptRoot $vsixName
$vscePath = Join-Path $PSScriptRoot 'node_modules\.bin\vsce.cmd'

if (-not (Test-Path -LiteralPath $vscePath)) {
    throw 'VSCE was not found. Run npm install before executing pack.ps1.'
}

Write-Host "Packaging $vsixName..."
& $vscePath package --no-dependencies --out $vsixPath
if ($LASTEXITCODE -ne 0) {
    throw "VSIX packaging failed with exit code $LASTEXITCODE."
}

$codePath = $null
$codeCommand = Get-Command 'code.cmd' -ErrorAction SilentlyContinue
if ($codeCommand) {
    $codePath = $codeCommand.Source
}

if (-not $codePath) {
    $codeCandidates = @(
        (Join-Path $env:LOCALAPPDATA 'Programs\Microsoft VS Code\bin\code.cmd'),
        (Join-Path $env:ProgramFiles 'Microsoft VS Code\bin\code.cmd')
    )
    $codePath = $codeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}

if (-not $codePath) {
    throw 'VS Code CLI was not found. Add code.cmd to PATH or install Visual Studio Code.'
}

Write-Host "Installing $vsixName into VS Code..."
& $codePath --install-extension $vsixPath --force
if ($LASTEXITCODE -ne 0) {
    throw "VS Code extension installation failed with exit code $LASTEXITCODE."
}

Write-Host "Installed $($manifest.publisher).$($manifest.name)@$($manifest.version) successfully."
Write-Host 'Run "Developer: Reload Window" in VS Code to load the new build.'
