import React, { useState } from 'react'
import cs from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-regular-svg-icons'
import { faGlobe } from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import Language from '../utils/language'
import { useStoreState, useStoreActions } from '../utils/hooks'
import { DisplayType } from '../models/stars'
import logoUrl from '../images/logo.svg'
import { StringEnumObjects, isEdgeChromium } from '../utils/assist'
import css from './navbar.module.scss'
import wechatQRUrl from '../images/wechat.png'

const languageOptions = StringEnumObjects(Language)

const Navbar: React.FC = () => {
  const displayType = useStoreState<DisplayType>(state => state.stars.displayType)
  const language = useStoreState<Language>(state => state.storage.language)
  const setLanguage = useStoreActions(actions => actions.storage.setLanguage)
  const [wechatQR, setWechatQR] = useState(false)

  const themeClass = {
    'is-light': displayType === DisplayType.Backend,
    'is-danger': displayType === DisplayType.Frontend,
    'is-warning': displayType === DisplayType.Private,
    'is-dark': displayType === DisplayType.Hidden,
  }

  return (
    <nav role="navigation" aria-label="main navigation" className={cs('navbar', themeClass)} >
      <div className={cs('navbar-brand', css.brand)}>
        <a className="navbar-item" href="/">
          <img src={logoUrl} alt='logo' className={css.logo} />
          Github Stars
        </a>
      </div>

      <div className="navbar-menu">
        <div className="navbar-start">
          <a className="navbar-item" href='/about'>
            About
          </a>

          <div className="navbar-item has-dropdown is-hoverable">
            <a className="navbar-link">
              Community
            </a>
            <div className="navbar-dropdown">
              <a
                className={cs('navbar-item', css.navlink, css.discord)}
                target='_blank'
                rel='noopener noreferrer'
                href='https://discord.gg/KSyk3BB'>
                <h3>Discord</h3>
              </a>
              {/* <a
                className={cs('navbar-item', css.navlink, css.spectrum)}
                target='_blank'
                rel='noopener noreferrer'
                href='https://spectrum.chat/github-stars'>
                <h3>Spectrum</h3>
              </a> */}
              <a
                className={cs('navbar-item', css.navlink, css.telegram)}
                href='https://t.me/SocodeGithubStars'
                target='_blank'
                rel='noopener noreferrer'>
                <h3>telegram</h3>
              </a>
              <a
                className={cs('navbar-item', css.navlink, css.wechat)} onClick={() => setWechatQR(true)}>
                <h3>wechat group</h3>
              </a>
              <a
                className={cs('navbar-item', css.navlink, css.producthunt)}
                href='https://www.producthunt.com/posts/github-stars'
                target='_blank'
                rel='noopener noreferrer'>
                <h3>Product Hunt</h3>
              </a>
              <a
                className={cs('navbar-item', css.navlink, css.email)} href='mailto:elliotreborn@gmail.com'>
                <FontAwesomeIcon icon={faEnvelope} />
                <h3>Email</h3>
              </a>
            </div>
          </div>

          <div className="navbar-item">
            <a target='_blank' rel="noopener noreferrer" href='https://github.com/elliotreborn/github-stars' className={cs('button', css.github, themeClass)}>
              <FontAwesomeIcon icon={faGithub} className={css.gicon} />
              Source Code
            </a>
          </div>
        </div>

        <div className="navbar-end">
          <div className="navbar-item">
            <div className='control has-icons-left'>
              <div className={cs('select is-rounded', themeClass)}>
                <select value={language} onChange={e => setLanguage(e.target.value as Language)}>
                  {languageOptions.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <span className='icon is-left'>
                <FontAwesomeIcon icon={faGlobe}  className={cs('icon-theme', themeClass)} />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={cs('modal', { 'is-active': wechatQR })}>
        <div className='modal-background' onClick={() => setWechatQR(false)} />
        <div className={cs('modal-card', css.wechatqr)}>
          <header className='modal-card-head'>
            <p className='modal-card-title'>Invite your to our group</p>
            <button className='delete' aria-label='close' type='button' onClick={() => setWechatQR(false)} />
          </header>
          <div className={css.wechatmd}>
            <img src={wechatQRUrl} alt='wechat' />
            <p>请备注 Gtihub Stars</p>
          </div>
        </div>
        <button className='modal-close is-large' type='button' aria-label='close' onClick={() => setWechatQR(false)} />
      </div>
    </nav>
  )
}

export default Navbar
