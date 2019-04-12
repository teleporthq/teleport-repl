import React from 'react'
import Link from 'next/link'

const TopBar: React.SFC = () => {
  return (
    <div className="top-bar">
      <Link href="https://teleporthq.io/">
        <a className="logo">
          <img alt="logo" src="/static/svg/teleport.svg" width="139" height="33" />
        </a>
      </Link>
      <div className="menu-items">
        {/* <Link href={'https://docs.teleporthq.io'}>
          <a className="menu-item">DOCS</a>
        </Link> */}
        {/* <Link href={'/'}>
          <a className="menu-item selected">REPL</a>
        </Link> */}

        <Link href="https://github.com/teleporthq/teleport-code-generators">
          {/* <a target="_blank" rel="noopener" className="menu-item">
            <img alt="github" src="/static/svg/github.svg" width="20" height="20" />
          </a> */}
          <a target="_blank" className="menu-item gitHub-logo">
            <p className="github-label">
              CHECK OUT OUR
              <br />
              CODE GENERATORS
            </p>
            <svg
              className="github-icon"
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>GitHub icon</title>
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </a>
        </Link>
      </div>
      <style jsx>{`
        .top-bar {
          display: flex;
          width: 100%;
          background: var(--main-bg-white);
          justify-content: space-between;
          align-items: center;
          padding: 0 20px;
          box-sizing: border-box;
          border-bottom: 1px solid #00000010;
        }
        .menu-items {
          display: flex;
        }
        .menu-item {
          padding: 10px;
          text-decoration: none;
          transition: color 0.2s;
          border-bottom: solid 3px transparent;
          color: #000;
          font-weight: 300;
        }

        .menu-item.gitHub-logo {
          display: flex;
          align-items: center;
        }
        .github-icon {
          width: 24px;
          margin-left: 24px;
        }
        .github-label {
          text-align: right;
          font-size: 12px;
          color: #24272e;
          display: flex;
        }
        a:hover {
          color: var(--color-purple);
          fill: var(--color-purple);
        }
        .selected {
          border-color: var(--color-purple);
        }
        .logo {
          line-height: 0;
        }
      `}</style>
    </div>
  )
}

export { TopBar }
