# ベースイメージとしてNode.jsの軽量版(Alpine)を指定
FROM node:20-alpine AS development

# 作業ディレクトリを設定
WORKDIR /app

# package.json と package-lock.json (または yarn.lock) をコピー
COPY package*.json ./
# COPY yarn.lock ./ # Yarn を使っている場合

# 依存関係をインストール
RUN npm install
# RUN yarn install # Yarn を使っている場合

# プロジェクトの残りのファイルをコピー
COPY . .

# Vite開発サーバーがデフォルトで使用するポートを公開
EXPOSE 5173

# 開発サーバーを起動 (コンテナ外からアクセスできるように --host を指定)
CMD ["npm", "run", "dev", "--", "--host"]
# CMD ["yarn", "dev", "--host"] # Yarn を使っている場合