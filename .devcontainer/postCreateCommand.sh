#!/bin/bash
set -e # エラーが発生したらスクリプトを終了する

echo "Running postCreateCommand..."
echo "Current user: $(whoami)"

# Zshプラグインのインストールと設定
ZSH_CUSTOM_DIR_DEFAULT="$HOME/.oh-my-zsh/custom"
ZSH_PLUGINS_DIR="${ZSH_CUSTOM:-$ZSH_CUSTOM_DIR_DEFAULT}/plugins" # パスを組み立てる

# ディレクトリが存在しない場合は作成 (念のため)
mkdir -p "$ZSH_PLUGINS_DIR"

echo "Cloning zsh plugins..."
git clone https://github.com/zsh-users/zsh-autosuggestions "${ZSH_PLUGINS_DIR}/zsh-autosuggestions" && \
git clone https://github.com/zsh-users/zsh-syntax-highlighting "${ZSH_PLUGINS_DIR}/zsh-syntax-highlighting" && \
git clone https://github.com/zsh-users/zsh-completions "${ZSH_PLUGINS_DIR}/zsh-completions"

echo "Updating .zshrc plugins..."
# sed コマンドのパターンをより安全に（ファイルが存在しない場合のエラーを防ぐ、など）
if [ -f ~/.zshrc ]; then
  # 既に設定されているか確認し、重複を避ける (簡易的なチェック)
  if ! grep -q "plugins=(.*zsh-autosuggestions.*zsh-completions.*zsh-syntax-highlighting.*)" ~/.zshrc; then
    sed -i.bak 's/plugins=(git)/plugins=(git zsh-autosuggestions zsh-completions zsh-syntax-highlighting)/' ~/.zshrc && \
    echo ".zshrc updated."
  else
    echo "Plugins already configured in .zshrc."
  fi
else
  echo "~/.zshrc not found. Skipping plugin configuration."
fi

echo "postCreateCommand finished."

# Denoをインストール

echo "postCreateCommand.sh を介したDenoのインストールを開始..."
echo "PATH -> Y, shell -> zsh"

curl -fsSL https://deno.land/x/install/install.sh | sh
echo "現在のDenoバージョン:"
deno --version

echo "Deno用のpostCreateCommand.shが終了しました。"