import { createStore, persist } from 'easy-peasy'
import model from './models'
import * as starsService from './services/stars.cache.service'

export interface Injections {
  starsService: typeof starsService
}

const store = createStore(persist(model), {
  // 👇 provide injections to our store
  injections: { starsService } as Injections,
})

export default store
