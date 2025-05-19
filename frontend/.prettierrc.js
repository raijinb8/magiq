// .prettierrc.js (ES Module format)

export default {
  // 1行の最大文字数。これを超えるとPrettierは改行を試みます。
  printWidth: 80,

  // インデントに使用するスペースの数。
  tabWidth: 2,

  // インデントにタブ文字ではなくスペースを使用します (trueにするとタブ文字を使用)。
  useTabs: false,

  // 各ステートメントの末尾にセミコロンを付けます。
  semi: true,

  // 文字列リテラルにダブルクォートではなくシングルクォートを使用します。
  singleQuote: true,

  // オブジェクトのプロパティ名をクォートで囲むタイミングを指定します。
  quoteProps: 'as-needed',

  // JSX内の属性値にダブルクォートではなくシングルクォートを使用します (singleQuoteオプションとは独立)。
  jsxSingleQuote: false,

  // 配列やオブジェクトリテラルなどの末尾にカンマを付けるかどうか、またどのように付けるかを指定します。
  trailingComma: 'es5',

  // オブジェクトリテラルの波括弧 `{}` の内側にスペースを入れます (例: { foo: bar })。
  bracketSpacing: true,

  // 複数行のHTML (HTML, JSX, Vue, Angular) 要素の閉じ括弧 `>` を、
  // 属性の最後の行ではなく、次の行に配置します。
  bracketSameLine: false,

  // アロー関数の引数が1つの場合でも、引数を括弧 `()` で囲みます。
  arrowParens: 'always',

  // ファイルの改行コードを指定します。
  endOfLine: 'lf',
};
