import { useEffect, useState } from 'react'
import { SandpackFiles } from '@codesandbox/sandpack-react'
import { generate } from '../utils/helper'
import BrowserPreview from '../components/BrowserPreview'

const Embed = () => {
  const [files, setFiles] = useState<SandpackFiles>({})

  const listener = async (event: MessageEvent) => {
    const { data } = event
    if (data?.type === 'teleport-render' && data?.uidl) {
      const filesGenerated = await generate(data.uidl)
      if (!filesGenerated) {
        return
      }
      setFiles(filesGenerated)
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
    <div className="preview">
      <BrowserPreview
        options={{ files, displayFiles: false, theme: 'codesandbox-light' }}
      />
      <style jsx>{`
        .preview {
          height: calc(100vh - 15px);
        }
      `}</style>
    </div>
  )
}

export default Embed
