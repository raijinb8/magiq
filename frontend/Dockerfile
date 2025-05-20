# ベースイメージとしてNode.jsのDebian Bullseyeスリム版を指定
FROM node:20-bullseye-slim AS development

# 必要なツールをインストール (Debian/Bullseye ベース)
# apt-get を使用し、最後にキャッシュをクリーンアップします。
RUN apt-get update && apt-get install -y \
    bash \
    curl \
    git \
    openssh-client \
    sudo \
    socat \
    file \
    unzip `# Denoのインストールスクリプトがzip展開に使う可能性があるため` \
    # libc6 は bullseye-slim イメージに通常含まれていますが、念のため記載（通常は不要）
    # libc6 \
 && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリを設定
WORKDIR /app

# プロジェクトの残りのファイルをコピー
COPY . .

# package.json と package-lock.json (または yarn.lock) をコピー
# COPY package*.json ./

WORKDIR /app/frontend

# 依存関係をインストール
RUN npm install -g npm@latest
RUN npm install

# Vite開発サーバーがデフォルトで使用するポートを公開
EXPOSE 5173

# 開発サーバーを起動 (コンテナ外からアクセスできるように --host を指定)
CMD ["npm", "run", "dev", "--", "--host"]
# CMD ["sh", "-c", "cd frontend && npm run dev -- --host"]
# CMD ["yarn", "dev", "--host"] # Yarn を使っている場合