import { SandpackRunner } from 'react-smooshpack'

const DEPENDENCIES = {
  'prop-types': 'latest',
  'styled-components': 'latest',
}

const BrowserPreview: React.FC<{
  code: string
  dependencies: Record<string, string>
}> = ({ code, dependencies }) => {
  return (
    <SandpackRunner
      options={{ showNavigator: true }}
      code={code}
      template="react"
      customStyle={{ height: '85vh' }}
      customSetup={{ dependencies: { ...DEPENDENCIES, ...dependencies } }}
    />
  )
}

export default BrowserPreview
