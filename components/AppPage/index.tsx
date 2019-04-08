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
          --main-text-font-size: 14px;
          --main-font-family: 'Open Sans', Verdana, sans-serif;
          --color-purple: #822cec;
          --editor-bg-black: #272822;
        }

        html,
        body,
        #__next,
        body {
          font-family: var(--main-font-family);
          font-size: var(--main-text-font-size);
          background-color: var(--main-bg-white);
          color: var(--main-text-color);
          height: 100%;
          width: 100%;
          overflow: hidden;
          margin: 0;
          padding: 0 0 20px 0;
        }
        input,
        textarea {
          font-family: var(--main-font-family);
          font-size: var(--main-text-font-size);
        }
      `}</style>
    </>
  )
}

export { AppPage }
