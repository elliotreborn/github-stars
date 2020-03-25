import React from 'react'
import { StoreProvider } from 'easy-peasy'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import store from './store'
import Home from './Home'
import About from './About'
import NoMatch from './utils/NoMatch'
import './styles/app.global.scss'

const App: React.FC = () => {
  return (
    <div className='app'>
      <StoreProvider store={store}>
        <BrowserRouter>
          <Switch>
            <Route path='/' exact component={Home} />
            <Route path='/about' exact component={About} />
            <Route component={NoMatch} />
          </Switch>
        </BrowserRouter>
      </StoreProvider>
    </div>
  )
}

export default App
