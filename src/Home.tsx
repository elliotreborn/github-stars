import React from 'react'
import './styles/app.global.scss'
import Stars from './components/stars'
import Navbar from './components/navbar'

const Home: React.FC = () => {
  return (
    <>
      <Navbar />
      <Stars />
    </>
  )
}

export default Home
