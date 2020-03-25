import { Action, action, Computed, computed, Thunk, thunk, ActionOn, actionOn } from 'easy-peasy'
import Stacks, { Stack, StackType } from '../stacks'
import { generateUuid , winSearchParams } from '../utils/assist'
import { Injections } from '../store'
import { StoreModel } from './index'
import { Repository } from '../services/history.service'
import { error, warn } from '../utils/toast'

export enum DisplayType {
  Backend,
  Frontend,
  Private,
  Hidden,
}

export interface HistoryModel {
  displayType: DisplayType
  setDisplayType: Action<HistoryModel, DisplayType>

  presetStacks: Array<Stack>

  displayStacks: Computed<HistoryModel, Array<Stack>>
  backStacks: Computed<HistoryModel, Array<Stack>>
  frontStacks: Computed<HistoryModel, Array<Stack>>
  hiddenStacks: Computed<HistoryModel, Array<Stack>>

  addHiddenStack: Action<HistoryModel, string>
  removeHiddenStack: Action<HistoryModel, string>

  privateStacks: Array<Stack>
  addPrivateStack: Action<HistoryModel, { name: string, repos?: string[] }>
  removePrivateStack: Action<HistoryModel, string>
  addPrivateStackRepo: Action<HistoryModel, { stackid: string; repo: string }>
  addPrivateStackRepoAndData: Thunk<HistoryModel, { stackid: string; repo: string }, Injections, StoreModel>
  removePrivateStackRepo: Action<HistoryModel, { stackid: string; repo: string }>
  onPrivateStack: ActionOn<HistoryModel>

  currentStack: Stack | null
  setCurrentStack: Action<HistoryModel, Stack>
  initialCurrentStack: Thunk<HistoryModel, void, void, StoreModel>

  loading: boolean
  setLoading: Action<HistoryModel, boolean>

  repositorys: Array<Repository>
  clearRepositorys: Action<HistoryModel>
  pushRepository: Action<HistoryModel, Repository>

  selectStack: Thunk<HistoryModel, Stack, Injections, StoreModel>
}

const defaultPresetStacks = (): Array<Stack> => {
  const hiddenStacks = JSON.parse(localStorage.getItem('hidden_stacks') || '[]')
  Stacks.forEach(s => { s.hidden = hiddenStacks.includes(s.id) })
  return Stacks
}

const historyModel: HistoryModel = {
  displayType: JSON.parse(localStorage.getItem('displayType') || '0'),
  setDisplayType: action((state, payload) => {
    state.displayType = payload
    localStorage.setItem('displayType', payload.toString())
  }),

  presetStacks: defaultPresetStacks(),

  displayStacks: computed(state => state.presetStacks.filter(s => !s.hidden).concat(state.privateStacks)),
  backStacks: computed(state => state.displayStacks.filter(s => s.type === StackType.Backend)),
  frontStacks: computed(state => state.displayStacks.filter(s => s.type === StackType.Frontend)),
  hiddenStacks: computed(state => state.presetStacks.filter(s => s.hidden)),

  addHiddenStack: action((state, name) => {
    const stack = state.presetStacks.find(s => s.id === name)
    if (!stack) return
    stack.hidden = true

    const hiddenStacks = JSON.parse(localStorage.getItem('hidden_stacks') || '[]')
    if (!hiddenStacks.includes(name)) {
      hiddenStacks.push(name)
      localStorage.setItem('hidden_stacks', JSON.stringify(hiddenStacks))
    }
  }),
  removeHiddenStack: action((state, name) => {
    const stack = state.presetStacks.find(s => s.id === name)
    if (!stack) return
    stack.hidden = false

    let hiddenStacks = JSON.parse(localStorage.getItem('hidden_stacks') || '[]')
    if (hiddenStacks.includes(name)) {
      hiddenStacks = hiddenStacks.filter(e => e !== name)
      localStorage.setItem('hidden_stacks', JSON.stringify(hiddenStacks))
    }
  }),

  privateStacks: JSON.parse(localStorage.getItem('private_stacks') || '[]'),
  addPrivateStack: action((state, { name, repos = [] }) => {
    const stack: Stack = {
      id: generateUuid(),
      name,
      repos,
      type: StackType.Private
    }
    state.privateStacks.push(stack)
  }),
  removePrivateStack: action((state, id) => {
    state.privateStacks = state.privateStacks.filter(s => s.id !== id)
  }),

  addPrivateStackRepo: action((state, { stackid, repo }) => {
    const stack = state.privateStacks.find(s => s.id === stackid)
    if (stack && !stack.repos.includes(repo)) {
      stack.repos.push(repo)
      winSearchParams({ stack: stackid, repos: stack.repos.toString() })
    }
  }),
  addPrivateStackRepoAndData: thunk(async (actions, { stackid, repo }, { injections, getStoreState }) => {
    actions.addPrivateStackRepo({ stackid, repo })
    actions.setLoading(true)
    const { region, githubToken } = getStoreState().storage
    try {
      const data = await injections.historyService.getRepoData({ repo, region, githubToken })
      if (data) {
        actions.pushRepository(data)
        if (data.requiredCacheUpdate) {
          injections.historyService.saveRepoToStore(data)
        }
      }
    } catch (err) {
      if (err.message.startsWith('Unfortunately')) {
        warn(err.message)
      } else {
        error(err.message)
      }
    }
    actions.setLoading(false)
  }),
  removePrivateStackRepo: action((state, { stackid, repo }) => {
    const stack = state.privateStacks.find(s => s.id === stackid)
    if (!stack) return
    stack.repos = stack.repos.filter(r => r !== repo)
    winSearchParams({ stack: stackid, repos: stack.repos.toString() })

    if (state.currentStack?.id === stack.id) {
      // removeRepoFromStore(state.repositorys.find(r => r.name === repo))
      state.repositorys = state.repositorys.filter(r => r.name !== repo)
    }
  }),
  onPrivateStack: actionOn(
    (actions, storeActions) => [
      actions.addPrivateStack,
      actions.removePrivateStack,
      actions.addPrivateStackRepo,
      actions.removePrivateStackRepo,
    ],
    (state, target) => {
      localStorage.setItem('private_stacks', JSON.stringify(state.privateStacks))
    },
  ),

  currentStack: null,
  setCurrentStack: action((state, stack) => {
    state.currentStack = stack
  }),
  initialCurrentStack: thunk(async (actions, payload, { getState }) => {
    const searchParams = new URLSearchParams(window.location.search)
    const stackid = searchParams.get('stack')
    let stack = getState().displayStacks.find(s => s.id === stackid)
    if (stack) {
      actions.setDisplayType(stack.type as unknown as DisplayType)
      actions.selectStack(stack)
    } else {
      const repos = (searchParams.get('repos') || '').split(',')
      if (repos.length && repos[0]) {
        actions.setDisplayType(DisplayType.Private)
        actions.addPrivateStack({ name: 'querystring', repos })
        stack = getState().privateStacks.find(s => s.name === 'querystring')
        if (stack) {
          actions.selectStack(stack)
        }
      }
    }
  }),

  loading: false,
  setLoading: action((state, payload) => {
    state.loading = payload
  }),

  repositorys: [],
  clearRepositorys: action(state => {
    state.repositorys = []
  }),
  pushRepository: action((state, payload) => {
    state.repositorys.push(payload)
  }),

  selectStack: thunk(async (actions, stack, { injections, getStoreState }) => {
    actions.setCurrentStack(stack)
    actions.clearRepositorys()
    actions.setLoading(true)
    const { region, githubToken } = getStoreState().storage
    if (stack.type === StackType.Private) {
      winSearchParams({ stack: stack.id, repos: stack.repos.toString() })
    } else {
      winSearchParams({ stack: stack.id, repos: '' })
    }

    await Promise.all(
      stack.repos.map(async repo => {
        try {
          const data = await injections.historyService.getRepoData({ repo, region, githubToken })
          if (data) {
            actions.pushRepository(data)
            if (data.requiredCacheUpdate) {
              injections.historyService.saveRepoToStore(data)
            }
          }
        } catch (err) {
          if (err.message.startsWith('Unfortunately')) {
            warn(err.message)
          } else {
            error(err.message)
          }
        }
      })
    )

    actions.setLoading(false)
  }),
}

export default historyModel
