import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import AppRouter from './AppRouter'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <header className="App-header">

    <ul id='nav-list'>
      <li><a href='/'>Home</a></li>
      <li><a href='/login'>Login</a></li>
    </ul>

    </header>
    <AppRouter />

    </div>
  )
}

export default App
