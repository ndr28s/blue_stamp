import { useState, useEffect, useRef } from 'react'
import { App as CapApp } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import './App.css'

const STORAGE_KEY = 'paperclip_server_url'
const CONNECT_TIMEOUT_MS = 5000
const AUTO_RETRY_SEC = 10

type Screen = 'setup' | 'connecting' | 'error'

function App() {
  const [screen, setScreen] = useState<Screen>('setup')
  const [inputUrl, setInputUrl] = useState('http://192.168.0.x:3210')
  const [pendingUrl, setPendingUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setInputUrl(saved)
        await attemptConnect(saved)
      }
      await SplashScreen.hide({ fadeOutDuration: 200 })
    }
    init()

    // Hardware back button (Android)
    const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (screen === 'error') {
        clearAutoRetry()
        setScreen('setup')
      } else if (screen === 'connecting') {
        cancelConnect()
      } else if (screen === 'setup') {
        if (canGoBack) {
          window.history.back()
        } else {
          CapApp.exitApp()
        }
      }
    })

    // Reconnect when app resumes from background
    const resumeListener = CapApp.addListener('resume', () => {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && screen === 'error') {
        clearAutoRetry()
        attemptConnect(saved)
      }
    })

    return () => {
      backListener.then(h => h.remove())
      resumeListener.then(h => h.remove())
      clearAutoRetry()
    }
  }, [])

  // Re-register back listener when screen changes
  useEffect(() => {
    const listener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (screen === 'error') {
        clearAutoRetry()
        setScreen('setup')
      } else if (screen === 'connecting') {
        cancelConnect()
      } else if (screen === 'setup') {
        if (canGoBack) {
          window.history.back()
        } else {
          CapApp.exitApp()
        }
      }
    })
    return () => { listener.then(h => h.remove()) }
  }, [screen])

  function clearAutoRetry() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    setCountdown(0)
  }

  function startAutoRetry(url: string) {
    clearAutoRetry()
    setCountdown(AUTO_RETRY_SEC)
    let remaining = AUTO_RETRY_SEC
    countdownRef.current = setInterval(() => {
      remaining -= 1
      setCountdown(remaining)
      if (remaining <= 0) {
        clearAutoRetry()
        attemptConnect(url)
      }
    }, 1000)
  }

  function cancelConnect() {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    clearAutoRetry()
    setScreen('setup')
  }

  async function attemptConnect(url: string) {
    const normalized = url.trim().replace(/\/$/, '')
    if (!normalized) return
    setPendingUrl(normalized)
    setScreen('connecting')
    setErrorMsg('')
    clearAutoRetry()

    const controller = new AbortController()
    abortRef.current = controller
    const timer = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS)

    try {
      await fetch(normalized, { signal: controller.signal, mode: 'no-cors' })
      clearTimeout(timer)
      abortRef.current = null
      localStorage.setItem(STORAGE_KEY, normalized)
      window.location.href = normalized
    } catch {
      clearTimeout(timer)
      abortRef.current = null
      if (controller.signal.aborted && screen === 'connecting') {
        // user-cancelled: already back at setup
        return
      }
      setScreen('error')
      setErrorMsg('서버에 연결할 수 없습니다.\nURL을 확인하고 다시 시도하세요.')
      startAutoRetry(normalized)
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
          <button className="btn-secondary" style={{ maxWidth: 200, marginTop: '0.5rem' }} onClick={cancelConnect}>
            취소
          </button>
        </div>
      )}

      {screen === 'error' && (
        <div className="screen error-screen">
          <div className="error-icon">✕</div>
          <h2>연결 실패</h2>
          <p className="error-msg">{errorMsg}</p>
          <span className="url-badge">{pendingUrl}</span>
          <div className="button-row">
            <button className="btn-primary" onClick={() => { clearAutoRetry(); attemptConnect(pendingUrl) }}>
              다시 시도{countdown > 0 ? ` (${countdown}s)` : ''}
            </button>
            <button className="btn-secondary" onClick={() => { clearAutoRetry(); setScreen('setup') }}>
              서버 주소 변경
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default App
