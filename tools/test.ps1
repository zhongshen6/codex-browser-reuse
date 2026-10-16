$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
# The test runner uses the same offline runtime helper as normal startup.
. (Join-Path $PSScriptRoot 'bundled-runtime.ps1')
$node = Get-BundledNodePath -ProjectPath $project

# Explicit absolute test paths work from any caller directory without npm.
$tests = @(Get-ChildItem -LiteralPath (Join-Path $project 'tests') -Filter '*.test.js' |
    Sort-Object Name | Select-Object -ExpandProperty FullName)
if (-not $tests.Count) { throw 'No test files were found.' }
& $node '--test' @tests
exit $LASTEXITCODE
