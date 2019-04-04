import React from 'react'

const AppPage: React.SFC = (props) => {
  return (
    <>
      {props.children}
      <style jsx global>{`
        body {
          --main-bg-white: #fff;
          --main-bg-dark: #1e1e1e;
          --main-text-color: #f3f3f3;
          --main-text-font-size: 12px;
          --main-font-family: 'Open Sans', Verdana, sans-serif;
          --color-purple: #822cec;
        }

        html,
        body,
        #__next,
        body {
          font-family: var(--main-font-family);
          font-size: var(--main-text-font-size);
          height: 100%;
          width: 100%;
          overflow: hidden;
          background-color: var(--main-bg-dark);
          color: var(--main-text-color);
        }
        input,
        textarea {
          font-family: var(--main-font-family);
          font-size: var(--main-text-font-size);
        }
        html,
        body,
        p,
        li,
        ul,
        pre,
        div,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          margin: 0;
          padding: 0;
          border: 0;
        }
      `}</style>
    </>
  )
}

export { AppPage }
