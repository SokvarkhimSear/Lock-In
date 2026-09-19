import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckSquare,
  Copy,
  FileText,
  Plus,
  Trash2,
  Check,
  Tag,
  Sparkles,
  Calendar,
  Layers,
  Edit3,
  X,
  ListX
} from 'lucide-react';
import { NoteItem } from '../types';
import { getStoredNotes, saveStoredNotes, syncDeleteNote, syncSaveNote } from '../utils/storage';
import { subscribeToNotes } from '../lib/firebase';

export const ScratchpadWidget: React.FC = () => {
  const [notes, setNotes] = useState<NoteItem[]>(() => getStoredNotes());
  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    const stored = getStoredNotes();
    return stored.length > 0 ? stored[0].id : 'note-1';
  });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [copied, setCopied] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to Firestore for real-time note updates across tabs/devices
  useEffect(() => {
    const unsubscribe = subscribeToNotes((remoteNotes) => {
      if (remoteNotes && remoteNotes.length > 0) {
        setNotes(remoteNotes);
        saveStoredNotes(remoteNotes);
      } else {
        // If remote is empty, seed with initial local notes
        const local = getStoredNotes();
        if (local.length > 0) {
          local.forEach((n) => syncSaveNote(n));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Active note lookup
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || notes[0] || null;
  }, [notes, activeNoteId]);

  // Persist notes helper
  const persistNotes = (updatedNotes: NoteItem[]) => {
    setNotes(updatedNotes);
    setSaveStatus('saving');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      saveStoredNotes(updatedNotes);
      // Sync each changed note to Firestore
      updatedNotes.forEach((n) => syncSaveNote(n));
      setSaveStatus('saved');
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Update active note content or title
  const handleUpdateActiveNote = (updates: Partial<NoteItem>) => {
    if (!activeNote) return;

    const updated = notes.map((n) => {
      if (n.id === activeNote.id) {
        const nextContent = updates.content !== undefined ? updates.content : n.content;
        const matches = nextContent.match(/#[a-zA-Z0-9_\-]+/g);
        const tags = matches ? Array.from(new Set(matches)) : [];
        return {
          ...n,
          ...updates,
          tags,
          updatedAt: new Date().toISOString(),
        };
      }
      return n;
    });

    persistNotes(updated);
  };

  // Create new note
  const handleCreateNewNote = () => {
    const newNoteNumber = notes.length + 1;
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: `Note #${newNoteNumber}`,
      content: `# Note #${newNoteNumber}\n- [ ] First action item\n\n#scratchpad Add notes here...`,
      mode: 'text',
      tags: ['#scratchpad'],
      updatedAt: new Date().toISOString(),
    };
    const updated = [newNote, ...notes];
    persistNotes(updated);
    setActiveNoteId(newNote.id);
  };

  // Delete note
  const handleDeleteNote = (idToDelete: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    syncDeleteNote(idToDelete);
    if (notes.length <= 1) {
      // If deleting the only note, reset it to blank rather than having null
      const resetNote: NoteItem = {
        id: `note-${Date.now()}`,
        title: 'Quick Scratchpad',
        content: '# Quick Scratchpad\n- [ ] New thought...',
        mode: 'text',
        tags: [],
        updatedAt: new Date().toISOString(),
      };
      persistNotes([resetNote]);
      setActiveNoteId(resetNote.id);
      return;
    }

    const updated = notes.filter((n) => n.id !== idToDelete);
    persistNotes(updated);
    if (activeNoteId === idToDelete) {
      setActiveNoteId(updated[0].id);
    }
  };

  // Insert tag helper
  const handleInsertTag = (tag: string) => {
    if (!activeNote) return;
    const curr = activeNote.content;
    const newText = curr.endsWith('\n') || curr === '' ? `${curr}${tag} ` : `${curr} ${tag} `;
    handleUpdateActiveNote({ content: newText });
  };

  // Insert template helper
  const handleInsertTemplate = (type: 'todo' | 'trading' | 'code') => {
    if (!activeNote) return;
    let snippet = '';
    if (type === 'todo') {
      snippet = `\n#focus High-Execution Checklist:\n- [ ] Priority 1 (Most critical):\n- [ ] Priority 2 (Secondary):\n- [ ] Priority 3 (Bonus):\n`;
    } else if (type === 'trading') {
      snippet = `\n#trading Session Log:\n- Asset / Setup: \n- Entry:      | Stop:      | Target: \n- Reflection: \n`;
    } else if (type === 'code') {
      snippet = `\n#cs Code Scratch:\n\`\`\`ts\n// Complexity:\nfunction solve() {\n  \n}\n\`\`\`\n`;
    }
    handleUpdateActiveNote({ content: activeNote.content + snippet });
  };

  // Toggle checklist item
  const toggleChecklistItem = (lineIndex: number) => {
    if (!activeNote) return;
    const lines = activeNote.content.split('\n');
    const targetLine = lines[lineIndex];

    if (targetLine.includes('- [ ]')) {
      lines[lineIndex] = targetLine.replace('- [ ]', '- [x]');
    } else if (targetLine.includes('- [x]')) {
      lines[lineIndex] = targetLine.replace('- [x]', '- [ ]');
    } else if (targetLine.startsWith('- ')) {
      lines[lineIndex] = targetLine.replace('- ', '- [x] ');
    } else {
      lines[lineIndex] = `- [x] ${targetLine}`;
    }

    handleUpdateActiveNote({ content: lines.join('\n') });
  };

  // Checklist statistics
  const checklistStats = useMemo(() => {
    if (!activeNote) return { total: 0, completed: 0, hasChecklist: false, hasCheckboxes: false };
    const lines = activeNote.content.split('\n');
    let total = 0;
    let completed = 0;
    lines.forEach((line) => {
      if (line.includes('- [x]')) {
        total++;
        completed++;
      } else if (line.includes('- [ ]') || line.startsWith('- ')) {
        total++;
      }
    });
    return {
      total,
      completed,
      hasChecklist: total > 0,
      hasCheckboxes: activeNote.content.includes('- [ ]') || activeNote.content.includes('- [x]')
    };
  }, [activeNote]);

  // Delete individual checklist item
  const handleDeleteChecklistItem = (lineIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeNote) return;
    const lines = activeNote.content.split('\n');
    lines.splice(lineIndex, 1);
    handleUpdateActiveNote({ content: lines.join('\n') });
  };

  // Clear completed checklist items only
  const handleClearCompleted = () => {
    if (!activeNote) return;
    const lines = activeNote.content.split('\n');
    const remaining = lines.filter((line) => !line.includes('- [x]'));
    handleUpdateActiveNote({ content: remaining.join('\n') });
  };

  // Remove all checklist items from the note
  const handleRemoveAllChecklist = () => {
    if (!activeNote) return;
    const lines = activeNote.content.split('\n');
    const remaining = lines.filter(
      (line) => !line.includes('- [ ]') && !line.includes('- [x]') && !line.startsWith('- ')
    );
    handleUpdateActiveNote({ content: remaining.join('\n') });
  };

  // Convert checklist to plain text by stripping checkbox brackets
  const handleRemoveCheckboxes = () => {
    if (!activeNote) return;
    const cleaned = activeNote.content
      .replace(/- \[[ xX]\] /g, '')
      .replace(/- \[[ xX]\]/g, '');
    handleUpdateActiveNote({ content: cleaned });
  };

  // Add new checklist line directly
  const handleAddChecklistLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote || !newChecklistText.trim()) return;
    const newLine = `- [ ] ${newChecklistText.trim()}`;
    const nextContent = activeNote.content ? `${activeNote.content}\n${newLine}` : newLine;
    handleUpdateActiveNote({ content: nextContent });
    setNewChecklistText('');
  };

  // Copy active note content
  const handleCopy = async () => {
    if (!activeNote) return;
    try {
      await navigator.clipboard.writeText(activeNote.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const detectedTags = activeNote?.tags || [];
  const wordCount = activeNote?.content.trim() ? activeNote.content.trim().split(/\s+/).length : 0;

  return (
    <div className="bg-[#161B26] border border-[#232B3E] rounded-xl p-4 sm:p-5 shadow-lg flex flex-col justify-between">
      {/* Widget Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#232B3E]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                <span>Interactive Notes & Scratchpad</span>
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400/90 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {saveStatus === 'saving' ? 'Syncing to Firebase...' : 'Synced to Firebase'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: New Note, Copy, Delete */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleCreateNewNote}
              className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-[#0B0F17] transition-colors shadow-sm"
              title="Create a new note"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Note</span>
            </button>

            {activeNote && (
              <>
                <button
                  onClick={handleCopy}
                  className="p-2 min-h-[36px] min-w-[36px] rounded-lg bg-[#0B0F17] border border-[#232B3E] text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
                  title="Copy note content"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => handleDeleteNote(activeNote.id)}
                  className="p-2 min-h-[36px] min-w-[36px] rounded-lg bg-[#0B0F17] border border-[#232B3E] text-slate-400 hover:text-rose-400 transition-colors flex items-center justify-center"
                  title="Delete current note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Note Tabs Bar (Responsive horizontal scroll) */}
        <div className="flex items-center gap-1.5 pt-3 pb-2 overflow-x-auto no-scrollbar border-b border-[#232B3E]/60">
          <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
          {notes.map((note) => {
            const isActive = note.id === activeNoteId;
            return (
              <div
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-[#232B3E] text-slate-100 font-semibold border-slate-600 shadow-sm'
                    : 'bg-[#0B0F17] text-slate-400 hover:text-slate-200 border-[#232B3E]'
                }`}
              >
                <span className="truncate max-w-[130px]">{note.title || 'Untitled'}</span>
                {notes.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    className="opacity-60 hover:opacity-100 p-0.5 rounded hover:text-rose-400 transition-opacity ml-1"
                    title="Delete this note"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Note Controls & Inline Title Editing */}
        {activeNote && (
          <div className="pt-3 space-y-3">
            {/* Title Input & Mode Switch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Edit3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => handleUpdateActiveNote({ title: e.target.value })}
                  placeholder="Note Title..."
                  className="bg-transparent border-b border-transparent hover:border-[#232B3E] focus:border-emerald-500 text-sm font-semibold text-slate-100 focus:outline-none transition-colors w-full py-0.5 truncate"
                />
              </div>

              {/* Mode Switch (Raw vs Checklist) */}
              <div className="flex items-center bg-[#0B0F17] border border-[#232B3E] rounded-lg p-0.5 text-xs font-medium self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleUpdateActiveNote({ mode: 'text' })}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors min-h-[30px] ${
                    activeNote.mode === 'text'
                      ? 'bg-[#232B3E] text-slate-100 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Raw Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateActiveNote({ mode: 'checklist' })}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors min-h-[30px] ${
                    activeNote.mode === 'checklist'
                      ? 'bg-[#232B3E] text-slate-100 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>Checklist</span>
                </button>
              </div>
            </div>

            {/* Quick Tag Pills & Quick Templates */}
            <div className="py-1 flex items-center justify-between gap-2 overflow-x-auto text-xs border-y border-[#232B3E]/40">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                <div className="flex items-center gap-1 flex-wrap">
                  {['#trading', '#cs', '#math', '#teaching', '#focus', '#ideas'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleInsertTag(tag)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0B0F17] hover:bg-[#232B3E] text-cyan-300 border border-cyan-800/30 transition-colors shrink-0"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Snippets */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                <button
                  onClick={() => handleInsertTemplate('todo')}
                  className="px-2 py-0.5 rounded bg-[#0B0F17] text-slate-300 hover:text-emerald-400 border border-[#232B3E]"
                >
                  +Todos
                </button>
                <button
                  onClick={() => handleInsertTemplate('trading')}
                  className="px-2 py-0.5 rounded bg-[#0B0F17] text-slate-300 hover:text-emerald-400 border border-[#232B3E]"
                >
                  +Trading
                </button>
                <button
                  onClick={() => handleInsertTemplate('code')}
                  className="px-2 py-0.5 rounded bg-[#0B0F17] text-slate-300 hover:text-emerald-400 border border-[#232B3E]"
                >
                  +Code
                </button>
                {checklistStats.hasCheckboxes && (
                  <button
                    onClick={handleRemoveCheckboxes}
                    className="px-2 py-0.5 rounded bg-[#0B0F17] text-slate-400 hover:text-amber-300 border border-[#232B3E] transition-colors"
                    title="Remove checklist boxes and keep plain text"
                  >
                    -Checklist
                  </button>
                )}
              </div>
            </div>

            {/* Active Content: Textarea or Checklist Mode */}
            <div>
              {activeNote.mode === 'text' ? (
                <div className="relative">
                  <textarea
                    value={activeNote.content}
                    onChange={(e) => handleUpdateActiveNote({ content: e.target.value })}
                    placeholder="Type notes, lecture reflections, trading plans, or paste snippets... Auto-saves instantly on typing."
                    className="w-full h-48 sm:h-56 bg-[#0B0F17] border border-[#232B3E] rounded-lg p-3 text-xs sm:text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-emerald-500/80 resize-y placeholder:text-slate-600"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Checklist Actions & Status Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-0.5 text-xs">
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {checklistStats.total === 0
                          ? 'No checklist items'
                          : `${checklistStats.total} ${checklistStats.total === 1 ? 'task' : 'tasks'} (${checklistStats.completed} done)`}
                      </span>
                    </div>

                    {checklistStats.total > 0 && (
                      <div className="flex items-center gap-1.5 font-mono text-[11px] ml-auto">
                        {checklistStats.completed > 0 && (
                          <button
                            type="button"
                            onClick={handleClearCompleted}
                            className="px-2 py-1 rounded bg-[#0B0F17] hover:bg-[#232B3E] text-slate-300 hover:text-emerald-400 border border-[#232B3E] transition-colors"
                            title="Remove completed checklist tasks"
                          >
                            Clear done ({checklistStats.completed})
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleRemoveAllChecklist}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-[#0B0F17] hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-[#232B3E] hover:border-rose-500/40 transition-colors"
                          title="Remove all checklist items from this note"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span>Remove checklist</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRemoveCheckboxes}
                          className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-[#0B0F17] hover:bg-[#232B3E] text-slate-400 hover:text-cyan-300 border border-[#232B3E] transition-colors"
                          title="Convert checklist into clean text notes without checkboxes"
                        >
                          <span>Convert to text</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Interactive Checklist List */}
                  <div className="w-full h-44 sm:h-52 bg-[#0B0F17] border border-[#232B3E] rounded-lg p-3 overflow-y-auto space-y-1.5 font-mono text-xs">
                    {checklistStats.total === 0 && (
                      <div className="py-7 text-center text-slate-500 space-y-2">
                        <p className="text-xs">No checklist tasks currently in this note.</p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleInsertTemplate('todo')}
                            className="px-2.5 py-1 text-xs rounded bg-[#232B3E] hover:bg-[#2D374D] text-slate-200 font-mono transition-colors"
                          >
                            + Add Focus Checklist
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateActiveNote({ mode: 'text' })}
                            className="px-2.5 py-1 text-xs rounded bg-[#0B0F17] border border-[#232B3E] text-slate-400 hover:text-slate-200 font-mono transition-colors"
                          >
                            Switch to Raw Text
                          </button>
                        </div>
                      </div>
                    )}

                    {activeNote.content.split('\n').map((line, idx) => {
                      const isChecked = line.includes('- [x]');
                      const isUnchecked = line.includes('- [ ]');
                      const isBullet = isChecked || isUnchecked || line.startsWith('- ');

                      if (isBullet) {
                        const cleanText = line
                          .replace('- [x]', '')
                          .replace('- [ ]', '')
                          .replace('- ', '')
                          .trim();
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleChecklistItem(idx)}
                            className="flex items-start justify-between gap-2.5 py-1.5 px-2 rounded hover:bg-[#161B26] cursor-pointer group transition-colors min-h-[36px]"
                          >
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                className="mt-0.5 w-4 h-4 rounded bg-transparent border-slate-600 text-emerald-500 focus:ring-0 cursor-pointer shrink-0"
                              />
                              <span className={`flex-1 break-words ${isChecked ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                {cleanText || <span className="text-slate-600 italic">Empty item</span>}
                              </span>
                            </div>

                            {/* Remove Single Checklist Item */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteChecklistItem(idx, e)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-[#232B3E] transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 shrink-0 ml-1"
                              title="Remove item"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      }

                      if (line.startsWith('#')) {
                        return (
                          <div key={idx} className="font-bold text-amber-400 py-1 font-sans text-xs">
                            {line}
                          </div>
                        );
                      }

                      if (!line.trim()) {
                        return <div key={idx} className="h-1.5"></div>;
                      }

                      return (
                        <div key={idx} className="text-slate-400 py-0.5">
                          {line}
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Add Checklist Item Form */}
                  <form onSubmit={handleAddChecklistLine} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a new checklist item..."
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      className="flex-1 bg-[#0B0F17] border border-[#232B3E] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <button
                      type="submit"
                      disabled={!newChecklistText.trim()}
                      className="px-3 py-2 bg-[#232B3E] hover:bg-emerald-500 hover:text-[#0B0F17] disabled:opacity-50 text-slate-200 rounded-lg text-xs font-semibold font-mono transition-colors shrink-0"
                    >
                      + Add
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Widget Footer */}
      <div className="pt-3 mt-2 border-t border-[#232B3E] flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div>
          {detectedTags.length > 0 ? (
            <span className="truncate max-w-[200px] inline-block">
              Tags: <span className="text-cyan-400">{detectedTags.join(', ')}</span>
            </span>
          ) : (
            <span>{wordCount} words</span>
          )}
        </div>
        <div className="text-slate-500">
          Last updated: {activeNote ? new Date(activeNote.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </div>
      </div>
    </div>
  );
};
