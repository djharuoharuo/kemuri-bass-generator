@echo off
chcp 65001 >nul
echo ================================================
echo  KemuriBeat Bass Generator - Windows セットアップ
echo ================================================
echo.

:: Python バージョン確認
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python が見つかりません。
    echo Python 3.10 以上をインストールしてください。
    echo https://www.python.org/downloads/
    pause
    exit /b 1
)

for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo [OK] Python %PYVER% を検出しました

echo.
echo [1/2] ライブラリをインストール中...
python -m pip install --upgrade pip -q
python -m pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo [ERROR] ライブラリのインストールに失敗しました。
    pause
    exit /b 1
)

echo.
echo [2/2] インストール完了チェック...
python -c "import music21, midiutil, pythonosc; print('[OK] 全ライブラリ正常')"

if %errorlevel% neq 0 (
    echo [ERROR] ライブラリのインポートに失敗しました。
    pause
    exit /b 1
)

echo.
echo ================================================
echo  セットアップ完了！
echo ================================================
echo.
echo 起動方法:
echo   python main.py
echo.
echo Max for Liveデバイスについて:
echo   max_for_live\KemuriBassReceiver.maxpat を
echo   Max for Live エディタで開き、.amxd として保存後、
echo   Ableton LiveのBassトラックに配置してください。
echo.
pause
