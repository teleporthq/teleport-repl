import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  ClasserProvider,
  SandpackFiles,
  SandpackCodeViewer,
  SandpackThemeProp,
  useSandpack,
} from '@codesandbox/sandpack-react'
import { useEffect } from 'react'

interface BrowserPreviewProps {
  options: {
    displayFiles?: boolean
    dependencies?: Record<string, string>
    files?: SandpackFiles
    theme?: SandpackThemeProp
  }
}

const Preview: React.FC<BrowserPreviewProps> = ({ options }) => {
  const { displayFiles = false, theme = 'monokai-pro' } = options || {}
  const { sandpack } = useSandpack()

  useEffect(() => {
    sandpack.openInCSBRegisteredRef.current = true
  }, [])

  return (
    <SandpackLayout theme={theme}>
      {displayFiles && <SandpackCodeViewer />}
      <SandpackPreview showNavigator={true} showOpenInCodeSandbox={false} />
    </SandpackLayout>
  )
}

const BrowserPreview: React.FC<BrowserPreviewProps> = ({ options }) => {
  const { dependencies = {}, files, displayFiles } = options || {}
  return (
    <>
      <SandpackProvider
        bundlerURL="https://sandpack-self-hosted.vercel.app/"
        template="react"
        customSetup={{
          dependencies,
          files,
        }}
      >
        <ClasserProvider
          classes={{
            'sp-wrapper': 'wrapper',
            'sp-layout': 'wrapper',
            'sp-stack': 'custom-stack',
          }}
        >
          <Preview options={options} />
        </ClasserProvider>
      </SandpackProvider>
      <style jsx global>{`
        .wrapper {
          height: 100%;
        }
        .custom-stack.custom-stack {
          min-width: ${displayFiles ? '50% !important' : '100% !important'};
          height: 100%;
        }
      `}</style>
    </>
  )
}

export default BrowserPreview
