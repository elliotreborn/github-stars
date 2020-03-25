import dayjs from 'dayjs'

export const HumanDateParse = (date): string => {
  return dayjs(date).format('M月d日 HH:mm')
}

export const sleep = (ms): Promise<void> => {
  return new Promise(r => setTimeout(r, ms))
}

export const StringEnumObjects = (enumme): Array<{ label: string; value: string }> => {
  return Object.keys(enumme).map(key => ({ label: key, value: enumme[key] }))
}

export const IntEnumObjects = (enumme): Array<{ label: string; value: number }> => {
  return Object.keys(enumme)
    .filter(value => !Number.isNaN(Number(value)))
    .map(key => ({ label: enumme[key], value: parseInt(key, 10) }))
}

const { location, history } = window

// https://stackoverflow.com/a/41542008
export const winSearchParams = (params: { stack?: string; repos?: string }): void => {
  const searchParams = new URLSearchParams(window.location.search)
  if (params.stack !== undefined) {
    if (params.stack) {
      searchParams.set('stack', params.stack)
    } else {
      searchParams.delete('stack')
    }
  }
  if (params.repos !== undefined) {
    if (params.repos) {
      searchParams.set('repos', params.repos)
    } else {
      searchParams.delete('repos')
    }
  }
  history.pushState(null, '', `${location.pathname}${[...searchParams].length ? `?${searchParams.toString()}` : ''}`)
}

export const transRelationHref = (href: string | null, currentPath: string): string => {
  if (href && !href.startsWith('http') && !href.startsWith('/?') && !href.startsWith('#')) {
    const hrefs = currentPath.split('/')
    if (href.startsWith('../')) {
      hrefs[hrefs.length - 2] = href.replace('../', '')
      hrefs.pop()
    } else {
      hrefs[hrefs.length - 1] = href
    }
    const nhref = hrefs.join('/')
    return nhref
  }
  return ''
}

const generateS4 = (): string => {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1)
}

export const generateUuid = (): string => {
  return `${generateS4()}${generateS4()}-${generateS4()}-${generateS4()}-${generateS4()}-${generateS4()}${generateS4()}${generateS4()}`
}

export const isChrome = !!(window as any).chrome && (!!(window as any).chrome.webstore || !!(window as any).chrome.runtime)
export const isEdgeChromium = isChrome && (navigator.userAgent.indexOf('Edg') !== -1)
