import { SandpackRunner, SandpackProvider } from 'react-smooshpack'

/* Till this get's fixed.
Reference --> https://github.com/teleporthq/teleport-code-generators/issues/540 */

const DEPENDENCIES = {
  'prop-types': 'latest',
  'styled-components': 'latest',
}

const BrowserPreview: React.FC<{
  code: string
  dependencies: Record<string, string>
}> = ({ code, dependencies }) => {
  return (
    <SandpackProvider>
      <SandpackRunner
        options={{ showNavigator: true }}
        code={code}
        template="react"
        customStyle={{ height: '85vh' }}
        customSetup={{ dependencies: { ...DEPENDENCIES, ...dependencies } }}
      />
    </SandpackProvider>
  )
}

export default BrowserPreview
