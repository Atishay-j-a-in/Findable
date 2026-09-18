import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './components/Navbar'
import HeroSec from './components/HeroSec'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <Navbar/>
      <HeroSec/>
    </>
  )
}

export default App
