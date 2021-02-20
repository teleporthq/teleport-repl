import { useEffect } from 'react'
import { SandpackPreview, useSandpack } from 'react-smooshpack'

const BrowserPreview: React.FC<{ activeComponentCode: string }> = ({
  activeComponentCode,
}) => {
  const { sandpack } = useSandpack()

  useEffect(() => {
    sandpack.updateCurrentFile(activeComponentCode)
  }, [activeComponentCode])

  return (
    <SandpackPreview
      showNavigator={true}
      showOpenInCodeSandbox={false}
      customStyle={{ height: '85vh' }}
    />
  )
}

export default BrowserPreview
