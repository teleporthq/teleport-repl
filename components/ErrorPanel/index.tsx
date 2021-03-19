import React from 'react'
interface ErrorPanelProps {
  error: any
  visible: boolean
}

const UIDL_ERROR_TEXT = 'UIDL Validation error. Please check the following: '

const ErrorPanel: React.SFC<ErrorPanelProps> = (props) => {
  const { error, visible } = props
  if (!error || !visible) {
    return null
  }

  const errorList = getErrors(error)
  const errorLength =
    errorList[0] === UIDL_ERROR_TEXT ? errorList.length - 1 : errorList.length

  return (
    <>
      <div className="error-panel">
        <div className="error-header">
          <span>PROBLEMS</span>
          <span className="error-count">{errorLength}</span>
        </div>
        <div className="error-list-wrapper">
          <div className="error-list">
            {errorList.map((errorItem, index) => {
              if (index === 0) {
                return (
                  <div className="first-error-item" key={`index-${error}`}>
                    {errorItem}
                  </div>
                )
              }
              return (
                <div key={`index-${index}`} className="error-item">
                  {errorItem}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <style jsx>{`
        .error-panel {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background-color: #1e1f1b;
          z-index: 3;
          box-sizing: border-box;
        }
        .error-header {
          border-bottom: solid 1px #cccccc20;
          padding: 10px;
          font-size: 13px;
          color: #f5deb3;
        }
        .error-count {
          background-color: #5f5959;
          border-radius: 50%;
          width: 20px;
          height: 15px;
          margin-left: 10px;
          display: inline-block;
          text-align: center;
        }
        .error-list-wrapper {
          max-height: 180px;
          overflow: auto;
        }
        .error-list {
          padding: 10px;
        }
        .first-error-item {
          font-weight: 700;
          margin-bottom: 5px;
        }
        .error-item::before {
          content: '♣️';
          height: 1em;
          font-size: 0.65em;
          line-height: 1;
          margin-right: 5px;
          color: rgba(255, 148, 148, 0.6);
        }
      `}</style>
    </>
  )
}

const getErrors = (error: Error): string[] => error.message.split('\n')

export { ErrorPanel }
