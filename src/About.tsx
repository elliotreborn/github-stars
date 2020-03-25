import React, { useState, useEffect } from 'react'
import ky from 'ky'
import cs from 'classnames'
import marked from 'marked'
import Navbar from './components/navbar'
import { transRelationHref } from './utils/assist'
import css from './About.module.scss'

const base = 'elliotreborn/github-stars'
const path = '/README.md'

const About: React.FC = () => {
  const [markup, setMarkup] = useState<string | null>(null)
  const [markdown, setMarkdown] = useState<string | null>(null)

  useEffect(() => {
    const getMarkdown = async () => {
      try {
        const data = await ky.get(`https://raw.githubusercontent.com/${base}/master${path}`).text()
        setMarkdown(data)
      } catch (err) {
        console.error('getMarkdown', err)
      }
    }
    getMarkdown()
  }, [])

  useEffect(() => {
    if (!markdown) return
    const markedHtml = marked(markdown)
    setMarkup(markedHtml)
  }, [markdown])

  useEffect(() => {
    const body = document.querySelector('.markdown-body')
    if (!body) return

    body.querySelectorAll('a[href]').forEach(tag => {
      const href = tag.getAttribute('href')
      const nPath = transRelationHref(href, path)
      if (nPath) {
        tag.setAttribute('href', `https://github.com/${base}/raw/master/${nPath}`)
      }
    })

    body.querySelectorAll('img[src]').forEach(tag => {
      const href = tag.getAttribute('src')
      const nPath = transRelationHref(href, path)
      if (nPath) {
        tag.setAttribute('src', `https://github.com/${base}/raw/master/${nPath}`)
      }
    })
  }, [markup])

  return (
    <>
      <Navbar />
      <div className={cs(css.about, { [css.loaddone]: markup })}>
        <div className='container'>
          {markup && <div className={cs('markdown-body')} dangerouslySetInnerHTML={{ __html: markup }} />}
        </div>
      </div>
    </>
  )
}

export default About
