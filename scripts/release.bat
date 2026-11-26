@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM  beautiFULLshot local release
REM    1) bump version across package.json / tauri.conf.json / Cargo.toml
REM    2) build the Windows MSI installer
REM    3) silently install the freshly built MSI
REM
REM  Usage (run from anywhere):
REM    scripts\release.bat            -> patch bump  (1.0.6 -> 1.0.7)
REM    scripts\release.bat minor      -> minor bump
REM    scripts\release.bat major      -> major bump
REM    scripts\release.bat 1.2.3      -> explicit version
REM
REM  NOTE: building requires the Rust toolchain + Tauri prerequisites and can
REM  take several minutes. The silent install runs msiexec /quiet.
REM ============================================================================

REM Move to repo root (this script lives in <root>\scripts).
pushd "%~dp0.."

set "BUMP_ARG=%~1"
if "%BUMP_ARG%"=="" set "BUMP_ARG=patch"

echo(
echo === [1/3] Bumping version (%BUMP_ARG%) ===
set "NEWVER="
for /f "usebackq delims=" %%v in (`node scripts\bump-version.mjs %BUMP_ARG%`) do set "NEWVER=%%v"
if not defined NEWVER (
  echo ERROR: version bump failed.
  popd & exit /b 1
)
echo New version: %NEWVER%

echo(
echo === [2/3] Building MSI installer (this can take several minutes) ===
REM Merge a local override that disables updater-artifact signing (the signed
REM .sig requires TAURI_SIGNING_PRIVATE_KEY, a CI-only secret; not needed for a
REM local install). Base tauri.conf.json is untouched.
call npm run tauri build -- --bundles msi --config src-tauri\tauri.local-release.conf.json
if errorlevel 1 (
  echo ERROR: tauri build failed.
  popd & exit /b 1
)

echo(
echo === [3/3] Locating and silently installing the MSI ===
set "MSI="
for /f "delims=" %%f in ('dir /b /o-d "src-tauri\target\release\bundle\msi\*.msi" 2^>nul') do (
  if not defined MSI set "MSI=src-tauri\target\release\bundle\msi\%%f"
)
if not defined MSI (
  echo ERROR: no MSI found in src-tauri\target\release\bundle\msi\
  popd & exit /b 1
)
echo Installing (elevated - accept the UAC prompt): %MSI%
REM MSI is per-machine scope, so a silent install needs admin. Self-elevate the
REM install step via a single UAC prompt, then msiexec runs fully silent.
powershell -NoProfile -Command "$p = Start-Process msiexec.exe -ArgumentList @('/i','%MSI%','/quiet','/norestart') -Verb RunAs -Wait -PassThru; exit $p.ExitCode"
if errorlevel 1 (
  echo ERROR: elevated msiexec install failed (exit %errorlevel%).
  popd & exit /b 1
)

echo(
echo === DONE: beautiFULLshot %NEWVER% built and installed silently. ===
popd
endlocal
exit /b 0
