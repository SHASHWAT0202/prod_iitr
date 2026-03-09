'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';

interface LeadDossierProps {
  lead: any;
  onAction?: (action: string, note?: string) => void;
}

/* ── helper configs ─────────────────────────────────────────── */

const getStatusConfig = (status: string) => {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    new:         { label: 'New Lead',    cls: 'badge-new',       dot: 'bg-blue-500' },
    in_progress: { label: 'In Progress', cls: 'badge-progress',  dot: 'bg-amber-500' },
    converted:   { label: 'Converted',   cls: 'badge-converted', dot: 'bg-emerald-500' },
    rejected:    { label: 'Rejected',    cls: 'badge-rejected',  dot: 'bg-red-500' },
  };
  return map[status] || { label: status, cls: 'badge-new', dot: 'bg-slate-400' };
};

const getUrgencyConfig = (u: string) => {
  const map: Record<string, { cls: string; icon: string }> = {
    high:   { cls: 'badge-high',   icon: '🔥' },
    medium: { cls: 'badge-medium', icon: '⚡' },
    low:    { cls: 'badge-low',    icon: '✓' },
  };
  return map[u] || { cls: 'badge-medium', icon: '—' };
};

const getScoreColor = (s: number | undefined) => {
  if (!s)       return { text: 'text-slate-400', ring: 'border-slate-300', bg: 'from-slate-400 to-slate-500' };
  if (s >= 80)  return { text: 'text-emerald-500', ring: 'border-emerald-400', bg: 'from-emerald-400 to-teal-500' };
  if (s >= 60)  return { text: 'text-blue-500', ring: 'border-blue-400', bg: 'from-blue-400 to-indigo-500' };
  if (s >= 40)  return { text: 'text-amber-500', ring: 'border-amber-400', bg: 'from-amber-400 to-orange-500' };
  return { text: 'text-red-500', ring: 'border-red-400', bg: 'from-red-400 to-rose-500' };
};

const scoreDimensions = [
  { key: 'intentStrength',   label: 'Intent Strength', max: 30, color: 'from-blue-500 to-indigo-500',   desc: 'How strong is the buying signal' },
  { key: 'freshness',        label: 'Freshness',       max: 25, color: 'from-emerald-500 to-teal-500',  desc: 'How recent is the intelligence' },
  { key: 'companySizeProxy', label: 'Company Scale',   max: 20, color: 'from-purple-500 to-violet-500', desc: 'Estimated business size fit' },
  { key: 'sourceTrust',      label: 'Source Trust',     max: 15, color: 'from-amber-500 to-orange-500',  desc: 'Reliability of the source' },
  { key: 'geoRelevance',     label: 'Geo Relevance',   max: 10, color: 'from-rose-500 to-pink-500',     desc: 'Location-based relevance' },
];

const formatDate = (ts: number | undefined) => {
  if (!ts) return 'Unknown date';
  const days = Math.floor((Date.now() - ts) / 864e5);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days} days ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const formatFullDate = (ts: number | Date | undefined) => {
  if (!ts) return 'N/A';
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/* ── component ──────────────────────────────────────────────── */

export default function LeadDossier({ lead, onAction }: LeadDossierProps) {
  const [note, setNote] = useState(lead.note || '');
  const [loading, setLoading] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'actions'>('overview');

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      if (onAction) {
        onAction(action, note);
      } else {
        await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: lead.id, action, note }),
        });
        window.location.href = '/';
      }
    } catch (e) {
      console.error('Action failed:', e);
    }
    setLoading(null);
  };

  const handleEmailTeam = async () => {
    setEmailSending(true);
    try {
      const res = await fetch('/api/email-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      } else {
        alert('Failed to send email: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Email send error:', e);
      alert('Failed to send email');
    }
    setEmailSending(false);
  };

  /* ── PDF GENERATOR ────────────────────────────────────────── */

  const handleDownloadDocument = () => {
    setDownloading(true);

    const products = lead.inference?.inferred_products || [];
    const reasonCodes = lead.inference?.reason_codes || [];
    const scoreBreakdown = lead.scoreBreakdown || {};

    const doc = new jsPDF();
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const LM = 18;
    const CW = W - 2 * LM;
    let y = 0;
    let pageNum = 1;

    const C = {
      navy:    [0, 51, 102] as [number, number, number],
      blue:    [29, 78, 216] as [number, number, number],
      accent:  [14, 165, 233] as [number, number, number],
      green:   [16, 185, 129] as [number, number, number],
      amber:   [245, 158, 11] as [number, number, number],
      red:     [239, 68, 68] as [number, number, number],
      dark:    [30, 41, 59] as [number, number, number],
      grey:    [100, 116, 139] as [number, number, number],
      light:   [241, 245, 249] as [number, number, number],
      white:   [255, 255, 255] as [number, number, number],
      divider: [226, 232, 240] as [number, number, number],
    };

    const txt = (t: string, x: number, yy: number, size = 10, style = 'normal', col = C.dark) => {
      doc.setFontSize(size); doc.setFont('helvetica', style); doc.setTextColor(...col); doc.text(t, x, yy);
    };

    const ensureSpace = (need: number) => {
      if (y + need > H - 25) { addFooter(); doc.addPage(); pageNum++; y = 18; }
    };

    const addFooter = () => {
      doc.setFillColor(...C.light); doc.rect(0, H - 14, W, 14, 'F');
      doc.setDrawColor(...C.divider); doc.setLineWidth(0.3); doc.line(0, H - 14, W, H - 14);
      txt('CONFIDENTIAL — HPCL Internal Use Only', LM, H - 6, 7, 'normal', C.grey);
      txt(`Page ${pageNum}`, W - LM - 12, H - 6, 7, 'normal', C.grey);
      txt(`ID: ${lead.id?.slice(0, 12) || '—'}`, W / 2 - 15, H - 6, 7, 'normal', C.grey);
    };

    const sectionTitle = (title: string) => {
      ensureSpace(18);
      y += 4;
      doc.setFillColor(...C.navy); doc.roundedRect(LM, y, CW, 9, 1.5, 1.5, 'F');
      txt(title, LM + 5, y + 6.2, 10, 'bold', C.white);
      y += 13;
    };

    // ═══════════════  PAGE 1 — HEADER  ═══════════════

    doc.setFillColor(...C.navy); doc.rect(0, 0, W, 40, 'F');
    doc.setFillColor(...C.accent); doc.rect(0, 40, W, 2.5, 'F');
    txt('HPCL Lead Intelligence', LM, 16, 22, 'bold', C.white);
    txt('B2B Direct Sales — Executive Dossier', LM, 24, 10, 'normal', [180, 210, 255]);
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    txt(dateStr, W - LM - doc.getTextWidth(dateStr) * 0.7, 36, 8, 'normal', [160, 190, 240]);
    y = 50;

    // ═══════════════  COMPANY HERO CARD  ═══════════════

    doc.setFillColor(...C.white); doc.setDrawColor(...C.divider); doc.setLineWidth(0.4);
    doc.roundedRect(LM, y, CW, 44, 3, 3, 'FD');
    doc.setFillColor(...C.blue); doc.roundedRect(LM, y, 4, 44, 3, 0, 'F'); doc.rect(LM + 2, y, 2, 44, 'F');

    const cx = LM + 16; const cy2 = y + 14;
    doc.setFillColor(...C.blue); doc.circle(cx, cy2, 8, 'F');
    txt(lead.company_name?.charAt(0)?.toUpperCase() || 'C', cx - 3.5, cy2 + 3.5, 14, 'bold', C.white);

    txt(lead.company_name || 'Unknown Company', LM + 28, y + 12, 16, 'bold', C.navy);
    txt(lead.inference?.industry || lead.industry || 'Unknown Industry', LM + 28, y + 19, 9, 'normal', C.grey);
    txt(`${lead.geo || 'India'} Region  •  ${(lead.source_type || 'news').toUpperCase()} signal  •  ${formatDate(lead.timestamp)}`, LM + 28, y + 26, 8, 'normal', C.grey);

    const statusLabel = (lead.status || 'new').replace('_', ' ').toUpperCase();
    const statusCol = lead.status === 'converted' ? C.green : lead.status === 'rejected' ? C.red : lead.status === 'in_progress' ? C.amber : C.blue;
    doc.setFontSize(7);
    doc.setFillColor(...statusCol); doc.roundedRect(LM + 28, y + 30, doc.getTextWidth(statusLabel) + 8, 7, 2, 2, 'F');
    txt(statusLabel, LM + 32, y + 35, 7, 'bold', C.white);

    const sScore = lead.score || 0;
    const sCol = sScore >= 80 ? C.green : sScore >= 60 ? C.blue : sScore >= 40 ? C.amber : C.red;
    const scx = W - LM - 20; const scy = y + 16;
    doc.setDrawColor(...sCol); doc.setLineWidth(2.5); doc.circle(scx, scy, 13, 'S');
    doc.setLineWidth(0.4);
    txt(String(sScore), scx - (sScore >= 10 ? 5 : 3), scy + 3, 16, 'bold', sCol);
    txt('/100', scx - 4, scy + 9, 7, 'normal', C.grey);

    const urg = (lead.inference?.urgency_level || 'medium').toUpperCase();
    const urgCol = urg === 'HIGH' ? C.red : urg === 'LOW' ? C.green : C.amber;
    const urgLbl = urg + ' PRIORITY';
    doc.setFillColor(...urgCol); doc.roundedRect(scx - 17, y + 33, 35, 7, 2, 2, 'F');
    txt(urgLbl, scx - 14, y + 38, 7, 'bold', C.white);

    y += 52;

    // ═══════════════  KPI ROW  ═══════════════

    const kpiData = [
      { label: 'Trust Score', value: `${Math.min(Math.round(lead.trust || 50), 100)}%` },
      { label: 'AI Confidence', value: `${Math.round((lead.inference?.confidence_score || 0) * 100)}%` },
      { label: 'Products Found', value: String(products.length) },
      { label: 'Source', value: (lead.source_type || 'news').toUpperCase() },
    ];
    const kpiW = CW / 4;
    doc.setFillColor(248, 250, 252); doc.roundedRect(LM, y, CW, 18, 2, 2, 'F');
    kpiData.forEach((k, i) => {
      const kx = LM + i * kpiW + kpiW / 2;
      doc.setFontSize(13);
      txt(k.value, kx - doc.getTextWidth(k.value) / 2, y + 8, 13, 'bold', C.navy);
      doc.setFontSize(7);
      txt(k.label, kx - doc.getTextWidth(k.label) / 2, y + 14, 7, 'normal', C.grey);
      if (i < 3) { doc.setDrawColor(...C.divider); doc.setLineWidth(0.3); doc.line(LM + (i + 1) * kpiW, y + 3, LM + (i + 1) * kpiW, y + 15); }
    });
    y += 24;

    // ═══════════════  EXECUTIVE SUMMARY  ═══════════════

    if (lead.inference?.suggested_next_action || lead.source_text) {
      sectionTitle('EXECUTIVE SUMMARY');
      const summaryText = `This lead was captured from ${lead.source || 'an intelligence source'} (${(lead.source_type || 'news').toUpperCase()}) on ${formatFullDate(lead.timestamp)}. `
        + `The AI system has identified ${products.length} potential product ${products.length === 1 ? 'match' : 'matches'} with a confidence level of ${Math.round((lead.inference?.confidence_score || 0) * 100)}%. `
        + `The overall lead score is ${sScore}/100, classified as ${urg} priority.`;
      const sumLines = doc.splitTextToSize(summaryText, CW - 10);
      sumLines.forEach((line: string) => { ensureSpace(5); txt(line, LM + 5, y, 9, 'normal', C.dark); y += 4.5; });
      y += 4;
    }

    // ═══════════════  COMPANY DOSSIER TABLE  ═══════════════

    sectionTitle('COMPANY DOSSIER');
    const tableData = [
      ['Company Name', lead.company_name || 'Unknown'],
      ['Industry', lead.inference?.industry || lead.industry || 'Unknown'],
      ['Region / Location', lead.geo || 'India'],
      ['Signal Source', lead.source || 'Unknown'],
      ['Signal Type', (lead.source_type || 'news').toUpperCase()],
      ['Captured Date', formatFullDate(lead.timestamp)],
      ['AI Confidence', `${Math.round((lead.inference?.confidence_score || 0) * 100)}%`],
      ['Trust Score', `${Math.min(Math.round(lead.trust || 50), 100)}%`],
      ['Lead Score', `${sScore} / 100`],
      ['Assigned To', lead.assignedTo || 'Unassigned'],
    ];
    tableData.forEach((row, i) => {
      ensureSpace(7);
      const bg = i % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
      doc.setFillColor(bg[0], bg[1], bg[2]); doc.rect(LM, y - 3.5, CW, 7, 'F');
      txt(row[0], LM + 4, y, 8.5, 'bold', C.grey);
      txt(row[1], LM + CW * 0.4, y, 8.5, 'normal', C.dark);
      y += 7;
    });
    y += 4;

    // ═══════════════  AI ANALYSIS  ═══════════════

    if (lead.inference) {
      sectionTitle('AI ANALYSIS');
      doc.setFillColor(30, 41, 59); doc.roundedRect(LM, y, CW, 10, 2, 2, 'F');
      txt('AI-Generated Intelligence Analysis', LM + 5, y + 6.5, 9, 'bold', C.white);
      y += 14;

      if (reasonCodes.length > 0) {
        txt('Key Reason Codes:', LM + 4, y, 9, 'bold', C.dark); y += 6;
        reasonCodes.forEach((rc: string, i: number) => {
          ensureSpace(7);
          const num = String(i + 1).padStart(2, '0');
          doc.setFillColor(...C.blue); doc.roundedRect(LM + 4, y - 3, 8, 5.5, 1, 1, 'F');
          txt(num, LM + 5.5, y, 7, 'bold', C.white);
          const rcLines = doc.splitTextToSize(rc, CW - 22);
          rcLines.forEach((ln: string, li: number) => { txt(ln, LM + 15, y + li * 4.2, 8.5, 'normal', C.dark); });
          y += rcLines.length * 4.2 + 3;
        });
        y += 2;
      }
    }

    // ═══════════════  RECOMMENDED PRODUCTS  ═══════════════

    sectionTitle('RECOMMENDED PRODUCTS');
    if (products.length > 0) {
      products.forEach((product: string, i: number) => {
        ensureSpace(22);
        doc.setFillColor(248, 250, 252); doc.setDrawColor(...C.divider); doc.setLineWidth(0.3);
        doc.roundedRect(LM, y, CW, 16, 2, 2, 'FD');
        const pCol = i === 0 ? C.green : i === 1 ? C.blue : C.accent;
        doc.setFillColor(...pCol); doc.roundedRect(LM, y, 3.5, 16, 2, 0, 'F'); doc.rect(LM + 1.5, y, 2, 16, 'F');
        doc.setFillColor(...pCol); doc.circle(LM + 10, y + 8, 4, 'F');
        txt(String(i + 1), LM + 8.7, y + 9.5, 8, 'bold', C.white);
        txt(product, LM + 18, y + 7, 10, 'bold', C.navy);
        const reason = reasonCodes[i] || 'Matches signal requirements';
        const rLines = doc.splitTextToSize(reason, CW - 24);
        txt(rLines[0], LM + 18, y + 12.5, 8, 'normal', C.grey);
        if (i === 0) {
          const recX = W - LM - 28;
          doc.setFillColor(...C.green); doc.roundedRect(recX, y + 3, 24, 5.5, 1.5, 1.5, 'F');
          txt('TOP PICK', recX + 3, y + 7, 6.5, 'bold', C.white);
        }
        y += 20;
      });
    } else {
      txt('No product recommendations available.', LM + 5, y, 9, 'normal', C.grey); y += 8;
    }

    // ═══════════════  SCORE BREAKDOWN  ═══════════════

    sectionTitle('SCORE BREAKDOWN');
    const dims = [
      { name: 'Intent Strength', val: scoreBreakdown.intentStrength || 0, max: 30 },
      { name: 'Freshness',       val: scoreBreakdown.freshness || 0,       max: 25 },
      { name: 'Company Scale',   val: scoreBreakdown.companySizeProxy || 0, max: 20 },
      { name: 'Source Trust',    val: scoreBreakdown.sourceTrust || 0,     max: 15 },
      { name: 'Geo Relevance',  val: scoreBreakdown.geoRelevance || 0,    max: 10 },
    ];
    dims.forEach((d) => {
      ensureSpace(10);
      txt(d.name, LM + 4, y + 3, 8.5, 'normal', C.dark);
      const barX = LM + 45; const barW = CW - 75; const barH = 5;
      const pct = d.max > 0 ? d.val / d.max : 0;
      doc.setFillColor(229, 231, 235); doc.roundedRect(barX, y, barW, barH, 1.5, 1.5, 'F');
      const fillCol = pct >= 0.7 ? C.green : pct >= 0.4 ? C.blue : C.amber;
      doc.setFillColor(...fillCol); doc.roundedRect(barX, y, barW * pct, barH, 1.5, 1.5, 'F');
      txt(`${d.val}/${d.max}`, barX + barW + 4, y + 3.5, 8, 'bold', C.dark);
      y += 9;
    });
    y += 2;
    doc.setDrawColor(...C.divider); doc.setLineWidth(0.3); doc.line(LM, y, LM + CW, y); y += 5;
    txt('TOTAL SCORE', LM + 4, y, 9, 'bold', C.navy);
    txt(`${sScore} / 100`, W - LM - 20, y, 12, 'bold', sCol);
    y += 8;

    // ═══════════════  SUGGESTED NEXT ACTION  ═══════════════

    if (lead.inference?.suggested_next_action) {
      sectionTitle('SUGGESTED NEXT ACTION');
      ensureSpace(22);
      doc.setFillColor(255, 251, 235); doc.setDrawColor(...C.amber); doc.setLineWidth(0.8);
      doc.roundedRect(LM, y, CW, 16, 2, 2, 'FD');
      doc.setFillColor(...C.amber); doc.roundedRect(LM, y, 4, 16, 2, 0, 'F'); doc.rect(LM + 2, y, 2, 16, 'F');
      const actLines = doc.splitTextToSize(lead.inference.suggested_next_action, CW - 22);
      actLines.forEach((ln: string, i: number) => { txt(ln, LM + 16, y + 6 + i * 4.5, 9, 'bold', [146, 64, 14]); });
      y += 20;
    }

    // ═══════════════  SOURCE INTELLIGENCE  ═══════════════

    if (lead.source_text) {
      sectionTitle('SOURCE INTELLIGENCE');
      ensureSpace(20);
      const srcLines = doc.splitTextToSize(lead.source_text, CW - 14);
      const blockH = srcLines.length * 4.2 + 6;
      ensureSpace(blockH);
      doc.setFillColor(248, 250, 252); doc.roundedRect(LM, y, CW, blockH, 2, 2, 'F');
      doc.setFillColor(...C.accent); doc.roundedRect(LM, y, 3, blockH, 1, 0, 'F');
      srcLines.forEach((ln: string, i: number) => { txt(ln, LM + 8, y + 5 + i * 4.2, 8.5, 'italic', C.dark); });
      y += blockH + 4;
      txt(`— ${lead.source || 'Source'}  •  ${formatFullDate(lead.timestamp)}`, LM + 8, y, 7.5, 'normal', C.grey);
      y += 8;
    }

    // ═══════════════  NOTES  ═══════════════

    if (lead.note) {
      sectionTitle('INTERNAL NOTES');
      const nLines = doc.splitTextToSize(lead.note, CW - 10);
      nLines.forEach((ln: string) => { ensureSpace(5); txt(ln, LM + 5, y, 9, 'normal', C.dark); y += 4.5; });
      y += 4;
    }

    addFooter();
    doc.save(`HPCL_Lead_${lead.company_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`);
    setDownloading(false);
  };

  /* ── DERIVED VALUES ───────────────────────────────────────── */

  const urgency = lead.inference?.urgency_level || 'medium';
  const confidence = lead.inference?.confidence_score || 0;
  const statusCfg = getStatusConfig(lead.status);
  const urgencyCfg = getUrgencyConfig(urgency);
  const scoreCfg = getScoreColor(lead.score);

  const tabs = [
    { id: 'overview' as const, label: 'Overview',    icon: '📊' },
    { id: 'ai' as const,       label: 'AI Analysis', icon: '🤖' },
    { id: 'actions' as const,  label: 'Actions',     icon: '⚡' },
  ];

  /* ═══════════════════════════  RENDER  ═══════════════════════════ */

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* ── HERO CARD ──────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-professional border border-slate-200 dark:border-slate-700"
      >
        {/* gradient top bar */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        <div className="p-6 pb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
            {/* left: avatar + info */}
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-lg">
                {lead.company_name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white truncate">{lead.company_name}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{lead.inference?.industry || lead.industry || 'Unknown Industry'}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className={`badge ${statusCfg.cls} flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                  <span className={`badge ${urgencyCfg.cls}`}>
                    {urgencyCfg.icon} {urgency.charAt(0).toUpperCase() + urgency.slice(1)} Priority
                  </span>
                  <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    📍 {lead.geo || 'India'}
                  </span>
                </div>
              </div>
            </div>

            {/* right: score ring */}
            <div className="text-center shrink-0">
              <div className={`w-[88px] h-[88px] rounded-full border-[5px] ${scoreCfg.ring} flex flex-col items-center justify-center bg-white dark:bg-slate-800 shadow-md`}>
                <span className={`text-3xl font-black ${scoreCfg.text}`}>{lead.score ?? '—'}</span>
                <span className="text-[10px] text-slate-400 -mt-0.5">/100</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 font-medium">Lead Score</p>
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-700/60">
            {[
              { label: 'Trust', value: `${Math.min(Math.round(lead.trust || 50), 100)}%`, color: 'text-emerald-600' },
              { label: 'AI Confidence', value: `${Math.round(confidence * 100)}%`, color: 'text-purple-600' },
              { label: 'Products', value: String(lead.inference?.inferred_products?.length || 0), color: 'text-blue-600' },
              { label: 'Captured', value: formatDate(lead.timestamp), color: 'text-slate-600' },
            ].map((kpi) => (
              <div key={kpi.label} className="text-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/40">
                <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* quick-action bar */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleEmailTeam} disabled={emailSending}
            className={`flex-1 sm:flex-none py-2.5 px-5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm ${
              emailSent ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}>
            {emailSending ? <Spinner /> : emailSent ? '✓ Sent!' : '✉ Email Team'}
          </motion.button>

          <motion.button whileTap={{ scale: 0.95 }} onClick={handleDownloadDocument} disabled={downloading}
            className="flex-1 sm:flex-none py-2.5 px-5 text-sm font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
            {downloading ? <Spinner /> : '📄 Download Report'}
          </motion.button>
        </div>
      </motion.section>

      {/* ── TAB NAV ─────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === t.id
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">

            {/* Source Signal */}
            <section className="card overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border-b border-amber-100 dark:border-amber-800/40">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  📡 Source Intelligence
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-800/30 text-amber-700 dark:text-amber-300 font-semibold">
                    {(lead.source_type || 'news').toUpperCase()}
                  </span>
                  <span>{lead.source}</span>
                  <span className="text-slate-300">•</span>
                  <span>{formatDate(lead.timestamp)}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[15px]">{lead.source_text}</p>
                <div className="mt-4 flex items-center gap-3 text-sm">
                  <span className="text-slate-500 text-xs font-medium">Trust</span>
                  <div className="flex-1 max-w-40 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(lead.trust || 50, 100)}%` }} transition={{ duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" />
                  </div>
                  <span className="font-bold text-emerald-600 text-sm">{Math.min(Math.round(lead.trust || 50), 100)}%</span>
                </div>
              </div>
            </section>

            {/* Score Breakdown */}
            {lead.scoreBreakdown && (
              <section className="card overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 border-b border-blue-100 dark:border-blue-800/40">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                    📊 Score Breakdown
                  </h3>
                </div>
                <div className="p-6 space-y-5">
                  {scoreDimensions.map((dim, i) => {
                    const val = lead.scoreBreakdown[dim.key] || 0;
                    const pct = dim.max > 0 ? (val / dim.max) * 100 : 0;
                    return (
                      <div key={dim.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{dim.label}</span>
                            <span className="text-[11px] text-slate-400 ml-2">{dim.desc}</span>
                          </div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {val}<span className="text-slate-400 font-normal">/{dim.max}</span>
                          </span>
                        </div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, delay: 0.15 * i }}
                            className={`h-full bg-gradient-to-r ${dim.color} rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Total Score</span>
                    <span className={`text-3xl font-black ${scoreCfg.text}`}>
                      {lead.score || 0}<span className="text-base font-normal text-slate-400">/100</span>
                    </span>
                  </div>

                  {lead.scoreExplanation && (
                    <p className="text-sm text-slate-500 italic">
                      {Array.isArray(lead.scoreExplanation) ? lead.scoreExplanation.join(' ') : lead.scoreExplanation}
                    </p>
                  )}

                  {lead.mlAdjusted && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                      ⚡ Score adjusted by ML learning from user feedback
                    </div>
                  )}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {activeTab === 'ai' && (
          <motion.div key="ai" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">

            {/* AI Products */}
            <section className="card overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/10 border-b border-purple-100 dark:border-purple-800/40">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  🧠 Product Recommendations
                </h3>
              </div>
              <div className="p-6">
                {lead.inference?.inferred_products?.length > 0 ? (
                  <div className="space-y-3">
                    {lead.inference.inferred_products.map((product: string, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                        className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 hover:shadow-sm transition-shadow">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                          i === 0 ? 'from-emerald-500 to-teal-600' : i === 1 ? 'from-blue-500 to-indigo-600' : 'from-purple-500 to-violet-600'
                        } flex items-center justify-center text-white font-bold shrink-0 shadow`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-white">{product}</h4>
                            {i === 0 && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                TOP PICK
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {lead.inference.reason_codes?.[i] || 'Matches signal requirements'}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-4xl mb-3">🔍</p>
                    <p>No product recommendations yet. Run AI inference to generate.</p>
                  </div>
                )}

                {/* Confidence bar */}
                {lead.inference && (
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">AI Confidence</span>
                      <span className="text-xl font-black text-purple-600">{Math.round(confidence * 100)}%</span>
                    </div>
                    <div className="h-3 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${confidence * 100}%` }} transition={{ duration: 1 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* AI Reasoning */}
            {lead.inference?.reason_codes?.length > 0 && (
              <section className="card overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                    🔬 AI Reasoning
                  </h3>
                </div>
                <div className="bg-slate-900 p-6 space-y-3">
                  {lead.inference.reason_codes.map((code: string, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 * i }}
                      className="flex items-start gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <p className="text-slate-300 text-sm leading-relaxed">{code}</p>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Suggested Action */}
            {lead.inference?.suggested_next_action && (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-lg">
                <div className="relative">
                  <h3 className="font-bold flex items-center gap-2 text-lg mb-2">⚡ Suggested Next Action</h3>
                  <p className="text-blue-100 leading-relaxed text-[15px]">{lead.inference.suggested_next_action}</p>
                </div>
              </motion.section>
            )}
          </motion.div>
        )}

        {activeTab === 'actions' && (
          <motion.div key="actions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">

            <section className="card overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/80 border-b border-slate-100 dark:border-slate-700/50">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">✏️ Take Action</h3>
              </div>
              <div className="p-6">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add notes about this lead (optional)..."
                  rows={3}
                  className="w-full p-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                />

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {lead.status !== 'converted' && (
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleAction('converted')} disabled={loading !== null}
                      className="py-3 px-5 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                      {loading === 'converted' ? <Spinner /> : '✓ Mark Converted'}
                    </motion.button>
                  )}
                  {lead.status === 'new' && (
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleAction('accept')} disabled={loading !== null}
                      className="py-3 px-5 text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                      {loading === 'accept' ? <Spinner /> : '→ Accept Lead'}
                    </motion.button>
                  )}
                  {lead.status !== 'rejected' && (
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleAction('reject')} disabled={loading !== null}
                      className="py-3 px-5 text-sm font-bold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                      {loading === 'reject' ? <Spinner /> : '✕ Reject Lead'}
                    </motion.button>
                  )}
                </div>

                {lead.note && (
                  <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Previous Note</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{lead.note}</p>
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── tiny spinner ────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
