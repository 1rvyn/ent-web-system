import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import AppRouter from './AppRouter'

function App() {
  const [activeRoute, setActiveRoute] = useState(window.location.pathname);

  return (
    <div className="App">
      <header className="App-header">

      <ul id='nav-list'>
          <li><a className={activeRoute === '/' ? 'active' : ''} href='/' onClick={() => setActiveRoute('/')}>Home</a></li>
          <li><a className={activeRoute === '/login' ? 'active' : ''} href='/login' onClick={() => setActiveRoute('/login')}>Login</a></li>
          <li><a className={activeRoute === '/register' ? 'active' : ''} href='/register' onClick={() => setActiveRoute('/register')}>Register</a></li>
        </ul>

    </header>
    <AppRouter />

    </div>
  )
}

export default App
