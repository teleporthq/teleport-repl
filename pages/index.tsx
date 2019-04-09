import React from 'react'

import { AppPage } from '../components/AppPage'
import { TopBar } from '../components/TopBar'
import { CodeScreen } from '../components/CodeScreen'

interface PlaygroundPageState {
  generatedCode: string
  targetLibrary: string
  inputJson: string
  sourceJSON: string
}

export default class PlaygroundPage extends React.Component<{}, PlaygroundPageState> {
  public render() {
    return (
      <AppPage>
        <TopBar />
        <CodeScreen />
      </AppPage>
    )
  }
}
