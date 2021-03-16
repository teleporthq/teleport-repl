import { useEffect, useState } from 'react'
import {
  SandpackFiles,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from '@codesandbox/sandpack-react'

const Embed = () => {
  const [files, setFiles] = useState<SandpackFiles>({})

  const listener = (event: MessageEvent) => {
    if (
      event.data.type === 'teleport-embed' &&
      Object.keys(event.data?.files || {}).length > 0
    ) {
      setFiles(files)
    }
  }

  useEffect(() => {
    if (!window) {
      return
    }

    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  }, [])

  return (
    <SandpackProvider template="react" customSetup={{ files }}>
      <SandpackLayout theme="codesandbox-light">
        <SandpackPreview
          customStyle={{ height: '98vh' }}
          showOpenInCodeSandbox={false}
          showNavigator={true}
        />
      </SandpackLayout>
    </SandpackProvider>
  )
}

export default Embed
