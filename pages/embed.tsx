import { useEffect, useState } from 'react'
import { SandpackFiles } from '@codesandbox/sandpack-react'
import { generateProject } from '../utils/helper'
import BrowserPreview from '../components/BrowserPreview'
import { AppPage } from '../components/AppPage'

const Embed = () => {
  const [files, setFiles] = useState<SandpackFiles>({})
  const [error, setError] = useState<boolean>(false)
  const listener = async (event: MessageEvent) => {
    const { data } = event
    if (data?.type === 'teleport-render' && data?.uidl) {
      try {
        const filesGenerated = await generateProject(data.uidl)
        if (!filesGenerated) {
          setError(true)
          return
        }
        setError(true)
        setFiles(filesGenerated)
      } catch (e) {
        setError(true)
        console.error(e)
      }
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
    <AppPage>
      <div className="preview">
        {Object.keys(files || {}).length > 0 && (
          <BrowserPreview
            options={{ files, displayFiles: false, theme: 'codesandbox-light' }}
          />
        )}
        {Object.keys(files || {}).length === 0 && (
          <div className="empty_state">
            <img className="logo" src="/static/svg/logo_white.svg" alt="Teleport HQ" />
            Listening for updates
          </div>
        )}
        {error && (
          <div className="error_state">
            Failed in rendering project. Please check your console for error
          </div>
        )}
        <style jsx>{`
          .error_state {
            height: 100%;
            display: flex;
            align-items: center;
            background-size: cover;
            justify-content: center;
            flex-direction: column;
            color: var(--main-text-color);
            font-family: var(--main-font-family);
            font-size: var(--main-text-font-size);
            background-color: var(--main-bg-dark);
          }

          .empty_state {
            height: 100%;
            display: flex;
            align-items: center;
            background-size: cover;
            justify-content: center;
            flex-direction: column;
            color: var(--main-text-color);
            font-family: var(--main-font-family);
            font-size: var(--main-text-font-size);
            background-image: url('/static/svg/hero.svg');
          }

          .logo {
            width: 200px;
            padding-bottom: 10px;
          }

          .preview {
            height: 100vh;
          }
        `}</style>
      </div>
    </AppPage>
  )
}

export default Embed
