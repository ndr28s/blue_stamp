import { useState, useEffect } from 'react'
import './App.css'

const STORAGE_KEY = 'paperclip_server_url'
const CONNECT_TIMEOUT_MS = 5000

type Screen = 'setup' | 'connecting' | 'error'

function App() {
  const [screen, setScreen] = useState<Screen>('setup')
  const [inputUrl, setInputUrl] = useState('http://192.168.0.x:3210')
  const [pendingUrl, setPendingUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setInputUrl(saved)
      attemptConnect(saved)
    }
  }, [])

  async function attemptConnect(url: string) {
    const normalized = url.trim().replace(/\/$/, '')
    if (!normalized) return
    setPendingUrl(normalized)
    setScreen('connecting')
    setErrorMsg('')

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS)
      // no-cors: opaque response is fine — we only need to confirm reachability
      await fetch(normalized, { signal: controller.signal, mode: 'no-cors' })
      clearTimeout(timer)
      localStorage.setItem(STORAGE_KEY, normalized)
      window.location.href = normalized
    } catch {
      setScreen('error')
      setErrorMsg('서버에 연결할 수 없습니다.\nURL을 확인하고 다시 시도하세요.')
    }
  }

  return (
    <>
      {screen === 'setup' && (
        <div className="screen setup-screen">
          <div className="logo-block">
            <span className="logo-icon">📎</span>
            <h1>Blue Stamp</h1>
            <p className="subtitle">paperclip 모바일 클라이언트</p>
          </div>
          <div className="form-block">
            <label htmlFor="server-url">paperclip 서버 주소</label>
            <input
              id="server-url"
              type="url"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              placeholder="http://192.168.0.x:3210"
              onKeyDown={e => e.key === 'Enter' && attemptConnect(inputUrl)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              className="btn-primary"
              onClick={() => attemptConnect(inputUrl)}
              disabled={!inputUrl.trim()}
            >
              연결
            </button>
          </div>
        </div>
      )}

      {screen === 'connecting' && (
        <div className="screen connecting-screen">
          <div className="spinner" />
          <p className="connecting-label">연결 중...</p>
          <span className="url-badge">{pendingUrl}</span>
        </div>
      )}

      {screen === 'error' && (
        <div className="screen error-screen">
          <div className="error-icon">✕</div>
          <h2>연결 실패</h2>
          <p className="error-msg">{errorMsg}</p>
          <span className="url-badge">{pendingUrl}</span>
          <div className="button-row">
            <button className="btn-primary" onClick={() => attemptConnect(pendingUrl)}>
              다시 시도
            </button>
            <button className="btn-secondary" onClick={() => setScreen('setup')}>
              서버 주소 변경
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default App
