'use client';

import React, { useState, useEffect } from 'react';
import { ScientificPaper } from '@/app/api/science/literature/route';
import { 
  BookOpen, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  GraduationCap,
  FlaskConical,
  RefreshCw
} from 'lucide-react';

export default function ScienceLiteratureView() {
  const [query, setQuery] = useState('vagus nerve acoustic resonance');
  const [papers, setPapers] = useState<ScientificPaper[]>([]);
  const [source, setSource] = useState<string>('ResOS Scientific Knowledge Base');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLiterature = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/science/literature?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.papers) {
        setPapers(data.papers);
        setSource(data.source || 'Biomedical Literature');
      }
    } catch (err) {
      console.error('Literature fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        const res = await fetch(`/api/science/literature?q=${encodeURIComponent('acoustic frequency resonance HRV')}`);
        const data = await res.json();
        if (!ignore && data.papers) {
          setPapers(data.papers);
          setSource(data.source || 'Biomedical Literature');
        }
      } catch (err) {
        console.error('Literature fetch error:', err);
      }
    }
    loadInitial();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) fetchLiterature(query);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-950 border border-blue-800 text-blue-400">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-100">
                Bioscience & Clinical Literature Engine
              </h3>
              <span className="text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full">
                PubMed / E-utilities API
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Evidence-based research on acoustic mechanotransduction, vagal tone, and cellular bio-electromagnetics.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          Source: {source}
        </span>
      </div>

      {/* Search Input & Quick Topics */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search PubMed citations (e.g. 528 Hz, vagus nerve stimulation, heart rate variability, biofield)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
        >
          {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span>Query</span>
        </button>
      </form>

      {/* Suggested Literature Topic Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
        {[
          '528 Hz Autonomic Nervous System',
          'Vagus Nerve Acoustic Stimulation',
          'Heart Rate Variability Coherence',
          'Cellular Biofield Electromagnetic',
          'Vibroacoustic 136.1 Hz Somatic',
          'Nogier Auriculotherapy Frequencies',
        ].map((topic) => (
          <button
            key={topic}
            onClick={() => {
              setQuery(topic);
              fetchLiterature(topic);
            }}
            className="whitespace-nowrap px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Papers List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {papers.map((paper) => (
          <div
            key={paper.id}
            className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 hover:border-slate-700 transition-all flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded mr-2">
                  {paper.relevanceTag}
                </span>
                <span className="text-xs font-bold text-slate-100 hover:text-cyan-300 transition-colors">
                  {paper.title}
                </span>
              </div>
              <a
                href={paper.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
                title="View Paper on PubMed"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">{paper.abstract}</p>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
              <div>
                <span>{paper.authors}</span> — <span className="text-slate-300">{paper.journal} ({paper.year})</span>
              </div>
              {paper.pmid && (
                <div className="text-cyan-400/90">
                  PMID: {paper.pmid}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
