import React from 'react'
import cs from 'classnames'
import css from './loader.module.scss'

// https://codepen.io/Katrine-Marie/pen/pJgZBo
const Loader1: React.FC<{ type: number }> = ({ type }: { type: number }): JSX.Element => {

  return (
    <>
      <svg className={css.loaderSvg}>
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          </filter>
        </defs>
      </svg>

      {type === 1 && <div className={cs(css.container, css.goo1)}>
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>}

      {type === 2 && <div className={cs(css.container, css.goo2)}>
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>}
    </>
  );
}

export default Loader1