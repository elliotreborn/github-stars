import React, { useState, useEffect, useCallback, useRef, useMemo, Fragment } from 'react'
import cs from 'classnames'
import Fuse from 'fuse.js'
import Highcharts from 'highcharts'
import Chartkick, { LineChart } from 'react-chartkick'
import html2canvas from 'html2canvas'
import Language from '../utils/language'
import { Stack, StackType } from '../stacks'
import { useStoreActions, useStoreState } from '../utils/hooks'
import { IntEnumObjects } from '../utils/assist'
import { DisplayType } from '../models/stars'
import { Repository } from '../services/stars.service'
import OAuth from './oauth'
import css from './stars.module.scss'
import Loader from './loader'
import { ReactComponent as Twitter } from '../images/twitter.svg'

const fuseOptions: Fuse.FuseOptions<Stack> = {
  keys: ['name', 'repos'],
  threshold: 0.3,
  maxPatternLength: 8,
}

Chartkick.use(Highcharts)

const highchartsConfig = {
  tooltip: {
    xDateFormat: '%Y-%m-%d',
  },
  plotOptions: {
    series: {
      marker: {
        enabled: false,
      },
    },
  },
}

const displayTypeOptions = IntEnumObjects(DisplayType)

const History: React.FC = (): JSX.Element => {
  const initialCurrentStack = useStoreActions(actions => actions.stars.initialCurrentStack)
  const estimateRegion = useStoreActions(actions => actions.storage.estimateRegion)
  useEffect(() => {
    initialCurrentStack()
    estimateRegion()
  }, [initialCurrentStack, estimateRegion])

  const language = useStoreState<Language>(state => state.storage.language)
  const githubToken = useStoreState<string>(state => state.storage.githubToken)
  const displayType = useStoreState<DisplayType>(state => state.stars.displayType)
  const privateStacks = useStoreState<Array<Stack>>(state => state.stars.privateStacks)
  const displayStacks = useStoreState<Array<Stack>>(state => state.stars.displayStacks)
  const backStacks = useStoreState<Array<Stack>>(state => state.stars.backStacks)
  const frontStacks = useStoreState<Array<Stack>>(state => state.stars.frontStacks)
  const hiddenStacks = useStoreState<Array<Stack>>(state => state.stars.hiddenStacks)
  const currentStack = useStoreState<Stack | null>(state => state.stars.currentStack)
  const repositorys = useStoreState<Array<Repository>>(state => state.stars.repositorys)
  const loading = useStoreState<boolean>(state => state.stars.loading)

  const setDisplayType = useStoreActions(actions => actions.stars.setDisplayType)
  const addHiddenStack = useStoreActions(actions => actions.stars.addHiddenStack)
  const removeHiddenStack = useStoreActions(actions => actions.stars.removeHiddenStack)
  const addPrivateStack = useStoreActions(actions => actions.stars.addPrivateStack)
  const removePrivateStack = useStoreActions(actions => actions.stars.removePrivateStack)
  const addPrivateStackRepoAndData = useStoreActions(actions => actions.stars.addPrivateStackRepoAndData)
  const removePrivateStackRepo = useStoreActions(actions => actions.stars.removePrivateStackRepo)
  const selectStack = useStoreActions(actions => actions.stars.selectStack)

  const [inputStackName, setInputStackName] = useState<string>('')
  const [inputRepoName, setInputRepoName] = useState<string>('')

  const [query, setQuery] = useState('')
  const [queryStacks, setQueryStacks] = useState(displayStacks)

  const chartEl = useRef<HTMLElement>(null)

  useEffect(() => {
    if (query !== '') {
      const fuse = new Fuse(displayStacks, fuseOptions)
      const result = fuse.search<Stack, false, false>(query)
      setQueryStacks(result)
    } else {
      setQueryStacks([])
    }
  }, [displayStacks, query])

  const submitRepo = useCallback(
    stackid => {
      if (inputRepoName) {
        addPrivateStackRepoAndData({ stackid, repo: inputRepoName })
        setInputRepoName('')
      }
    },
    [addPrivateStackRepoAndData, inputRepoName]
  )

  const Repositories = useCallback(
    (s: Stack) => {
      return (
        <div className={css.repos}>
          {s.repos.map(repo => (
            <p key={repo} className={css.repo}>
              <a href={`https://github.com/${repo}`} target='_blank' rel='noopener noreferrer'>
                {repo}
              </a>
              {s.type === StackType.Private && <i className='fa-close' onClick={() => removePrivateStackRepo({ stackid: s.id, repo })} />}
            </p>
          ))}
          {s.type === StackType.Private && (
            <div className='field has-addons'>
              <p className='control is-expanded'>
                <input
                  className='input is-small'
                  type='text'
                  placeholder='username/repositorie'
                  value={inputRepoName}
                  onChange={e => setInputRepoName(e.target.value)}
                />
              </p>
              <p className='control'>
                <a className='button is-info is-small' onClick={() => submitRepo(s.id)}>
                  Add
                </a>
              </p>
            </div>
          )}
        </div>
      )
    },
    [inputRepoName, removePrivateStackRepo, submitRepo]
  )

  const downloadImage = useCallback(() => {
    if (!chartEl.current) return
    html2canvas((chartEl.current as any).element).then((canvas) => {
      const link = document.createElement('a')
      link.download = `${currentStack?.name || 'stars'}.png`
      link.href = canvas.toDataURL()
      link.click()
    })
  }, [currentStack])

  const LineChartMemoized = useMemo(() => {
    return (<>
      <LineChart innerRef={chartEl} library={highchartsConfig} data={repositorys} height='800px' width='100%' ytitle='Stars' />
    </>)
  }, [repositorys])

  return (
    <div className={cs('columns', css.history)}>
      <div className={cs('column', 'is-one-quarter')}>
        <nav className='panel'>
          <div className="panel-heading">
            <p className="control has-icons-left">
              <input className="input" type="search" spellCheck={false} value={query} onChange={e => setQuery(e.target.value) } placeholder="Search" />
              <span className="icon is-left">
                <i className="fas fa-search" aria-hidden="true" />
              </span>
            </p>
          </div>
          <p className='panel-tabs'>
            {displayTypeOptions.map(o => (
              <a
                key={o.value}
                className={cs({ 'is-active': displayType === o.value })}
                onClick={() => setDisplayType(o.value)}>
                {o.label}
              </a>
            ))}
          </p>

          <div className={css.stacks}>
            {displayType === DisplayType.Private && <div className='panel-block field has-addons'>
              <p className='control is-expanded'>
                <input
                  className='input'
                  type='text'
                  placeholder='stack name'
                  value={inputStackName}
                  onChange={e => setInputStackName(e.target.value)}
                />
              </p>
              <p className={cs('control', css.button)}>
                <a className='button is-info' onClick={() => inputStackName && addPrivateStack({ name: inputStackName })}>
                  Create
                </a>
              </p>
            </div>}

            {query !== '' && queryStacks.map(s => (
              <Fragment key={s.id}>
                <a
                  className={cs('panel-block', css.stack, { 'is-active': s.id === currentStack?.id })}
                  onClick={() => selectStack(s)}>
                  <span className='panel-icon'>
                    <i className={cs({ 'fa-group': s.type !== StackType.Private, 'fa-user': s.type === StackType.Private })} aria-hidden='true' />
                  </span>
                  {language === Language.中文 ? (s.nameChinese || s.name): s.name}
                  <i
                    className='fa-close'
                    onClick={e => {
                      e.stopPropagation()
                      if (s.type === StackType.Private) {
                        removePrivateStack(s.id)
                      } else {
                        addHiddenStack(s.id)
                      }
                    }}
                  />
                </a>
                {s.id === currentStack?.id && Repositories(s)}
              </Fragment>
            ))}
            {query === '' && displayType === DisplayType.Backend && backStacks.map(s => (
              <Fragment key={s.id}>
                <a
                  className={cs('panel-block', css.stack, { 'is-active': s.id === currentStack?.id })}
                  onClick={() => selectStack(s)}>
                  <span className='panel-icon'>
                    <i className={cs({ 'fa-group': s.type !== StackType.Private, 'fa-user': s.type === StackType.Private })} aria-hidden='true' />
                  </span>
                  {language === Language.中文 ? (s.nameChinese || s.name): s.name}
                  <i
                    className='fa-close'
                    onClick={e => {
                      e.stopPropagation()
                      if (s.type === StackType.Private) {
                        removePrivateStack(s.id)
                      } else {
                        addHiddenStack(s.id)
                      }
                    }}
                  />
                </a>
                {s.id === currentStack?.id && Repositories(s)}
              </Fragment>
            ))}
            {query === '' && displayType === DisplayType.Frontend && frontStacks.map(s => (
              <Fragment key={s.id}>
                <a
                  className={cs('panel-block', css.stack, { 'is-active': s.id === currentStack?.id })}
                  onClick={() => selectStack(s)}>
                  <span className='panel-icon'>
                    <i className={cs({ 'fa-group': s.type !== StackType.Private, 'fa-user': s.type === StackType.Private })} aria-hidden='true' />
                  </span>
                  {language === Language.中文 ? (s.nameChinese || s.name): s.name}
                  <i className='fa-close' onClick={e => {
                      e.stopPropagation()
                      if (s.type === StackType.Private) {
                        removePrivateStack(s.id)
                      } else {
                        addHiddenStack(s.id)
                      }
                    }}
                  />
                </a>
                {s.id === currentStack?.id && Repositories(s)}
              </Fragment>
            ))}
            {query === '' && displayType === DisplayType.Private && privateStacks.map(s => (
              <Fragment key={s.id}>
                <a
                  className={cs('panel-block', css.stack, { 'is-active': s.id === currentStack?.id })}
                  onClick={() => selectStack(s)}>
                  <span className='panel-icon'>
                    <i className='fa-user' aria-hidden='true' />
                  </span>
                  {language === Language.中文 ? (s.nameChinese || s.name): s.name}
                  <i className='fa-close' onClick={e => {
                      e.stopPropagation()
                      if (window.confirm('Will be deleted!'))
                        removePrivateStack(s.id)
                    }}
                  />
                </a>
                {s.id === currentStack?.id && Repositories(s)}
              </Fragment>
            ))}
            {query === '' && displayType === DisplayType.Hidden && hiddenStacks.map(s => (
              <Fragment key={s.id}>
                <a
                  className={cs('panel-block', css.stack, { 'is-active': s.id === currentStack?.id })}
                  onClick={() => selectStack(s)}>
                  <span className='panel-icon'>
                    <i className='fa-group' aria-hidden='true' />
                  </span>
                  {language === Language.中文 ? (s.nameChinese || s.name): s.name}
                  <i className='fa-close' onClick={e => {
                      e.stopPropagation()
                      removeHiddenStack(s.id)
                    }}
                  />
                </a>
                {s.id === currentStack?.id && Repositories(s)}
              </Fragment>
            ))}
          </div>
        </nav>

      </div>
      <div className={cs('column', 'pos-relative')}>
        <div className={css.topbar}>
          {currentStack && <a className={cs('button', 'is-info', 'is-small', 'mgr10')} onClick={downloadImage}>
            <i className='fa-image mgr5' />
            Download Image
          </a>}
          {!githubToken && <OAuth />}
        </div>

        {loading && <div className={css.loading}>
          <Loader type={1} />
        </div>}

        {LineChartMemoized}

        <footer className={cs(css.footer)}>
          <span>powered by <a className={css.domain} target='_blank' rel='noopener noreferrer' href='https://socode.pro'>socode.pro</a></span>
          <a href='https://twitter.com/socode7' target='_blank' rel='noopener noreferrer'>
            <Twitter className={cs(css.twitter)} />
          </a>
        </footer>
      </div>
    </div>
  )
}

export default History
