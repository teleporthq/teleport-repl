import React from 'react'
import Link from 'next/link'

const TopBar: React.SFC = () => {
  return (
    <div>
      <div className="top-bar">
        <Link href="https://teleporthq.io/">
          <a>
            <img alt="logo" src="/static/svg/teleport.svg" width="139" height="33" />
          </a>
        </Link>
        <div className="menu-items">
          <Link href={'https://docs-git-master.teleport-dev.now.sh'}>
            <a className="menu-item selected">DOCS</a>
          </Link>
          <Link href="https://github.com/teleporthq/teleport-code-generators">
            <a target="_blank" rel="noopener" className="menu-item">
              <img alt="github" src="/static/svg/github.svg" width="20" height="20" />
            </a>
          </Link>
        </div>
      </div>
      <style jsx>{`
        .top-bar {
          display: flex;
          background: var(--main-bg-white);
          justify-content: space-between;
          align-items: center;
          padding: 0 20px;
          border-bottom: 1px solid #00000010;
        }
        .menu-items {
          display: flex;
        }
        .menu-item {
          padding: 22px;
          text-decoration: none;
          transition: color 0.2s;
          border-bottom: solid 3px transparent;
          color: #000;
        }
        a:not(.selected):hover {
          color: var(--color-purple);
          fill: var(--color-purple);
        }
        .selected {
          border-color: var(--color-purple);
        }
      `}</style>
    </div>
  )
}

export { TopBar }
