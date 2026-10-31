import React, { useState, useEffect } from 'react';
import {
  Database,
  X,
  Search,
  FileText,
  Plus,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Check,
  ShieldCheck,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { OfflineDocument } from '../types';
import { offlineVault } from '../services/offlineVault';

interface OfflineVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncAll: () => void;
  syncQueueCount: number;
}

export const OfflineVaultModal: React.FC<OfflineVaultModalProps> = ({
  isOpen,
  onClose,
  onSyncAll,
  syncQueueCount,
}) => {
  const [documents, setDocuments] = useState<OfflineDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<OfflineDocument | null>(null);
  const [activeTab, setActiveTab] = useState<'docs' | 'new' | 'sync'>('docs');

  // Form states for adding custom document
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<OfflineDocument['category']>('custom-knowledge');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  const loadDocuments = async () => {
    try {
      const docs = await offlineVault.getAllDocuments();
      setDocuments(docs);
      if (docs.length > 0 && !selectedDoc) {
        setSelectedDoc(docs[0]);
      }
    } catch (e) {
      console.error('Error loading offline documents:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadDocuments();
      return;
    }
    const results = await offlineVault.searchOfflineVault(query);
    setDocuments(results.map((r) => r.doc));
    if (results.length > 0) {
      setSelectedDoc(results[0].doc);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newDoc: OfflineDocument = {
      id: `doc-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      summary: newSummary.trim() || newContent.slice(0, 120),
      content: newContent.trim(),
      tags: newTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      lastModified: Date.now(),
    };

    await offlineVault.saveDocument(newDoc);
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    setNewTags('');
    setActiveTab('docs');
    await loadDocuments();
    setSelectedDoc(newDoc);
  };

  const handleDeleteDocument = async (id: string) => {
    if (confirm('Delete this cached specification from your local offline vault?')) {
      await offlineVault.deleteDocument(id);
      await loadDocuments();
      setSelectedDoc(null);
    }
  };

  const handleExportVault = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(documents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nexis-offline-vault-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[85vh] rounded-3xl border border-neutral-800 bg-neutral-950/95 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-500/20">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
                  NEXIS OFFLINE RESILIENCE VAULT
                </h3>
                <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                  INDEXEDDB ACTIVE
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Encrypted client-side storage • Fully functional in air-gapped environments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex rounded-xl border border-neutral-800 bg-neutral-900 p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('docs')}
                className={`rounded-lg px-3 py-1 font-medium transition-colors cursor-pointer ${
                  activeTab === 'docs'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Specifications ({documents.length})
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`flex items-center gap-1 rounded-lg px-3 py-1 font-medium transition-colors cursor-pointer ${
                  activeTab === 'new'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Doc</span>
              </button>
              {syncQueueCount > 0 && (
                <button
                  onClick={() => setActiveTab('sync')}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1 font-medium transition-colors cursor-pointer ${
                    activeTab === 'sync'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-cyan-400 hover:text-cyan-200'
                  }`}
                >
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Sync ({syncQueueCount})</span>
                </button>
              )}
            </div>

            <button
              onClick={handleExportVault}
              title="Export Vault JSON"
              className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'docs' && (
          <div className="flex flex-1 overflow-hidden">
            {/* Left Documents List */}
            <div className="w-80 border-r border-neutral-800/80 bg-neutral-950/60 flex flex-col shrink-0">
              {/* Search in Vault */}
              <div className="p-3 border-b border-neutral-800/80">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search offline specs..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-1.5 pl-8 pr-3 text-xs text-neutral-200 placeholder-neutral-500 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>
              </div>

              {/* Specs List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {documents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-500">
                    No documents matching criteria.
                  </div>
                ) : (
                  documents.map((doc) => {
                    const isSelected = selectedDoc?.id === doc.id;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className={`w-full text-left rounded-xl p-3 text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-800/90 text-white border border-neutral-700 shadow-sm'
                            : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-emerald-400 uppercase">
                            {doc.category}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {doc.tags[0] || 'doc'}
                          </span>
                        </div>
                        <h4 className="font-semibold text-neutral-200 line-clamp-1 mb-1">
                          {doc.title}
                        </h4>
                        <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                          {doc.summary}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Document Preview */}
            <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
              {selectedDoc ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Doc Header */}
                  <div className="flex items-center justify-between border-b border-neutral-800/80 px-6 py-4 bg-neutral-900/30">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold uppercase">
                          {selectedDoc.category}
                        </span>
                        <div className="flex gap-1">
                          {selectedDoc.tags.map((t) => (
                            <span key={t} className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400 font-mono">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
                        {selectedDoc.title}
                      </h2>
                    </div>

                    <button
                      onClick={() => handleDeleteDocument(selectedDoc.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-800 text-neutral-500 hover:border-rose-500/50 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete from local vault"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Doc Content */}
                  <div className="flex-1 overflow-y-auto p-6 prose prose-invert max-w-none text-xs text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed selection:bg-emerald-500/30">
                    {selectedDoc.content}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-neutral-500">
                  Select a document from the left to inspect architectural specification.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Create Custom Document */}
        {activeTab === 'new' && (
          <form onSubmit={handleCreateDocument} className="flex-1 overflow-y-auto p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Space_Grotesk']">
              Add Architectural Blueprint to Local Offline Vault
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Multi-Tenant Sharding Strategy"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="architecture">Architecture</option>
                  <option value="distributed-systems">Distributed Systems</option>
                  <option value="ai-algorithms">AI & Algorithmic Mechanics</option>
                  <option value="security">Security & Zero Trust</option>
                  <option value="custom-knowledge">Custom Enterprise Knowledge</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Summary / Abstract
              </label>
              <input
                type="text"
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="High-level thesis or bottom line"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="sharding, database, scale, postgres"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Full Specification Content (Markdown supported)
              </label>
              <textarea
                required
                rows={10}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="# Specification Title&#10;## 1. Executive Summary&#10;..."
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-xs font-mono text-neutral-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('docs')}
                className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
              >
                Save to Encrypted Vault
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Sync Queue */}
        {activeTab === 'sync' && (
          <div className="flex-1 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Offline Sync Queue
                </h3>
                <p className="text-xs text-neutral-400">
                  {syncQueueCount} queries captured during offline sessions awaiting Gemini 4 Cloud reasoning.
                </p>
              </div>

              <button
                onClick={() => {
                  onSyncAll();
                  setActiveTab('docs');
                }}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 shadow-md shadow-cyan-600/20"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Execute Cloud Deep Reasoning Sync</span>
              </button>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-xs text-neutral-300 space-y-2">
              <div className="flex items-center gap-2 font-mono text-cyan-400">
                <ShieldCheck className="h-4 w-4" />
                <span>IndexedDB Sync Buffer Ready</span>
              </div>
              <p className="text-neutral-400">
                When you click sync, all queued prompts are submitted with Gemini 4 Argon High-Thinking level to obtain comprehensive cloud breakdowns, source grounding, and code verification.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
