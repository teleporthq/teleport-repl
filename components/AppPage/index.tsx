import React from 'react'

const AppPage: React.SFC = (props) => {
  return (
    <>
      <style jsx global>{`
        body,
        html {
          height: 100%;
          width: 100%;
          overflow: hidden;
          margin: 0;
          padding: 0;
          font-family: 'Open Sans', sans-serif;
          background-color: #1e1e1e;
          color: #f3f3f3;
        }

        #__next {
          height: 100%;
        }
      `}</style>
      {props.children}
    </>
  )
}

export { AppPage }
