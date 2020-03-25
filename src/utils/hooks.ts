import { createTypedHooks } from 'easy-peasy'
import { StoreModel } from '../models'

const typedHooks = createTypedHooks<StoreModel>()

export const { useStoreActions, useStoreDispatch, useStoreState } = typedHooks
