import React from 'react'
import './styles/app.global.scss'
import History from './components/history'
import Navbar from './components/navbar'

const Home: React.FC = () => {
  return (
    <>
      <Navbar />
      <History />
    </>
  )
}

export default Home
