# ベースイメージとしてNode.jsの軽量版(Alpine)を指定
FROM node:20-alpine AS development

# 必要なツールをインストール (bash, curl, git など)
# Alpineではgitも別途インストールが必要な場合が多い
RUN apk update && apk add --no-cache bash curl git openssh-client sudo socat

# Starshipをインストール (全ユーザー向け、または特定のユーザー向けにインストール)
# ここでは /usr/local/bin にインストールする
RUN curl -sS https://starship.rs/install.sh | sudo sh -s -- --yes

# 作業ディレクトリを設定
WORKDIR /app

# プロジェクトの残りのファイルをコピー
COPY . .

# package.json と package-lock.json (または yarn.lock) をコピー
# COPY package*.json ./
# COPY yarn.lock ./ # Yarn を使っている場合

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