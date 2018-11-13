import React, { Fragment } from 'react'

// Fragment vs <> => no error in style jsx vs some error saying that
// jsx=true is not a boolean value. Strange.
const PreviewFrame = (props: any) => (
  <Fragment>
    <iframe src={props.url} />
    <style jsx>{`
      iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: #fff;
      }
    `}</style>
  </Fragment>
)

export { PreviewFrame }
