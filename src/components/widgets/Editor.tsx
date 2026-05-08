'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { 
 Bold, 
 Italic, 
 Underline as UnderlineIcon, 
 List, 
 ListOrdered, 
 Heading1, 
 Heading2, 
 Undo, 
 Redo,
 Strikethrough,
 Quote,
 CheckSquare,
 Highlighter,
 Clock
} from 'lucide-react';

interface EditorProps {
 content: string;
 onChange: (html: string) => void;
 placeholder?: string;
}

export function Editor({ content, onChange, placeholder }: EditorProps) {
 const editor = useEditor({
 extensions: [
 StarterKit,
 Placeholder.configure({
 placeholder: placeholder || 'Start writing your journal...',
 }),
 CharacterCount,
 Underline,
 TextStyle,
 Color,
 Highlight.configure({ multicolor: true }),
 TaskList,
 TaskItem.configure({
 nested: true,
 }),
 ],
 content,
 immediatelyRender: false,
 onUpdate: ({ editor }) => {
 onChange(editor.getHTML());
 },
 });

 // Handle external content updates (like Clear button or tab switch)
 useEffect(() => {
 if (editor && content !== editor.getHTML()) {
 editor.commands.setContent(content);
 }
 }, [content, editor]);

 if (!editor) {
 return null;
 }

 const addTimestamp = () => {
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  editor.chain().focus().insertContent(`[${time}] `).run();
 };

 return (
 <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/20 transition-all duration-200">
 {/* Toolbar */}
 <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
 <button
 onClick={() => editor.chain().focus().toggleBold().run()}
 className={`p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive('bold') ? 'bg-zinc-200 dark:bg-zinc-800 text-teal-600' : 'text-zinc-600 dark:text-zinc-400'}`}
 title="Bold"
 >
 <Bold className="w-4 h-4" />
 </button>
 <button
 onClick={() => editor.chain().focus().toggleItalic().run()}
 className={`p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive('italic') ? 'bg-zinc-200 dark:bg-zinc-800 text-teal-600' : 'text-zinc-600 dark:text-zinc-400'}`}
 title="Italic"
 >
 <Italic className="w-4 h-4" />
 </button>
 <button
 onClick={() => editor.chain().focus().toggleUnderline().run()}
 className={`p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive('underline') ? 'bg-zinc-200 dark:bg-zinc-800 text-teal-600' : 'text-zinc-600 dark:text-zinc-400'}`}
 title="Underline"
 >
 <UnderlineIcon className="w-4 h-4" />
 </button>
 <button
 onClick={() => editor.chain().focus().toggleStrike().run()}
 className={`p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive('strike') ? 'bg-zinc-200 dark:bg-zinc-800 text-teal-600' : 'text-zinc-600 dark:text-zinc-400'}`}
 title="Strikethrough"
 >
 <Strikethrough className="w-4 h-4" />
 </button>
 
 <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

 <button
 onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
 className={`p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-zinc-200 dark:bg-zinc-800 text-teal-600' : 'text-zinc-600 dark:text-zinc-400'}`}
 title="Heading 1"
 >
 <Heading1 className="w-4 h-4" />
 </button>
 <button
 onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
 className={`p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-zinc-200 dark:bg-zinc-800 text-teal-600' : 'text-zinc-600 dark:text-zinc-400'}`}
 title="Heading 2"
 >
 <Heading2 className="w-4 h-4" />
 </button>

 <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

 <button
 onClick={() => editor.chain().focus().toggleBulletList().run()}
 className={`p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive('bulletList') ? 'bg-zinc-200 dark:bg-zinc-800 text-teal-600' : 'text-zinc-600 dark:text-zinc-400'}`}
 title="Bullet List"
 >
 <List className="w-4 h-4" />
 </button>
 <button
 onClick={() => editor.chain().focus().toggleOrderedList().run()}
 className={`p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive('orderedList') ? 'bg-zinc-200 dark:bg-zinc-800 text-teal-600' : 'text-zinc-600 dark:text-zinc-400'}`}
 title="Ordered List"
 >
 <ListOrdered className="w-4 h-4" />
 </button>
 <button
 onClick={() => editor.chain().focus().toggleTaskList().run()}
 className={`p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive('taskList') ? 'bg-zinc-200 dark:bg-zinc-800 text-teal-600' : 'text-zinc-600 dark:text-zinc-400'}`}
 title="Checklist"
 >
 <CheckSquare className="w-4 h-4" />
 </button>

 <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

 <button
 onClick={() => editor.chain().focus().toggleBlockquote().run()}
 className={`p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive('blockquote') ? 'bg-zinc-200 dark:bg-zinc-800 text-teal-600' : 'text-zinc-600 dark:text-zinc-400'}`}
 title="Quote"
 >
 <Quote className="w-4 h-4" />
 </button>

 <button
 onClick={() => editor.chain().focus().toggleHighlight().run()}
 className={`p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${editor.isActive('highlight') ? 'bg-zinc-200 dark:bg-zinc-800 text-teal-600' : 'text-zinc-600 dark:text-zinc-400'}`}
 title="Highlight"
 >
 <Highlighter className="w-4 h-4" />
 </button>

 <button
 onClick={addTimestamp}
 className="p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
 title="Insert Timestamp"
 >
 <Clock className="w-4 h-4" />
 </button>

 <div className="flex-grow" />

 <button
 onClick={() => editor.chain().focus().undo().run()}
 className="p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
 title="Undo"
 disabled={!editor.can().undo()}
 >
 <Undo className="w-4 h-4" />
 </button>
 <button
 onClick={() => editor.chain().focus().redo().run()}
 className="p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
 title="Redo"
 disabled={!editor.can().redo()}
 >
 <Redo className="w-4 h-4" />
 </button>
 </div>

 {/* Editor Content Area */}
 <div className="prose prose-zinc dark:prose-invert max-w-none p-4 min-h-[300px]">
 <EditorContent editor={editor} className="outline-none" />
 </div>

 {/* Footer Info */}
 <div className="px-4 py-2 bg-zinc-50/30 dark:bg-zinc-900/10 border-t border-zinc-200 dark:border-zinc-800 flex justify-end items-center">
 <span className="text-xs uppercase text-zinc-400 dark:text-zinc-500 font-medium">
 {editor.storage.characterCount.characters()} characters
 </span>
 </div>
 </div>
 );
}
