import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  ClasserProvider,
  SandpackFiles,
  SandpackCodeViewer,
} from '@codesandbox/sandpack-react'

const BrowserPreview: React.FC<{
  displayFiles?: boolean
  dependencies?: Record<string, string>
  files?: SandpackFiles
}> = ({ dependencies = {}, files, displayFiles = false }) => {
  return (
    <>
      <SandpackProvider
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
          <SandpackLayout theme="monokai-pro">
            {displayFiles && <SandpackCodeViewer />}
            <SandpackPreview showNavigator={true} showOpenInCodeSandbox={false} />
          </SandpackLayout>
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
