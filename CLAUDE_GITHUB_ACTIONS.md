# GitHub ActionsでのClaude Code使用ガイド

## 問題と解決策

### 問題：MCPツールによるコミット失敗
GitHub ActionsでClaude Codeを実行する際、MCPのgithub_file_opsツールが403エラーで失敗し、ブランチが削除される問題があります。

**エラーの流れ：**
1. `mcp__github_file_ops__commit_files`がGitHub APIでtree作成を試みる
2. 「Resource not accessible by integration」エラーで失敗
3. コミットが作成されない
4. Claude Code Actionが「Branch has no commits」と判断してブランチを削除

### 解決策：通常のgitコマンドを使用

`.github/workflows/claude.yml`で以下の設定を使用：

```yaml
- name: Run Claude Code
  uses: raijinb8/claude-code-action@main
  with:
    # MCPツールを無効化し、Bashツールを使用
    allowed_tools: 'Bash,Edit,Glob,Grep,LS,Read,Write,mcp__github__update_issue_comment'
    disallowed_tools: 'mcp__github_file_ops__commit_files,mcp__github_file_ops__delete_files'
```

## Claude用の指示

GitHub Actionsで実行される場合、以下のコマンドを使用してください：

### ファイルのコミット
```bash
# ファイルをステージング
git add .

# コミット（日本語メッセージ）
git commit -m "feat: 機能を追加

詳細な説明（必要に応じて）

🤖 Generated with [Claude Code](https://claude.ai/code)"

# プッシュ
git push origin HEAD
```

### PR作成
```bash
# GitHub CLIを使用
gh pr create \
  --title "feat: 機能の追加" \
  --body "## 概要
- 変更内容の説明

## テスト
- 実行したコマンド: \`npm run lint\`, \`npm run build\`

🤖 Generated with [Claude Code](https://claude.ai/code)"
```

### 重要な注意事項
- **MCPのgithub_file_opsツールは使用しない**
- **通常のgitコマンドとgh CLIを使用**
- **コミットメッセージは日本語で記載**
- **必ずプッシュまで実行**（プッシュしないとブランチが削除される）