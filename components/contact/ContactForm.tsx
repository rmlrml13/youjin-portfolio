'use client'
// components/contact/ContactForm.tsx
import { useState } from 'react'

type Field = { label: string; name: string; type: string; placeholder: string; required?: boolean }

const FIELDS: Field[] = [
  { label: '이름',          name: 'name',    type: 'text',  placeholder: '홍길동',             required: true },
  { label: '이메일',        name: 'email',   type: 'email', placeholder: 'hello@example.com', required: true },
  { label: '연락처 (선택)', name: 'phone',   type: 'text',  placeholder: '010-0000-0000' },
  { label: '프로젝트 유형', name: 'project', type: 'text',  placeholder: 'Branding · 패키지 디자인 · 기타' },
]

const BUDGET_OPTIONS = ['미정', '50만원 미만', '50–100만원', '100–300만원', '300만원 이상']

export default function ContactForm() {
  const [form, setForm]     = useState({ name: '', email: '', phone: '', project: '', budget: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      alert('이름, 이메일, 문의 내용은 필수입니다.')
      return
    }
    setStatus('sending')
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setStatus(res.ok ? 'done' : 'error')
  }

  if (status === 'done') {
    return (
      <div className="contact-form-done">
        <div className="contact-form-done-icon">✓</div>
        <h3>문의가 접수되었습니다</h3>
        <p>빠른 시일 내에 이메일로 회신 드리겠습니다.</p>
      </div>
    )
  }

  return (
    <div className="contact-form">

      <div className="contact-form-grid">
        {FIELDS.map(f => (
          <div key={f.name} className="contact-form-field">
            <label className="contact-form-label">
              {f.label}{f.required && <span style={{ color: '#C8B89A', marginLeft: '3px' }}>*</span>}
            </label>
            <input
              type={f.type}
              name={f.name}
              value={(form as any)[f.name]}
              onChange={handleChange}
              placeholder={f.placeholder}
              className="contact-form-input"
            />
          </div>
        ))}
      </div>

      {/* 예산 선택 */}
      <div className="contact-form-field" style={{ marginTop: '1.25rem' }}>
        <label className="contact-form-label">예산 규모 (선택)</label>
        <div className="contact-budget-options">
          {BUDGET_OPTIONS.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => setForm(p => ({ ...p, budget: opt === form.budget ? '' : opt }))}
              className={`contact-budget-btn${form.budget === opt ? ' active' : ''}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* 메시지 */}
      <div className="contact-form-field" style={{ marginTop: '1.25rem' }}>
        <label className="contact-form-label">
          문의 내용<span style={{ color: '#C8B89A', marginLeft: '3px' }}>*</span>
        </label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="프로젝트에 대해 자유롭게 적어주세요."
          rows={5}
          className="contact-form-input contact-form-textarea"
        />
      </div>

      {status === 'error' && (
        <p style={{ fontSize: '12px', color: '#C0392B', marginTop: '0.75rem', letterSpacing: '0.04em' }}>
          전송 중 오류가 발생했습니다. 다시 시도해주세요.
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={status === 'sending'}
        className="contact-submit-btn"
      >
        {status === 'sending' ? '전송 중...' : '문의 보내기 →'}
      </button>

    </div>
  )
}
