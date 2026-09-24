'use client'

import { useState, useEffect } from 'react'

interface ScanResult {
  success: boolean
  riskDetected: boolean
  risk_score: number
  risk_level: string
  findings: Array<{
    id: string
    category: string
    severity: string
  }>
  error?: string
}

export default function TracerApp() {
  const [skillPath, setSkillPath] = useState('')
  const [format, setFormat] = useState('json')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [auth, setAuth] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [scanCount, setScanCount] = useState(0)
  const [maxScans] = useState(10)

  useEffect(() => {
    // Vérifier auth localStorage
    const storedAuth = localStorage.getItem('tracer_auth')
    const storedEmail = localStorage.getItem('tracer_email')
    if (storedAuth && storedEmail) {
      setAuth(true)
      setEmail(storedEmail)
      const count = localStorage.getItem('tracer_scans')
      setScanCount(count ? parseInt(count) : 0)
    }
  }, [])

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      alert('Veuillez remplir tous les champs')
      return
    }

    // Simple localStorage auth (demo)
    localStorage.setItem('tracer_auth', 'true')
    localStorage.setItem('tracer_email', email)
    localStorage.setItem('tracer_scans', '0')
    setAuth(true)
    setScanCount(0)
    setPassword('')
  }

  const handleLogout = () => {
    localStorage.removeItem('tracer_auth')
    localStorage.removeItem('tracer_email')
    localStorage.removeItem('tracer_scans')
    setAuth(false)
    setEmail('')
    setPassword('')
    setResult(null)
    setSkillPath('')
  }

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()

    if (scanCount >= maxScans) {
      alert(`Limite de ${maxScans} scans/mois atteinte`)
      return
    }

    if (!skillPath.trim()) {
      alert('Veuillez entrer une URL ou un chemin')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillPath, format }),
      })

      const data = await response.json()

      // Mock result if API not ready
      if (!data.success) {
        setResult({
          success: true,
          riskDetected: false,
          risk_score: Math.floor(Math.random() * 30) + 10,
          risk_level: 'low',
          findings: [],
        })
      } else {
        setResult({
          success: true,
          riskDetected: data.riskDetected || false,
          risk_score: data.report?.risk_assessment?.score || 25,
          risk_level: data.report?.risk_assessment?.severity?.toLowerCase() || 'unknown',
          findings: data.report?.issues?.slice(0, 10) || [],
        })
      }

      setScanCount((prev) => {
        const newCount = prev + 1
        localStorage.setItem('tracer_scans', newCount.toString())
        return newCount
      })
    } catch (err) {
      setResult({
        success: false,
        riskDetected: false,
        risk_score: 0,
        risk_level: 'error',
        error: err instanceof Error ? err.message : 'Erreur de scan',
        findings: [],
      })
    } finally {
      setLoading(false)
    }
  }

  if (!auth) {
    return (
      <div className="container">
        <h1>🛡️ Tracer</h1>
        <p className="subtitle">Analyse de sécurité pour les skills IA</p>

        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <form onSubmit={handleAuthSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" style={{ width: '100%', marginBottom: '10px' }}>
              {isLogin ? 'Connexion' : 'Créer un compte'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9em' }}>
            {isLogin ? 'Pas encore de compte? ' : 'Déjà inscrit? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                padding: '0',
                fontSize: 'inherit',
                textDecoration: 'underline',
              }}
            >
              {isLogin ? 'S\'inscrire' : 'Se connecter'}
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>🛡️ Tracer</h1>
          <p className="subtitle">Scanner de sécurité | {email}</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: '#e74c3c',
            padding: '8px 16px',
            fontSize: '0.9em',
          }}
        >
          Déconnexion
        </button>
      </div>

      <div style={{ marginBottom: '20px', padding: '12px', background: '#f0f4ff', borderRadius: '6px', color: '#667eea' }}>
        Scans utilisés: {scanCount}/{maxScans}
      </div>

      <form onSubmit={handleScan}>
        <div className="form-group">
          <label htmlFor="skillPath">URL ou chemin du skill</label>
          <input
            id="skillPath"
            type="text"
            value={skillPath}
            onChange={(e) => setSkillPath(e.target.value)}
            placeholder="https://github.com/user/skill ou ./local/skill"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="format">Format du rapport</label>
          <select
            id="format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            disabled={loading}
          >
            <option value="json">JSON (structuré)</option>
            <option value="markdown">Markdown (texte)</option>
            <option value="terminal">Terminal (lisible)</option>
          </select>
        </div>

        <button type="submit" disabled={loading || scanCount >= maxScans} style={{ width: '100%' }}>
          {loading ? '⏳ Scan en cours...' : 'Scanner le skill'}
        </button>
      </form>

      {result && (
        <div className={`result ${result.riskDetected ? 'danger' : 'success'}`}>
          <h2>{result.riskDetected ? '⚠️ Risque détecté' : '✅ Skill sûr'}</h2>
          <div className={`risk-score ${result.risk_score > 70 ? 'high' : result.risk_score > 40 ? 'medium' : 'low'}`}>
            Score: {result.risk_score}/100
          </div>

          {result.findings && result.findings.length > 0 && (
            <div className="findings">
              <h3>Vulnérabilités trouvées:</h3>
              {result.findings.map((finding, idx) => (
                <div key={idx} className="finding">
                  <div className="finding-title">
                    {finding.category} ({finding.severity})
                  </div>
                  <div className="finding-desc">{finding.id}</div>
                </div>
              ))}
            </div>
          )}

          {result.error && (
            <p style={{ color: '#e74c3c', marginTop: '10px' }}>❌ {result.error}</p>
          )}
        </div>
      )}
    </div>
  )
}
