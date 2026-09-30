"use client"

import { useEffect, useState, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Link } from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Code,
  Highlighter,
  Link as LinkIcon,
  Unlink,
  Undo2,
  Redo2,
  Pilcrow,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  editable?: boolean
}

export default function TiptapEditor({
  content,
  onChange,
  editable = true,
}: TiptapEditorProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [isLinkOpen, setIsLinkOpen] = useState(false)

  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline font-medium cursor-pointer hover:opacity-80 transition',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'ProseMirror min-h-[420px] p-6 sm:p-8 focus:outline-none text-foreground leading-relaxed text-sm sm:text-base font-inter selection:bg-primary/20',
      },
    },
    immediatelyRender: false,
  })

  // Synchronize content when loaded asynchronously
  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      if (!editor.isFocused) {
        editor.commands.setContent(content || '<p></p>')
      }
    }
  }, [content, editor])

  // Calculate statistics (word count, reading time)
  const stats = useMemo(() => {
    if (!content) return { words: 0, readingTime: '1 min read' }
    const text = content.replace(/<[^>]*>/g, ' ').trim()
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0
    const minutes = Math.max(1, Math.ceil(words / 200))
    return {
      words,
      readingTime: `${minutes} min read`,
    }
  }, [content])

  const setLink = () => {
    if (!editor) return
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setIsLinkOpen(false)
      return
    }

    const formattedUrl =
      linkUrl.startsWith('http://') || linkUrl.startsWith('https://')
        ? linkUrl
        : `https://${linkUrl}`

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: formattedUrl })
      .run()
    setLinkUrl('')
    setIsLinkOpen(false)
  }

  if (!editor) {
    return (
      <div className="min-h-[350px] flex flex-col items-center justify-center text-muted-foreground">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-xs">Loading editor...</span>
      </div>
    )
  }

  const currentBlockLabel = editor.isActive('heading', { level: 1 })
    ? 'Heading 1'
    : editor.isActive('heading', { level: 2 })
    ? 'Heading 2'
    : editor.isActive('heading', { level: 3 })
    ? 'Heading 3'
    : 'Text'

  return (
    <div className="w-full flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden transition-colors">
      {/* Editorial Formatting Toolbar */}
      {editable && (
        <div className="border-b border-border bg-surface-secondary px-3 py-1.5 flex flex-wrap items-center gap-1 text-muted-foreground select-none">
          {/* Undo / Redo */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-30 transition cursor-pointer"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded-md hover:bg-muted hover:text-foreground disabled:opacity-30 transition cursor-pointer"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-3.5 bg-border mx-1" />

          {/* Heading Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium hover:bg-muted text-foreground transition cursor-pointer"
              >
                <span>{currentBlockLabel}</span>
                <Pilcrow className="w-3 h-3 text-muted-foreground opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36">
              <DropdownMenuItem
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={editor.isActive('paragraph') ? 'font-semibold bg-muted' : ''}
              >
                <Pilcrow className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <span>Text</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={
                  editor.isActive('heading', { level: 1 })
                    ? 'font-semibold bg-muted'
                    : ''
                }
              >
                <Heading1 className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <span>Heading 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={
                  editor.isActive('heading', { level: 2 })
                    ? 'font-semibold bg-muted'
                    : ''
                }
              >
                <Heading2 className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <span>Heading 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                className={
                  editor.isActive('heading', { level: 3 })
                    ? 'font-semibold bg-muted'
                    : ''
                }
              >
                <Heading3 className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <span>Heading 3</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-3.5 bg-border mx-1" />

          {/* Inline Formats */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                editor.isActive('bold')
                  ? 'bg-muted text-foreground font-semibold'
                  : 'hover:bg-muted hover:text-foreground'
              }`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                editor.isActive('italic')
                  ? 'bg-muted text-foreground font-semibold'
                  : 'hover:bg-muted hover:text-foreground'
              }`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                editor.isActive('strike')
                  ? 'bg-muted text-foreground font-semibold'
                  : 'hover:bg-muted hover:text-foreground'
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                editor.isActive('highlight')
                  ? 'bg-muted text-foreground font-semibold'
                  : 'hover:bg-muted hover:text-foreground'
              }`}
              title="Highlight"
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                editor.isActive('code')
                  ? 'bg-muted text-foreground font-semibold'
                  : 'hover:bg-muted hover:text-foreground'
              }`}
              title="Inline code"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-3.5 bg-border mx-1" />

          {/* Lists & Quotes */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                editor.isActive('bulletList')
                  ? 'bg-muted text-foreground font-semibold'
                  : 'hover:bg-muted hover:text-foreground'
              }`}
              title="Bullet list"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                editor.isActive('orderedList')
                  ? 'bg-muted text-foreground font-semibold'
                  : 'hover:bg-muted hover:text-foreground'
              }`}
              title="Numbered list"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                editor.isActive('blockquote')
                  ? 'bg-muted text-foreground font-semibold'
                  : 'hover:bg-muted hover:text-foreground'
              }`}
              title="Quote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                editor.isActive('codeBlock')
                  ? 'bg-muted text-foreground font-semibold'
                  : 'hover:bg-muted hover:text-foreground'
              }`}
              title="Code block"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="p-1.5 rounded-md hover:bg-muted hover:text-foreground transition cursor-pointer"
              title="Divider"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-3.5 bg-border mx-1" />

          {/* Link Popover */}
          <Popover open={isLinkOpen} onOpenChange={setIsLinkOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  editor.isActive('link')
                    ? 'bg-muted text-foreground font-semibold'
                    : 'hover:bg-muted hover:text-foreground'
                }`}
                title="Link"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2.5" align="start">
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-foreground">Insert link</div>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="h-8 text-xs bg-card"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        setLink()
                      }
                    }}
                  />
                  <Button size="sm" onClick={setLink} className="h-8 px-2.5 text-xs">
                    Apply
                  </Button>
                </div>
                {editor.isActive('link') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run()
                      setIsLinkOpen(false)
                    }}
                    className="w-full h-7 text-[11px] text-destructive hover:bg-destructive/10"
                  >
                    <Unlink className="w-3 h-3 mr-1" />
                    Remove link
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="cursor-text bg-card">
        <EditorContent editor={editor} />
      </div>

      {/* Stats Footer */}
      <div className="border-t border-border/60 px-6 py-2 bg-surface-secondary flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2 font-medium">
          <span>{stats.words} words</span>
          <span>•</span>
          <span>{stats.readingTime}</span>
        </div>
        <div className="text-[10px] text-subtle-foreground font-mono">
          Markdown supported
        </div>
      </div>
    </div>
  )
}