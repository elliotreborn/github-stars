import ky from 'ky'
import dayjs from 'dayjs'
import { Repository, getStarHistory, fetchCurrentStars } from './stars.service'

interface StarsGetParam {
  repo: string
  region?: string
  githubToken?: string
}

export const getRepoData = async ({ repo, region, githubToken }: StarsGetParam): Promise<Repository | null> => {
  if (!process.env.REACT_APP_CATCH) return null
  const domain = region === 'CN'? process.env.REACT_APP_CATCH_CN: process.env.REACT_APP_CATCH

  try {
    const json = await ky.get(`${domain}/${repo.replace('/', '_')}.json`).json<Repository>()
    if (dayjs(json.lastRefreshDate).add(7, 'day').isBefore(dayjs())) {
      console.log(`base:requiredCacheUpdate:${repo}:${json.lastRefreshDate}`)

      const jsonNocache = await ky.get(`${domain}/${repo.replace('/', '_')}.json?${dayjs().unix()}`).json<Repository>()
      if (dayjs(jsonNocache.lastRefreshDate).add(7, 'day').isBefore(dayjs())) {
        console.log(`nocache:requiredCacheUpdate:${repo}:${jsonNocache.lastRefreshDate}`)
        return fetchCurrentStars(jsonNocache, githubToken)
      }
      return jsonNocache
    }
    return json
  } catch (err) {
    return getStarHistory(repo, githubToken)
  }
}

export const saveRepoToStore = async (repo: Repository): Promise<void> => {
  repo.requiredCacheUpdate = false
  if (!process.env.REACT_APP_CATCH_POST) return

  try {
    await ky.post(process.env.REACT_APP_CATCH_POST || '', { json: repo })
  } catch (err) {
    console.error('saveRepoToStore:', err)
  }
}

export const removeRepoFromStore = async (repo: Repository | undefined): Promise<void> => {
  if (!repo) return

  repo.requiredCacheUpdate = true
  if (!process.env.REACT_APP_CATCH_POST) return

  try {
    const sparams = new URLSearchParams()
    sparams.set('key', `${repo.name.replace('/', '_')}.json`)
    await ky.delete(process.env.REACT_APP_CATCH_POST || '', { body: sparams })
  } catch (err) {
    console.error('removeRepoFromStore:', err)
  }
}
