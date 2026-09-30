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
  AlignLeft,
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
import { Separator } from '@/components/ui/separator'

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
        multicolor: true,
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
          'ProseMirror min-h-[420px] p-6 sm:p-8 focus:outline-none text-foreground leading-relaxed text-base font-sans selection:bg-primary/20',
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
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs">Initializing canvas...</span>
      </div>
    )
  }

  // Active block format label
  const currentBlockLabel = editor.isActive('heading', { level: 1 })
    ? 'Heading 1'
    : editor.isActive('heading', { level: 2 })
    ? 'Heading 2'
    : editor.isActive('heading', { level: 3 })
    ? 'Heading 3'
    : 'Text'

  return (
    <div className="w-full flex flex-col rounded-2xl border border-border/70 bg-card/85 backdrop-blur-xl shadow-sm overflow-hidden transition-colors">
      {/* Sticky Formatting Toolbar */}
      {editable && (
        <div className="sticky top-0 z-20 border-b border-border/60 bg-muted/40 backdrop-blur-md px-3 py-2 flex flex-wrap items-center gap-1 text-muted-foreground select-none">
          {/* Undo / Redo */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-4 bg-border/80 mx-1" />

          {/* Heading / Block Style Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-accent hover:text-accent-foreground transition text-foreground"
              >
                <span>{currentBlockLabel}</span>
                <Pilcrow className="w-3 h-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={editor.isActive('paragraph') ? 'bg-accent font-bold' : ''}
              >
                <Pilcrow className="w-3.5 h-3.5 mr-2" />
                <span>Text</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={
                  editor.isActive('heading', { level: 1 })
                    ? 'bg-accent font-bold'
                    : ''
                }
              >
                <Heading1 className="w-3.5 h-3.5 mr-2" />
                <span>Heading 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={
                  editor.isActive('heading', { level: 2 })
                    ? 'bg-accent font-bold'
                    : ''
                }
              >
                <Heading2 className="w-3.5 h-3.5 mr-2" />
                <span>Heading 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                className={
                  editor.isActive('heading', { level: 3 })
                    ? 'bg-accent font-bold'
                    : ''
                }
              >
                <Heading3 className="w-3.5 h-3.5 mr-2" />
                <span>Heading 3</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-4 bg-border/80 mx-1" />

          {/* Inline Text Styles */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                editor.isActive('bold')
                  ? 'bg-primary/15 text-primary font-bold shadow-xs'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                editor.isActive('italic')
                  ? 'bg-primary/15 text-primary font-bold shadow-xs'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                editor.isActive('strike')
                  ? 'bg-primary/15 text-primary font-bold shadow-xs'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                editor.isActive('highlight')
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              title="Highlight text"
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                editor.isActive('code')
                  ? 'bg-primary/15 text-primary font-mono shadow-xs'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              title="Inline code"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-4 bg-border/80 mx-1" />

          {/* Lists & Quotes */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                editor.isActive('bulletList')
                  ? 'bg-primary/15 text-primary font-bold shadow-xs'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                editor.isActive('orderedList')
                  ? 'bg-primary/15 text-primary font-bold shadow-xs'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                editor.isActive('blockquote')
                  ? 'bg-primary/15 text-primary font-bold shadow-xs'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              title="Quote Callout"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                editor.isActive('codeBlock')
                  ? 'bg-primary/15 text-primary font-mono shadow-xs'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              title="Code Block"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="p-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition cursor-pointer"
              title="Horizontal Divider"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-4 bg-border/80 mx-1" />

          {/* Link Popover */}
          <Popover open={isLinkOpen} onOpenChange={setIsLinkOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  editor.isActive('link')
                    ? 'bg-primary/15 text-primary font-bold shadow-xs'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
                title="Add / Edit Link"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-foreground">Insert Link</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="h-8 text-xs bg-background"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        setLink()
                      }
                    }}
                  />
                  <Button size="sm" onClick={setLink} className="h-8 px-3 text-xs">
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
                    <Unlink className="w-3 h-3 mr-1.5" />
                    Remove Link
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Main Canvas Editor Area */}
      <div className="cursor-text bg-transparent">
        <EditorContent editor={editor} />
      </div>

      {/* Editor Stats Footer */}
      <div className="border-t border-border/40 px-6 py-2.5 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
        <div className="flex items-center gap-3">
          <span>{stats.words} words</span>
          <span>•</span>
          <span>{stats.readingTime}</span>
        </div>
        <div className="text-[10px] text-muted-foreground/80 font-mono">
          Markdown shortcuts supported
        </div>
      </div>
    </div>
  )
}