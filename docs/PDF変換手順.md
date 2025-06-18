# PDF変換手順

## 見積書のPDF化について

現在のプロジェクトにはPDF生成ライブラリが含まれていないため、以下の方法でPDFを作成してください。

### 方法1: ブラウザで印刷（推奨）

1. `見積書_WOT_20250618.html` をブラウザで開く
2. ブラウザの印刷機能を使用（Ctrl+P または Cmd+P）
3. 印刷先を「PDFとして保存」に設定
4. 以下の設定を推奨:
   - 用紙サイズ: A4
   - 余白: デフォルト
   - 背景のグラフィック: オン（表の背景色を含める）
5. 保存

### 方法2: オンラインツール

Markdown to PDF変換サービスを使用:
- [md2pdf.netlify.app](https://md2pdf.netlify.app/)
- [markdown-pdf.com](https://www.markdown-pdf.com/)

### 方法3: VSCodeエクステンション

VSCodeを使用している場合:
1. "Markdown PDF" エクステンションをインストール
2. `見積書_WOT_20250618.md` を開く
3. 右クリック → "Markdown PDF: Export (pdf)"

### 方法4: Pandocを使用（要インストール）

```bash
# Pandocのインストール
# Ubuntu/Debian
sudo apt-get install pandoc

# macOS
brew install pandoc

# PDF生成
pandoc 見積書_WOT_20250618.md -o 見積書_WOT_20250618.pdf --pdf-engine=xelatex -V mainfont="Noto Sans CJK JP"
```

## 注意事項

- 日本語フォントが正しく表示されることを確認してください
- 表のフォーマットが崩れていないか確認してください
- HTMLバージョン（`見積書_WOT_20250618.html`）は印刷用に最適化されています