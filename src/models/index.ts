import storageModel, { StorageModel } from './storage'
import historyModel, { HistoryModel } from './history'


export interface StoreModel {
  storage: StorageModel
  history: HistoryModel
}

const storeModel: StoreModel = {
  storage: storageModel,
  history: historyModel,
}

export default storeModel
