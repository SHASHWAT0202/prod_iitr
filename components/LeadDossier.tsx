'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';

interface LeadDossierProps {
  lead: any;
  onAction?: (action: string, note?: string) => void;
}

// Helper functions
const getStatusClass = (status: string) => {
  switch (status) {
    case 'new': return 'badge-primary';
    case 'in_progress': return 'badge-warning';
    case 'converted': return 'badge-success';
    case 'rejected': return 'badge-danger';
    default: return 'badge-secondary';
  }
};

const getUrgencyClass = (urgency: string) => {
  switch (urgency) {
    case 'high': return 'badge-danger';
    case 'medium': return 'badge-warning';
    case 'low': return 'badge-success';
    default: return 'badge-secondary';
  }
};

const getScoreColor = (score: number | undefined) => {
  if (!score) return 'text-slate-400';
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-blue-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-500';
};

const formatDate = (timestamp: number | undefined) => {
  if (!timestamp) return 'Unknown date';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const formatFullDate = (timestamp: number | Date | undefined) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function LeadDossier({ lead, onAction }: LeadDossierProps) {
  const [note, setNote] = useState(lead.note || '');
  const [loading, setLoading] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

  const handleDownloadDocument = () => {
    setDownloading(true);
    
    const products = lead.inference?.inferred_products || [];
    const reasonCodes = lead.inference?.reason_codes || [];
    const scoreBreakdown = lead.scoreBreakdown || {};
    
    // Create PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Helper functions
    const addText = (text: string, x: number, y: number, options?: { fontSize?: number; fontStyle?: string; color?: number[] }) => {
      doc.setFontSize(options?.fontSize || 10);
      doc.setFont('helvetica', options?.fontStyle || 'normal');
      if (options?.color) {
        doc.setTextColor(options.color[0], options.color[1], options.color[2]);
      } else {
        doc.setTextColor(51, 51, 51);
      }
      doc.text(text, x, y);
    };

    const addSection = (title: string, y: number) => {
      doc.setFillColor(0, 82, 147); // HPCL Blue
      doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 4, y + 5.5);
      doc.setTextColor(51, 51, 51);
      return y + 12;
    };

    // Header - HPCL Branding
    doc.setFillColor(0, 82, 147);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('HPCL Lead Intelligence', margin, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('B2B Direct Sales - Executive Report', margin, 26);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, pageWidth - margin - 50, 26);
    
    yPos = 45;

    // Company Summary Box
    doc.setFillColor(245, 248, 255);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F');
    doc.setDrawColor(0, 82, 147);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'S');
    
    addText(lead.company_name || 'Unknown Company', margin + 5, yPos + 10, { fontSize: 16, fontStyle: 'bold', color: [0, 82, 147] });
    addText(`Industry: ${lead.inference?.industry || lead.industry || 'Unknown'}`, margin + 5, yPos + 18, { fontSize: 9 });
    addText(`Location: ${lead.geo || 'India'}`, margin + 5, yPos + 24, { fontSize: 9 });
    addText(`Status: ${(lead.status || 'new').replace('_', ' ').toUpperCase()}`, margin + 5, yPos + 30, { fontSize: 9 });

    // Score Circle (simulated)
    const scoreX = pageWidth - margin - 25;
    const scoreY = yPos + 17;
    const score = lead.score || 0;
    const scoreColor = score >= 80 ? [16, 185, 129] : score >= 60 ? [59, 130, 246] : score >= 40 ? [245, 158, 11] : [239, 68, 68];
    doc.setDrawColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.setLineWidth(2);
    doc.circle(scoreX, scoreY, 12, 'S');
    addText(String(score), scoreX - 5, scoreY + 3, { fontSize: 14, fontStyle: 'bold', color: scoreColor });
    addText('/100', scoreX - 3, scoreY + 8, { fontSize: 7 });
    
    // Urgency Badge
    const urgency = (lead.inference?.urgency_level || 'medium').toUpperCase();
    const urgencyColor = urgency === 'HIGH' ? [239, 68, 68] : urgency === 'MEDIUM' ? [245, 158, 11] : [16, 185, 129];
    doc.setFillColor(urgencyColor[0], urgencyColor[1], urgencyColor[2]);
    doc.roundedRect(pageWidth - margin - 45, yPos + 25, 35, 7, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(urgency + ' PRIORITY', pageWidth - margin - 43, yPos + 30);
    
    yPos += 45;

    // Why This Lead Section
    yPos = addSection('WHY THIS LEAD', yPos);
    const whyData = [
      ['Source', lead.source || 'Unknown'],
      ['Signal Type', lead.source_type || 'Unknown'],
      ['Captured', formatFullDate(lead.timestamp)],
      ['Trust Score', `${Math.min(lead.trust || 50, 100)}%`],
      ['AI Confidence', `${Math.round((lead.inference?.confidence_score || 0) * 100)}%`]
    ];
    whyData.forEach((row, i) => {
      addText(row[0] + ':', margin + 4, yPos + (i * 5), { fontSize: 9, fontStyle: 'bold' });
      addText(row[1], margin + 40, yPos + (i * 5), { fontSize: 9 });
    });
    yPos += 30;

    // Recommended Products Section
    yPos = addSection('RECOMMENDED PRODUCTS', yPos);
    if (products.length > 0) {
      products.slice(0, 3).forEach((product: string, i: number) => {
        doc.setFillColor(i === 0 ? 16 : 59, i === 0 ? 185 : 130, i === 0 ? 129 : 246);
        doc.circle(margin + 6, yPos + 2, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.text(String(i + 1), margin + 5, yPos + 3);
        addText(product, margin + 12, yPos + 3, { fontSize: 10, fontStyle: 'bold' });
        addText(reasonCodes[i] || 'Matches signal requirements', margin + 12, yPos + 8, { fontSize: 8, color: [100, 100, 100] });
        yPos += 13;
      });
    } else {
      addText('No product recommendations available.', margin + 4, yPos + 5, { fontSize: 9 });
      yPos += 12;
    }
    yPos += 5;

    // Suggested Next Action - Prominent Box
    yPos = addSection('SUGGESTED NEXT ACTION', yPos);
    const action = lead.inference?.suggested_next_action || 'Schedule initial contact call';
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 2, 2, 'FD');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    const actionLines = doc.splitTextToSize(action, pageWidth - 2 * margin - 10);
    doc.text(actionLines, margin + 5, yPos + 6);
    yPos += 22;

    // Score Breakdown
    yPos = addSection('SCORE BREAKDOWN', yPos);
    const scoreData = [
      { name: 'Intent Strength', score: scoreBreakdown.intentStrength || 0, max: 30 },
      { name: 'Freshness', score: scoreBreakdown.freshness || 0, max: 25 },
      { name: 'Company Scale', score: scoreBreakdown.companySizeProxy || 0, max: 20 },
      { name: 'Source Trust', score: scoreBreakdown.sourceTrust || 0, max: 15 },
      { name: 'Geography', score: scoreBreakdown.geoRelevance || 0, max: 10 }
    ];
    
    scoreData.forEach((item, i) => {
      const barWidth = 80;
      const barHeight = 5;
      const barX = margin + 40;
      const fillWidth = (item.score / item.max) * barWidth;
      
      addText(item.name, margin + 4, yPos + 4, { fontSize: 8 });
      doc.setFillColor(229, 231, 235);
      doc.roundedRect(barX, yPos + 1, barWidth, barHeight, 1, 1, 'F');
      doc.setFillColor(0, 82, 147);
      doc.roundedRect(barX, yPos + 1, fillWidth, barHeight, 1, 1, 'F');
      addText(`${item.score}/${item.max}`, barX + barWidth + 5, yPos + 4, { fontSize: 8 });
      yPos += 8;
    });
    yPos += 5;

    // Workflow Status
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    yPos = addSection('WORKFLOW STATUS', yPos);
    const workflowData = [
      ['Assigned To', lead.assignedTo || 'Unassigned'],
      ['Current Status', (lead.status || 'new').replace('_', ' ').toUpperCase()],
      ['Last Updated', formatFullDate(lead.updatedAt)]
    ];
    workflowData.forEach((row, i) => {
      addText(row[0] + ':', margin + 4, yPos + (i * 5), { fontSize: 9, fontStyle: 'bold' });
      addText(row[1], margin + 40, yPos + (i * 5), { fontSize: 9 });
    });
    yPos += 18;

    // Notes Section
    if (lead.note) {
      yPos = addSection('INTERNAL NOTES', yPos);
      const noteLines = doc.splitTextToSize(lead.note, pageWidth - 2 * margin - 10);
      addText(noteLines.join('\n'), margin + 4, yPos + 5, { fontSize: 9 });
      yPos += noteLines.length * 5 + 10;
    }

    // Footer
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 280, pageWidth, 17, 'F');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('CONFIDENTIAL - HPCL Internal Use Only | Lead Intelligence System', margin, 287);
    doc.text(`Report ID: ${lead.id}`, pageWidth - margin - 40, 287);

    // Save the PDF
    doc.save(`HPCL_Lead_${lead.company_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    setDownloading(false);
  };

  const urgency = lead.inference?.urgency_level || 'medium';
  const confidence = lead.inference?.confidence_score || 0;

  return (
    <div className="space-y-6">
      {/* Company Profile Card */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {lead.company_name?.charAt(0) || 'C'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {lead.company_name}
                </h2>
                <p className="text-slate-500">{lead.inference?.industry || lead.industry || 'Unknown Industry'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`badge ${getStatusClass(lead.status)}`}>
                {lead.status === 'in_progress' ? 'In Progress' : lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1)}
              </span>
              <span className={`badge ${getUrgencyClass(urgency)} flex items-center gap-1`}>
                {urgency === 'high' && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                )} {urgency.charAt(0).toUpperCase() + urgency.slice(1)} Priority
              </span>
              <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {lead.geo} Region
              </span>
            </div>
          </div>

          {/* Score display */}
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full border-4 ${getScoreColor(lead.score)} border-current flex items-center justify-center`}>
              <span className="text-2xl font-bold">{lead.score || '—'}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Lead Score</p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleEmailTeam}
            disabled={emailSending}
            className={`flex-1 sm:flex-none py-2.5 px-4 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
              emailSent 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {emailSending ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : emailSent ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Email Sent!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Team
              </>
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadDocument}
            disabled={downloading}
            className="flex-1 sm:flex-none py-2.5 px-4 text-sm font-medium bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Report
              </>
            )}
          </motion.button>
        </div>
      </motion.section>

      {/* Source Signal */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Source Signal
        </h3>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2 text-sm text-amber-700 dark:text-amber-300">
            <span className="font-medium">{lead.source}</span>
            <span>•</span>
            <span>{lead.source_type || 'news'}</span>
            <span>•</span>
            <span>{formatDate(lead.timestamp)}</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {lead.source_text}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-slate-500">Trust Score:</span>
            <div className="flex-1 max-w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(lead.trust || 50, 100)}%` }}
              />
            </div>
            <span className="font-medium text-emerald-600">{Math.min(Math.round(lead.trust || 50), 100)}%</span>
          </div>
        </div>
      </motion.section>

      {/* AI Inference - Recommended Products */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Product Recommendations
        </h3>

        {lead.inference ? (
          <div className="space-y-4">
            {lead.inference.inferred_products?.map((product: string, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white">{product}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {lead.inference.reason_codes?.[i] || 'Matches signal requirements'}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Confidence meter */}
            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">AI Confidence</span>
                <span className="text-lg font-bold text-purple-600">{Math.round(confidence * 100)}%</span>
              </div>
              <div className="h-3 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p>AI inference pending. Run ingestion to generate recommendations.</p>
          </div>
        )}
      </motion.section>

      {/* Score Breakdown Section */}
      {lead.scoreBreakdown && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-6"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Score Breakdown
          </h3>
          
          <div className="space-y-3">
            {/* Intent Strength */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Intent Strength</span>
                <span className="text-xs text-slate-400">(max 30)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${((lead.scoreBreakdown.intentStrength || 0) / 30) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white w-8">{lead.scoreBreakdown.intentStrength || 0}</span>
              </div>
            </div>

            {/* Freshness */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Freshness</span>
                <span className="text-xs text-slate-400">(max 25)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((lead.scoreBreakdown.freshness || 0) / 25) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white w-8">{lead.scoreBreakdown.freshness || 0}</span>
              </div>
            </div>

            {/* Company Size Proxy */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Company Size</span>
                <span className="text-xs text-slate-400">(max 20)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${((lead.scoreBreakdown.companySizeProxy || 0) / 20) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white w-8">{lead.scoreBreakdown.companySizeProxy || 0}</span>
              </div>
            </div>

            {/* Source Trust */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Source Trust</span>
                <span className="text-xs text-slate-400">(max 15)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${((lead.scoreBreakdown.sourceTrust || 0) / 15) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white w-8">{lead.scoreBreakdown.sourceTrust || 0}</span>
              </div>
            </div>

            {/* Geo Relevance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Geo Relevance</span>
                <span className="text-xs text-slate-400">(max 10)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${((lead.scoreBreakdown.geoRelevance || 0) / 10) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white w-8">{lead.scoreBreakdown.geoRelevance || 0}</span>
              </div>
            </div>

            {/* Total */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Total Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(lead.score)}`}>{lead.score || 0}/100</span>
            </div>

            {lead.scoreExplanation && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">{lead.scoreExplanation}</p>
            )}

            {lead.mlAdjusted && (
              <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Score adjusted by ML learning from user feedback</span>
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* Suggested Action */}
      {lead.inference?.suggested_next_action && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Suggested Next Action
          </h3>
          <p className="text-blue-100 leading-relaxed">{lead.inference.suggested_next_action}</p>
        </motion.section>
      )}

      {/* Actions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6"
      >
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Take Action</h3>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add notes about this lead (optional)..."
          rows={3}
          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          {lead.status !== 'converted' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction('converted')}
              disabled={loading !== null}
              className="flex-1 sm:flex-none py-2.5 px-6 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading === 'converted' ? (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              Mark Converted
            </motion.button>
          )}

          {lead.status === 'new' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction('accept')}
              disabled={loading !== null}
              className="flex-1 sm:flex-none py-2.5 px-6 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading === 'accept' ? '...' : 'Accept Lead'}
            </motion.button>
          )}

          {lead.status !== 'rejected' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction('reject')}
              disabled={loading !== null}
              className="flex-1 sm:flex-none py-2.5 px-6 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading === 'reject' ? '...' : 'Reject Lead'}
            </motion.button>
          )}
        </div>

        {lead.note && (
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Previous Note:</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{lead.note}</p>
          </div>
        )}
      </motion.section>
    </div>
  );
}
