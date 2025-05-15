# ベースイメージとしてNode.jsの軽量版(Alpine)を指定
FROM node:20-alpine AS development

# 必要なツールをインストール (bash, curl, git など)
# Alpineではgitも別途インストールが必要な場合が多い
RUN apk update && apk add --no-cache bash curl git openssh-client sudo socat

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