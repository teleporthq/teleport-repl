import React from 'react'

const PannelTitle:React.SFC = props => {
  return (
    <h3>
      {props.children}
      <style jsx>{`
        h3 {
          line-height: 24px;
          padding: 8px;
          margin: 0;
          border-bottom: 1px solid #444;
        }  
      `}</style>
    </h3>
  )
}

export { PannelTitle }