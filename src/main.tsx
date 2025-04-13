// アプリ全体のエントリーポイント（起動の土台）
// 建物の土台や電源周り
// グローバルな初期設定（グローバルCSSやZustand初期化など）を書く場所
// 基本的に「触る頻度は少ない」

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './global.css'

import { useCompanyStore } from './store/useCompanyStore'
import activeConfig from './config/active.json'

// 初期化（ここで一度だけアクティブ社の設定をzustandに入れる）
useCompanyStore.getState().setCompany(activeConfig)

ReactDOM.createRoot(document.getElementById('root')!).render(
  // Reactをどこに表示するか（index.html の <div id="root">）を指定
  // App.tsxを呼び出す 
  <React.StrictMode>
    <App />
  </React.StrictMode>
)