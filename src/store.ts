import { createStore, persist } from 'easy-peasy'
import model from './models'
import * as historyService from './services/historyCache.service'

export interface Injections {
  historyService: typeof historyService
}

const store = createStore(persist(model), {
  // 👇 provide injections to our store
  injections: { historyService } as Injections,
})

export default store
