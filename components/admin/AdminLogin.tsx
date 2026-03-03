'use client'
// components/admin/AdminLogin.tsx
import { s } from './adminStyles'

interface Props {
  username: string
  password: string
  loginErr: string
  onUsername: (v: string) => void
  onPassword: (v: string) => void
  onLogin: () => void
}

export default function AdminLogin({ username, password, loginErr, onUsername, onPassword, onLogin }: Props) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F5F4F0' }}>
      <div style={{ width:360, padding:'3rem', background:'#fff', border:'1px solid #E0DED8', display:'flex', flexDirection:'column' }}>
        <h1 style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.8rem', marginBottom:'0.3rem' }}>Admin</h1>
        <p style={{ color:'#888880', fontSize:'11px', letterSpacing:'0.08em', marginBottom:'2rem' }}>Youjin Portfolio CMS</p>

        <label style={s.label}>아이디</label>
        <input
          style={s.input}
          value={username}
          onChange={e => onUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onLogin()}
          placeholder="admin"
          autoComplete="username"
        />

        <label style={s.label}>비밀번호</label>
        <input
          style={s.input}
          type="password"
          value={password}
          onChange={e => onPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onLogin()}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        {loginErr && (
          <p style={{ color:'#C0392B', fontSize:'11px', marginBottom:'0.75rem' }}>{loginErr}</p>
        )}

        <button
          onClick={onLogin}
          style={{ padding:'0.8rem', marginTop:'1rem', background:'#1A1A18', color:'#fff', fontFamily:'DM Mono, monospace', fontSize:'11px', letterSpacing:'0.12em', textTransform:'uppercase', border:'none', cursor:'pointer' }}
        >
          로그인
        </button>
      </div>
    </div>
  )
}
