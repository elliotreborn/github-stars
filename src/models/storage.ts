import { Action, action, Thunk, thunk } from 'easy-peasy'
import ky from 'ky'
import dayjs from 'dayjs'
import Language from '../utils/language'
import { warn } from '../utils/toast'

const IpapiWarn =
  "Failed to get your region info, which can help us use the cache closer to you. Maybe it's because your ad block plugin blocked the ipapi.co domain"

export interface RegionData {
  ip: string
  country_code: string
  country_name?: string
  city?: string
  region_code?: string
  country?: string
  latitude?: string
  longitude?: string
  utc_offset?: string
}

export interface StorageModel {
  language: Language
  setLanguage: Action<StorageModel, Language>

  githubToken: string
  setGithubToken: Action<StorageModel, string>

  region: RegionData
  setRegion: Action<StorageModel, RegionData>
  judgeRegion: Thunk<StorageModel>
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

  region: { ip: '', city: '', country_code: '' },
  setRegion: action((state, payload) => {
    state.region = payload
    localStorage.setItem('regionData', JSON.stringify({ value: payload, time: dayjs().toJSON() }))
  }),
  judgeRegion: thunk(async (actions) => {
    const region = localStorage.getItem('regionData')
    if (region) {
      const { value, time } = JSON.parse(region)
      if (time && dayjs(time).add(1, 'day').isAfter(dayjs())) {
        actions.setRegion(value || {})
        return
      }
    }

    try {
      const result = await ky.get('https://www.cloudflare.com/cdn-cgi/trace').text()
      const resultLines = result.split(/\r?\n/)

      const locline = resultLines.find((l) => l.startsWith('loc'))
      if (!locline) throw new Error('locline null')
      const ipline = resultLines.find((l) => l.startsWith('ip'))
      if (!ipline) throw new Error('ipline null')

      actions.setRegion({
        ip: ipline?.split('=')[1],
        country_code: locline?.split('=')[1],
      })
    } catch (err) {
      console.warn(err)
      try {
        const result = await ky.get('https://freegeoip.app/json').json<RegionData>()
        actions.setRegion(result)
      } catch (err2) {
        warn(IpapiWarn, true)
      }
    }
  }),
}

export default storageModel
