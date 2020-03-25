import { Action, action, Thunk, thunk } from 'easy-peasy'
import ky from 'ky'
import dayjs from 'dayjs'
import Language from '../utils/language'
import { warn } from '../utils/toast'

export interface StorageModel {
  language: Language
  setLanguage: Action<StorageModel, Language>

  githubToken: string
  setGithubToken: Action<StorageModel, string>

  region: string
  setRegion: Action<StorageModel, string>
  estimateRegion: Thunk<StorageModel>
}

const defaultLanguage = (): Language => {
  const language = localStorage.getItem('language')
  if (language) {
    return language as Language
  }
  return navigator.language.startsWith(Language.中文) ? Language.中文 : Language.English
}

const storageModel: StorageModel = {
  language: defaultLanguage(),
  setLanguage: action((state, payload) => {
    state.language = payload
    localStorage.setItem('language', payload)
  }),

  githubToken: localStorage.getItem('githubToken') || '',
  setGithubToken: action((state, payload) => {
    state.githubToken = payload
    localStorage.setItem('githubToken', payload)
  }),

  region: '',
  setRegion: action((state, payload) => {
    state.region = payload
    localStorage.setItem('region', JSON.stringify({ value: payload, time: dayjs().toJSON()}))
  }),
  estimateRegion: thunk(async (actions) => {
    const region = localStorage.getItem('region')
    if (region) {
      const { value, time } = JSON.parse(region)
      if (time && dayjs(time).add(7, 'day').isAfter(dayjs())) {
        actions.setRegion(value || '')
        return
      }
    }

    try {
      const result = await ky.get('https://ipapi.co/json').json<{ country: string }>()
      actions.setRegion(result.country)
    } catch (err) {
      try {
        const result = await ky.get('https://ipinfo.io?token=e808b0e2f4fce7').json<{ country: string }>()
        actions.setRegion(result.country)
      } catch (err2) {
        warn('Failed to get your region info, which can help us use the cache closer to you. Maybe it\'s because your ad block plugin blocked the ipapi.co domain', true)
      }
    }
  }),
}

export default storageModel
