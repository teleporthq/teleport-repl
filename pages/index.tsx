import React from 'react'

import { AppPage } from '../components/AppPage'
import { MonacoEditor } from '../components/MonacoEditor'

export default class PlaygroundPage extends React.Component {
  public render() {
    return (
      <AppPage>
        <div className="main-content">
          <style jsx>{`
            .main-content {
              display: flex;
              width: 100%;
              height: 100%;
            }

            .results-container {
              display: flex;
              flex-flow: column;
              flex: 1;
            }

            .live-view-container {
              flex: 1;
            }

            .code-view-container {
              flex: 1;
            }

            .json-input-container {
              flex: 1;
            }
          `}</style>

          <div className="json-input-container">
            <MonacoEditor name="json-editor" />
          </div>

          <div className="results-container">
            <div className="live-view-container">Live Container</div>
            <div className="code-view-container">
              <MonacoEditor name="code-preview" language="javascript" value={`const x = <div>something something dark side</div>`} readOnly />
            </div>
          </div>
        </div>
      </AppPage>
    )
  }
}
