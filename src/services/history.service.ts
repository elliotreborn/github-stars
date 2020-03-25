import ky, { ResponsePromise } from 'ky'
import range from 'lodash/range'
import flatMap from 'lodash/flatMap'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

const GITHUB_TOKENS = process.env.REACT_APP_GITHUB_TOKENS?.split(',') || []

let tokenIndex = -1
const getToken = (): string => {
  if (tokenIndex + 1 >= GITHUB_TOKENS.length) {
    tokenIndex = 0
  } else {
    tokenIndex += 1
  }
  return GITHUB_TOKENS[tokenIndex]
}

interface ChartItems {
  [date: string]: number
}

export interface Repository {
  name: string
  data: ChartItems
  lastRefreshDate: Date
  requiredCacheUpdate?: boolean
}

const NUMBER_OF_SAMPLES = 30 // number of samples for chart
const PAGE_SIZE = 30

export const fetchCurrentStars = async (repo: Repository, userToken?: string): Promise<Repository> => {
  let retrys = 0
  const api = ky.extend({
    timeout: 200 * 1000,
    hooks: {
      beforeRequest: [
        request => {
          request.headers.set('Accept', 'application/vnd.github.v3.star+json')
          request.headers.set('Authorization', `token ${userToken || getToken()}`)
        },
      ],
      afterResponse: [
        (request, options, response): ResponsePromise | Response => {
          if (response.status === 403) {
            retrys += 1
            if (retrys > 2)
              throw new Error(
                'Unfortunately the limit of request to GitHub has been exceeded :(. You can authorize your GitHub OAuth to extend this limit'
              )
            request.headers.set('Authorization', `token ${getToken()}`)
            return ky(request)
          }
          return response
        },
      ],
    },
  })

  const data = await api.get(`https://api.github.com/repos/${repo.name}`).json<{ stargazers_count: number }>()
  const now = dayjs.utc()
  repo.data[now.format('YYYY-MM-DD')] = data.stargazers_count
  repo.requiredCacheUpdate = true
  repo.lastRefreshDate = now.toDate()
  return repo
}

interface QuerySpecItem {
  url: string
  pageIndex: number
  dataIndexes: number[]
}

interface HistoryItem {
  starred_at: string
}

export const getStarHistory = async (repoName: string, userToken?: string): Promise<Repository> => {
  let retrys = 0
  const api = ky.extend({
    timeout: 200 * 1000,
    hooks: {
      beforeRequest: [
        request => {
          request.headers.set('Accept', 'application/vnd.github.v3.star+json')
          request.headers.set('Authorization', `token ${userToken || getToken()}`)
        },
      ],
      afterResponse: [
        (request, options, response): ResponsePromise | Response => {
          if (response.status === 403) {
            retrys += 1
            if (retrys > 2)
              throw new Error(
                'Unfortunately the limit of request to GitHub has been exceeded :(. You can authorize your GitHub OAuth to extend this limit'
              )
            request.headers.set('Authorization', `token ${getToken()}`)
            return ky(request)
          }
          return response
        },
      ],
    },
  })

  const initUrl = `https://api.github.com/repos/${repoName}/stargazers` // ?per_page=${PAGE_SIZE}
  const initRes = await api.get(initUrl)
  const link = initRes.headers.get('Link')

  // repos with less than 30 stars (single page)
  if (!link) {
    const singlePageData: ChartItems = {}
    const initRequestData: Array<{ starred_at: string }> = await initRes.json()
    initRequestData.forEach((d, i) => {
      singlePageData[d.starred_at.slice(0, 10)] = i + 1
    })
    return {
      name: repoName,
      data: singlePageData || {},
      lastRefreshDate: dayjs.utc().toDate(),
      requiredCacheUpdate: true,
    }
  }

  const querySpecification: QuerySpecItem[] = []
  const regArr = /next.*?page=(\d*).*?last/.exec(link)
  if (!regArr) throw new Error('regular link null')
  const totalPageNum = parseInt(regArr[1], 10)

  if (totalPageNum <= NUMBER_OF_SAMPLES) {
    // 总页数小于point数，请求数肯定等于totalPageNum，每页获取的point可能大于1
    const samplesForPage: number = Math.floor(NUMBER_OF_SAMPLES / totalPageNum)
    // 单页points之间的步幅
    const step = PAGE_SIZE / samplesForPage
    // 单页points的索引
    const dataIndexes = range(0, PAGE_SIZE, step).map(v => Math.floor(v))
    // limit
    dataIndexes.length = samplesForPage
    range(1, totalPageNum + 1).forEach(i => {
      querySpecification.push({
        url: `${initUrl}?page=${i}`,
        pageIndex: i,
        dataIndexes,
      })
    })
  } else {
    // 总页数大于point数，每个请求只获取 1point
    range(1, NUMBER_OF_SAMPLES + 1).forEach(i => {
      // i位置的在 30 的占比*乘以总页数，就是i位置在总页数的占比
      const pageIndex = Math.round((i / NUMBER_OF_SAMPLES) * totalPageNum) - 1
      querySpecification.push({
        url: `${initUrl}?page=${pageIndex}`,
        pageIndex,
        dataIndexes: [0],
      })
    })
  }

  const queryPromises = querySpecification.map(query => api.get(query.url).json<Array<HistoryItem>>())
  const responses = await Promise.all(queryPromises)

  const starHistory = flatMap(querySpecification, (query, i) => {
    const data: Array<HistoryItem> = responses[i]
    return query.dataIndexes
      .filter(index => index < data.length) // skip latest not full pages
      .map(index => {
        return {
          date: data[index].starred_at.slice(0, 10),
          starNum: 30 * (query.pageIndex - 1) + index,
        }
      })
  })

  // stars number for today (better view for repos with too much stars (>40000))
  const repoData = await api.get(`https://api.github.com/repos/${repoName}`).json<{ stargazers_count: number }>()
  starHistory.push({
    date: dayjs.utc().format('YYYY-MM-DD'),
    starNum: repoData.stargazers_count,
  })

  const chartItems: ChartItems = {}
  starHistory.forEach(item => {
    chartItems[item.date] = item.starNum
  })
  return {
    name: repoName,
    data: chartItems || {},
    lastRefreshDate: dayjs.utc().toDate(),
    requiredCacheUpdate: true,
  }
}
