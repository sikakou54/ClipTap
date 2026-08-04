/**
 * アプリケーションエントリーポイント
 *
 * Reactアプリケーションのルートをマウントし、初期設定を行う。
 * i18nの初期化を含む。
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './i18n';
import './services/LoggerService';

createRoot(document.getElementById('root')!).render(
  /* React StrictMode（開発時の追加チェックを有効化） */
  <StrictMode>
    <App />
  </StrictMode>,
)
