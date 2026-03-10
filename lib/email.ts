// lib/email.ts
// Resend를 통한 이메일 발송 유틸

export interface ContactPayload {
  name: string
  email: string
  phone?: string
  project?: string
  budget?: string
  message: string
}

/* ── 운영자 알림 이메일 HTML ── */
export function buildNotifyHtml(data: ContactPayload): string {
  const row = (label: string, value: string) =>
    value ? `
    <tr>
      <td style="padding:10px 16px;background:#f9f8f6;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#888;width:110px;border-bottom:1px solid #eee;font-family:monospace">${label}</td>
      <td style="padding:10px 16px;font-size:13px;color:#1a1a18;border-bottom:1px solid #eee">${value}</td>
    </tr>` : ''

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'DM Mono',monospace,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #e0ded8">

    <!-- 헤더 -->
    <div style="background:#1a1a18;padding:24px 32px;display:flex;align-items:center;gap:12px">
      <span style="font-family:Georgia,serif;font-size:1.3rem;font-style:italic;color:#fff;font-weight:700">Youjin</span>
      <span style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-left:8px">새 상담 문의</span>
    </div>

    <!-- 본문 -->
    <div style="padding:28px 32px 8px">
      <p style="font-size:13px;color:#555;line-height:1.7;margin:0 0 20px">
        <strong style="color:#1a1a18">${data.name}</strong>님으로부터 새 상담 문의가 접수되었습니다.
      </p>
    </div>

    <!-- 정보 테이블 -->
    <table style="width:100%;border-collapse:collapse;border-top:2px solid #1a1a18">
      ${row('이름', data.name)}
      ${row('이메일', data.email)}
      ${row('연락처', data.phone ?? '')}
      ${row('프로젝트', data.project ?? '')}
      ${row('예산', data.budget ?? '')}
    </table>

    <!-- 메시지 -->
    <div style="padding:20px 32px;border-top:1px solid #eee">
      <p style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin:0 0 10px;font-family:monospace">문의 내용</p>
      <p style="font-size:13px;color:#333;line-height:1.85;margin:0;white-space:pre-wrap">${data.message}</p>
    </div>

    <!-- 답장 버튼 -->
    <div style="padding:20px 32px 28px;border-top:1px solid #eee">
      <a href="mailto:${data.email}?subject=Re: 상담 문의 회신"
        style="display:inline-block;padding:10px 24px;background:#1a1a18;color:#fff;text-decoration:none;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-family:monospace">
        답장하기 →
      </a>
    </div>

    <!-- 푸터 -->
    <div style="padding:16px 32px;background:#f9f8f6;border-top:1px solid #eee">
      <p style="font-size:10px;color:#aaa;margin:0;letter-spacing:0.06em">
        Youjin Portfolio · 자동 발송 이메일입니다
      </p>
    </div>
  </div>
</body>
</html>`
}

/* ── 문의자 자동 회신 HTML ── */
export function buildAutoReplyHtml(data: ContactPayload): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'DM Mono',monospace,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #e0ded8">

    <!-- 헤더 -->
    <div style="background:#1a1a18;padding:24px 32px">
      <span style="font-family:Georgia,serif;font-size:1.3rem;font-style:italic;color:#fff;font-weight:700">Youjin</span>
    </div>

    <!-- 본문 -->
    <div style="padding:32px 32px 24px">
      <h2 style="font-family:Georgia,serif;font-size:1.4rem;color:#1a1a18;margin:0 0 16px;font-weight:700">
        문의가 접수되었습니다
      </h2>
      <p style="font-size:13px;color:#555;line-height:1.85;margin:0 0 12px">
        안녕하세요, <strong style="color:#1a1a18">${data.name}</strong>님.
      </p>
      <p style="font-size:13px;color:#555;line-height:1.85;margin:0 0 24px">
        문의해 주셔서 감사합니다. 내용을 검토한 후 <strong style="color:#1a1a18">빠른 시일 내</strong>에 이메일로 회신 드리겠습니다.
      </p>

      <!-- 접수 내용 요약 -->
      <div style="background:#f9f8f6;border:1px solid #eee;padding:16px 20px;margin-bottom:24px">
        <p style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin:0 0 12px;font-family:monospace">접수 내용</p>
        <p style="font-size:12px;color:#333;line-height:1.8;margin:0;white-space:pre-wrap">${data.message}</p>
      </div>

      <p style="font-size:12px;color:#888;line-height:1.7;margin:0">
        급한 문의는 아래 연락처로 직접 연락주세요.
      </p>
    </div>

    <!-- 푸터 -->
    <div style="padding:20px 32px;background:#1a1a18">
      <p style="font-size:11px;color:rgba(255,255,255,0.5);margin:0;letter-spacing:0.06em;line-height:1.8">
        Youjin · Visual Designer<br>
        Seoul, Korea
      </p>
    </div>
  </div>
</body>
</html>`
}
