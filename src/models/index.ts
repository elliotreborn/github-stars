import storageModel, { StorageModel } from './storage'
import starsModel, { StarsModel } from './stars'


export interface StoreModel {
  storage: StorageModel
  stars: StarsModel
}

const storeModel: StoreModel = {
  storage: storageModel,
  stars: starsModel,
}

export default storeModel
