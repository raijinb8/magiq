import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-900">Tailwind v4 × 最新構成 完了！</h1>
    </div>
  );
}

export default App
