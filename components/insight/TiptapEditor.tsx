'use client'
// components/insight/TiptapEditor.tsx
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import { Extension } from '@tiptap/core'
import { useRef, useCallback } from 'react'

/* ── FontSize 커스텀 익스텐션 ── */
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] } },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize || null,
          renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: any) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }: any) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    } as any
  },
})

/* ── 툴바 버튼 ── */
function ToolBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title?: string; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: '28px', height: '28px', padding: '0 5px',
        background: active ? '#1A1A18' : 'transparent',
        color: active ? '#fff' : '#333',
        border: 'none', borderRadius: '3px',
        fontSize: '12px', fontFamily: 'DM Mono, monospace',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transition: 'background 0.12s, color 0.12s',
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!active && !disabled) (e.currentTarget as HTMLElement).style.background = '#F0EEE8' }}
      onMouseLeave={e => { if (!active && !disabled) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: '1px', height: '20px', background: '#D0CEC8', margin: '0 4px', flexShrink: 0 }} />
}

/* ── 툴바 ── */
function Toolbar({ editor, token }: { editor: Editor; token: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const highlightInputRef = useRef<HTMLInputElement>(null)

  const uploadImage = useCallback(async (file: File) => {
    const fd = new FormData()
    fd.append('image', file)
    const res = await fetch('/api/upload?folder=insights', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('youjin_token') || ''}` },
      body: fd,
    })
    const json = await res.json()
    if (res.ok && json.url) {
      editor.chain().focus().setImage({ src: json.url }).run()
    } else {
      alert('이미지 업로드 실패')
    }
  }, [editor])

  const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px']

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      display: 'flex', alignItems: 'center', flexWrap: 'wrap',
      gap: '2px', padding: '6px 10px',
      background: '#FAFAF8',
      borderBottom: '1px solid #D0CEC8',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>

      {/* 제목 스타일 */}
      <select
        onChange={e => {
          const v = e.target.value
          if (v === 'p') editor.chain().focus().setParagraph().run()
          else editor.chain().focus().toggleHeading({ level: Number(v) as 1|2|3 }).run()
        }}
        value={
          editor.isActive('heading', { level: 1 }) ? '1' :
          editor.isActive('heading', { level: 2 }) ? '2' :
          editor.isActive('heading', { level: 3 }) ? '3' : 'p'
        }
        style={{
          height: '28px', padding: '0 6px',
          border: '1px solid #D0CEC8', borderRadius: '3px',
          background: '#fff', fontSize: '11px',
          fontFamily: 'DM Mono, monospace', color: '#333',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        <option value="p">본문</option>
        <option value="1">제목 1</option>
        <option value="2">제목 2</option>
        <option value="3">제목 3</option>
      </select>

      {/* 글자 크기 */}
      <select
        onChange={e => {
          if (e.target.value) (editor.chain().focus() as any).setFontSize(e.target.value).run()
        }}
        style={{
          height: '28px', padding: '0 4px',
          border: '1px solid #D0CEC8', borderRadius: '3px',
          background: '#fff', fontSize: '11px',
          fontFamily: 'DM Mono, monospace', color: '#333',
          cursor: 'pointer', flexShrink: 0, width: '56px',
        }}
      >
        <option value="">크기</option>
        {FONT_SIZES.map(s => <option key={s} value={s}>{s.replace('px', '')}</option>)}
      </select>

      <Divider />

      {/* Bold / Italic / Underline */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="굵게 (Ctrl+B)">
        <b style={{ fontSize: '13px' }}>B</b>
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="기울임 (Ctrl+I)">
        <i style={{ fontSize: '13px', fontFamily: 'serif' }}>I</i>
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="밑줄 (Ctrl+U)">
        <span style={{ textDecoration: 'underline', fontSize: '13px' }}>U</span>
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="취소선">
        <span style={{ textDecoration: 'line-through', fontSize: '13px' }}>S</span>
      </ToolBtn>

      <Divider />

      {/* 글자색 */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <ToolBtn onClick={() => colorInputRef.current?.click()} title="글자 색상">
          <span style={{ fontSize: '11px' }}>A</span>
          <span style={{ display: 'block', width: '14px', height: '3px', background: editor.getAttributes('textStyle').color || '#1A1A18', borderRadius: '1px', marginTop: '1px' }} />
        </ToolBtn>
        <input ref={colorInputRef} type="color" defaultValue="#1A1A18"
          onChange={e => editor.chain().focus().setColor(e.target.value).run()}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
        />
      </div>

      {/* 형광펜 */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <ToolBtn onClick={() => highlightInputRef.current?.click()} active={editor.isActive('highlight')} title="형광펜">
          <span style={{ fontSize: '11px', background: '#FFEC80', padding: '0 2px' }}>H</span>
        </ToolBtn>
        <input ref={highlightInputRef} type="color" defaultValue="#FFEC80"
          onChange={e => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
        />
      </div>

      <Divider />

      {/* 정렬 */}
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="왼쪽 정렬">≡</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="가운데 정렬">
        <span style={{ letterSpacing: '1px' }}>≡</span>
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="오른쪽 정렬">≡</ToolBtn>

      <Divider />

      {/* 리스트 */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="글머리 목록">
        <span style={{ fontSize: '13px' }}>•≡</span>
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 목록">
        <span style={{ fontSize: '13px' }}>1≡</span>
      </ToolBtn>

      {/* 인용구 */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="인용구">
        <span style={{ fontSize: '14px' }}>"</span>
      </ToolBtn>

      {/* 구분선 */}
      <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선">
        <span style={{ fontSize: '13px' }}>—</span>
      </ToolBtn>

      <Divider />

      {/* 이미지 업로드 */}
      <ToolBtn onClick={() => fileInputRef.current?.click()} title="이미지 삽입">
        <span style={{ fontSize: '13px' }}>🖼</span>
      </ToolBtn>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={async e => {
          const file = e.target.files?.[0]
          if (file) await uploadImage(file)
          e.target.value = ''
        }}
      />

      {/* 실행취소 / 다시실행 */}
      <Divider />
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="실행취소">↩</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="다시실행">↪</ToolBtn>
    </div>
  )
}

/* ── 메인 에디터 컴포넌트 ── */
interface Props {
  content?: string   // HTML string
  onChange?: (html: string) => void
  token: string
}

export default function TiptapEditor({ content, onChange, token }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontSize,
      Color,
      Underline,
      Highlight.configure({ multicolor: true }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
      Link.configure({ openOnClick: false }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        style: [
          'min-height: 500px',
          'padding: 2rem 2.5rem',
          'outline: none',
          'font-family: DM Mono, monospace',
          'font-size: 14px',
          'line-height: 1.9',
          'color: #1A1A18',
        ].join(';'),
      },
    },
  })

  if (!editor) return null

  return (
    <div style={{ border: '1px solid #D0CEC8', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Toolbar editor={editor} token={token} />

      <EditorContent editor={editor} />

      {/* 에디터 전역 스타일 */}
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #C8C6C0;
          pointer-events: none;
          position: absolute;
          font-style: normal;
        }
        .ProseMirror p { margin: 0 0 0.6em; }
        .ProseMirror h1 { font-family: 'DM Serif Display', serif; font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; margin: 1.5em 0 0.5em; color: #1A1A18; }
        .ProseMirror h2 { font-family: 'DM Serif Display', serif; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.01em; line-height: 1.3; margin: 1.4em 0 0.5em; color: #1A1A18; }
        .ProseMirror h3 { font-family: 'DM Serif Display', serif; font-size: 1.2rem; font-weight: 700; line-height: 1.4; margin: 1.2em 0 0.4em; color: #1A1A18; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; margin: 0.6em 0; }
        .ProseMirror li { margin-bottom: 0.3em; line-height: 1.8; }
        .ProseMirror blockquote {
          border-left: 3px solid #D0392B;
          margin: 1em 0; padding: 0.5em 1em;
          color: #555; font-style: italic;
          background: #FDF9F9;
        }
        .ProseMirror blockquote p { margin: 0; }
        .ProseMirror hr { border: none; border-top: 1px solid #D0CEC8; margin: 2em 0; }
        .ProseMirror img { max-width: 100%; height: auto; display: block; margin: 1em auto; cursor: pointer; }
        .ProseMirror img.ProseMirror-selectednode { outline: 2px solid #D0392B; }
        .ProseMirror a { color: #D0392B; text-decoration: underline; }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror mark { border-radius: 2px; padding: 0 2px; }
      `}</style>
    </div>
  )
}
