# ベースイメージとしてNode.jsの軽量版(Alpine)を指定
FROM node:20-alpine AS development

# 必要なツールをインストール (bash, curl, git など)
# Alpineではgitも別途インストールが必要な場合が多い
RUN apk update && apk add --no-cache bash curl git

# Supabase CLI を手動でダウンロードしてインストール (適切なアーキテクチャを選択)
# Alpine (x86_64) の場合、amd64バイナリを使用
# uname -m でアーキテクチャを確認し、適切なバイナリをダウンロードするスクリプトを組むのがより堅牢
# ここでは amd64 を仮定
# RUN curl -L "https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz" -o supabase.tar.gz && \
#     tar -xzf supabase.tar.gz -C /usr/local/bin && \
#     rm supabase.tar.gz

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