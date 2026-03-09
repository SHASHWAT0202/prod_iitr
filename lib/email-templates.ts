/**
 * Shared Email Templates for HPCL Lead Intelligence Platform
 * Premium, executive-grade, responsive HTML email templates
 */

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ─── DESIGN SYSTEM ────────────────────────────────────
const COLORS = {
  primary: '#0f172a',
  primaryLight: '#1e293b',
  accent: '#f97316',
  accentWarm: '#ea580c',
  blue: '#2563eb',
  blueLight: '#3b82f6',
  bluePale: '#eff6ff',
  green: '#059669',
  greenLight: '#10b981',
  greenPale: '#ecfdf5',
  amber: '#d97706',
  amberPale: '#fffbeb',
  red: '#dc2626',
  redPale: '#fef2f2',
  purple: '#7c3aed',
  purplePale: '#f5f3ff',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  white: '#ffffff',
};

function getScoreColor(score: number): string {
  if (score >= 80) return COLORS.green;
  if (score >= 60) return COLORS.blue;
  if (score >= 40) return COLORS.amber;
  return COLORS.red;
}

function getScoreGradient(score: number): string {
  if (score >= 80) return 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
  if (score >= 60) return 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)';
  if (score >= 40) return 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';
  return 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Moderate';
  return 'Low';
}

function getScoreEmoji(score: number): string {
  if (score >= 80) return '🟢';
  if (score >= 60) return '🔵';
  if (score >= 40) return '🟡';
  return '🔴';
}

function getUrgencyColor(urgency: string): string {
  switch (urgency?.toLowerCase()) {
    case 'high': return COLORS.red;
    case 'medium': return COLORS.amber;
    case 'low': return COLORS.green;
    default: return COLORS.slate500;
  }
}

function getUrgencyBg(urgency: string): string {
  switch (urgency?.toLowerCase()) {
    case 'high': return COLORS.redPale;
    case 'medium': return COLORS.amberPale;
    case 'low': return COLORS.greenPale;
    default: return COLORS.slate50;
  }
}

function getUrgencyEmoji(urgency: string): string {
  switch (urgency?.toLowerCase()) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

function formatDate(date?: Date | number): string {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function timeAgo(date?: Date | number): string {
  if (!date) return 'Just now';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── SHARED COMPONENTS ────────────────────────────────
function sectionHeader(icon: string, title: string, subtitle?: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
      <tr>
        <td style="padding: 0;">
          <div style="font-size: 15px; font-weight: 700; color: ${COLORS.slate900}; letter-spacing: -0.2px;">
            <span style="margin-right: 8px;">${icon}</span>${title}
          </div>
          ${subtitle ? `<div style="font-size: 12px; color: ${COLORS.slate500}; margin-top: 2px; padding-left: 28px;">${subtitle}</div>` : ''}
        </td>
        <td style="width: 1px; white-space: nowrap; vertical-align: bottom;">
          <div style="height: 2px; width: 60px; background: linear-gradient(90deg, ${COLORS.accent}, transparent); border-radius: 2px;"></div>
        </td>
      </tr>
    </table>`;
}

function metricCard(label: string, value: string, sublabel: string, bgColor: string, textColor: string): string {
  return `
    <td style="padding: 4px;">
      <div style="background: ${bgColor}; border-radius: 12px; padding: 16px 12px; text-align: center; border: 1px solid ${bgColor === COLORS.white ? COLORS.slate200 : 'transparent'};">
        <div style="font-size: 10px; font-weight: 700; color: ${COLORS.slate500}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">${label}</div>
        <div style="font-size: 26px; font-weight: 800; color: ${textColor}; line-height: 1;">${value}</div>
        <div style="font-size: 11px; color: ${COLORS.slate500}; margin-top: 4px; font-weight: 500;">${sublabel}</div>
      </div>
    </td>`;
}

function divider(): string {
  return `<div style="height: 1px; background: linear-gradient(90deg, transparent, ${COLORS.slate200}, transparent); margin: 24px 0;"></div>`;
}

function emailFooter(logoUrl: string, appUrl: string): string {
  return `
    <div style="background: linear-gradient(135deg, ${COLORS.slate900} 0%, ${COLORS.primaryLight} 100%); padding: 32px 28px; text-align: center;">
      <img src="${logoUrl}" alt="HPCL" style="height: 32px; margin-bottom: 12px; border-radius: 8px; opacity: 0.9;" />
      <div style="margin-bottom: 12px;">
        <span style="display: inline-block; width: 6px; height: 6px; background: ${COLORS.accent}; border-radius: 50%; margin: 0 4px;"></span>
        <span style="display: inline-block; width: 6px; height: 6px; background: ${COLORS.blueLight}; border-radius: 50%; margin: 0 4px;"></span>
        <span style="display: inline-block; width: 6px; height: 6px; background: ${COLORS.greenLight}; border-radius: 50%; margin: 0 4px;"></span>
      </div>
      <p style="color: ${COLORS.accent}; font-weight: 700; margin: 0 0 6px; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">
        HPCL Direct Sales
      </p>
      <p style="color: ${COLORS.slate500}; margin: 0 0 12px; font-size: 11px;">
        B2B Lead Intelligence Platform &bull; AI-Powered &bull; Real-time
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align: center;">
            <a href="${appUrl}/dashboard" style="color: ${COLORS.slate400}; text-decoration: none; font-size: 11px; padding: 0 8px;">Dashboard</a>
            <span style="color: ${COLORS.slate700};">|</span>
            <a href="${appUrl}/dashboard" style="color: ${COLORS.slate400}; text-decoration: none; font-size: 11px; padding: 0 8px;">Settings</a>
            <span style="color: ${COLORS.slate700};">|</span>
            <a href="${appUrl}/contact" style="color: ${COLORS.slate400}; text-decoration: none; font-size: 11px; padding: 0 8px;">Support</a>
          </td>
        </tr>
      </table>
    </div>`;
}

function emailSubFooter(appUrl: string): string {
  return `
    <div style="padding: 20px; text-align: center;">
      <p style="color: ${COLORS.slate400}; font-size: 11px; margin: 0; line-height: 1.6;">
        This is an automated message from the HPCL Lead Intelligence System.<br/>
        &copy; ${new Date().getFullYear()} Hindustan Petroleum Corporation Limited. All rights reserved.
      </p>
    </div>`;
}

// ─────────────────────────────────────────────────────
// HIGH PRIORITY LEAD ALERT EMAIL
// Used by: scraper, ingest, test-notify
// ─────────────────────────────────────────────────────
export function generateHighPriorityLeadEmail(lead: any, dsRegion: string): string {
  const score = lead.score || 0;
  const urgency = lead.inference?.urgency_level || 'high';
  const confidence = Math.round((lead.inference?.confidence_score || 0) * 100);
  const products = lead.inference?.inferred_products || [];
  const reasons = lead.inference?.reason_codes || [];
  const appUrl = APP_URL();
  const logoUrl = `${appUrl}/images.jpg`;
  const industry = lead.industry || lead.inference?.industry || 'N/A';
  const detectedTime = formatDate(lead.timestamp || Date.now());
  const ago = timeAgo(lead.timestamp || Date.now());

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🚨 High Priority Lead: ${lead.company_name}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.slate100}; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 660px; margin: 0 auto; padding: 24px 16px;">

    <!-- Urgency Top Banner -->
    <div style="background: linear-gradient(135deg, ${COLORS.red} 0%, #b91c1c 100%); padding: 10px 20px; border-radius: 12px 12px 0 0; text-align: center;">
      <span style="color: ${COLORS.white}; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
        ⚡ IMMEDIATE ACTION REQUIRED &mdash; HIGH PRIORITY LEAD DETECTED
      </span>
    </div>
    
    <!-- Main Card -->
    <div style="background: ${COLORS.white}; border-radius: 0 0 16px 16px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.1); border: 1px solid ${COLORS.slate200}; border-top: none;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0c1220 0%, ${COLORS.primary} 40%, ${COLORS.primaryLight} 100%); padding: 36px 32px 28px; text-align: center; position: relative;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center;">
              <img src="${logoUrl}" alt="HPCL" style="height: 44px; margin-bottom: 18px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.4);" />
            </td>
          </tr>
          <tr>
            <td style="text-align: center;">
              <div style="display: inline-block; background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.3); color: ${COLORS.accent}; font-size: 10px; font-weight: 700; padding: 5px 16px; border-radius: 50px; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 14px;">
                LEAD INTELLIGENCE ALERT
              </div>
            </td>
          </tr>
          <tr>
            <td style="text-align: center;">
              <h1 style="color: ${COLORS.white}; margin: 0 0 6px; font-size: 26px; font-weight: 800; line-height: 1.2; letter-spacing: -0.5px;">
                ${lead.company_name}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="text-align: center;">
              <span style="display: inline-block; background: rgba(255,255,255,0.08); padding: 4px 14px; border-radius: 50px; margin-top: 4px;">
                <span style="color: ${COLORS.slate400}; font-size: 12px;">🏭 ${industry}</span>
                <span style="color: ${COLORS.slate700}; margin: 0 6px;">&bull;</span>
                <span style="color: ${COLORS.slate400}; font-size: 12px;">📍 ${lead.geo || 'India'}</span>
                <span style="color: ${COLORS.slate700}; margin: 0 6px;">&bull;</span>
                <span style="color: ${COLORS.slate400}; font-size: 12px;">🕐 ${ago}</span>
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Metrics Dashboard -->
      <div style="background: ${COLORS.slate50}; padding: 20px 16px; border-bottom: 1px solid ${COLORS.slate200};">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${metricCard('LEAD SCORE', `${score}`, getScoreLabel(score), COLORS.white, getScoreColor(score))}
            ${metricCard('URGENCY', urgency.toUpperCase(), getUrgencyEmoji(urgency) + ' Priority', COLORS.white, getUrgencyColor(urgency))}
            ${metricCard('AI CONFIDENCE', `${confidence}%`, confidence >= 80 ? 'High Certainty' : confidence >= 60 ? 'Moderate' : 'Low', COLORS.white, COLORS.slate900)}
            ${metricCard('DS REGION', dsRegion, '📋 Assigned', COLORS.white, COLORS.blue)}
          </tr>
        </table>
      </div>

      <!-- Body Content -->
      <div style="padding: 32px;">

        <!-- Executive Summary -->
        <div style="background: linear-gradient(135deg, ${COLORS.slate900} 0%, ${COLORS.primaryLight} 100%); border-radius: 14px; padding: 24px; margin-bottom: 28px; position: relative; overflow: hidden;">
          <div style="position: relative;">
            <div style="font-size: 11px; font-weight: 700; color: ${COLORS.accent}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">
              📋 EXECUTIVE SUMMARY
            </div>
            <p style="color: ${COLORS.slate300}; margin: 0; font-size: 14px; line-height: 1.8;">
              A <strong style="color: ${COLORS.white};">${urgency}-priority</strong> lead has been identified for 
              <strong style="color: ${COLORS.white};">${lead.company_name}</strong> in the 
              <strong style="color: ${COLORS.white};">${industry}</strong> sector. 
              The AI engine scored this lead at <strong style="color: ${getScoreColor(score)};">${score}/100</strong> 
              with <strong style="color: ${COLORS.white};">${confidence}%</strong> confidence. 
              ${products.length > 0 ? `Potential product fit: <strong style="color: ${COLORS.accent};">${products.join(', ')}</strong>.` : ''}
              This lead is assigned to <strong style="color: ${COLORS.white};">${dsRegion}</strong> region for immediate follow-up.
            </p>
          </div>
        </div>

        <!-- Company Profile -->
        ${sectionHeader('🏢', 'Company Profile', 'Key identification details')}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; border: 1px solid ${COLORS.slate200}; border-radius: 12px; overflow: hidden;">
          ${[
            { label: 'Company Name', value: lead.company_name, icon: '🏢' },
            { label: 'Industry / Sector', value: industry, icon: '🏭' },
            { label: 'Geography', value: lead.geo || 'India', icon: '📍' },
            { label: 'DS Region', value: dsRegion, icon: '🗺️' },
            { label: 'Data Source', value: lead.source || 'Web Intelligence', icon: '🔗' },
            { label: 'Detected', value: detectedTime, icon: '🕐' },
          ].map((row, i) => `
          <tr style="background: ${i % 2 === 0 ? COLORS.slate50 : COLORS.white};">
            <td style="padding: 12px 16px; width: 180px; border-bottom: 1px solid ${COLORS.slate200};">
              <span style="font-size: 13px; color: ${COLORS.slate600};">${row.icon} <span style="font-weight: 600;">${row.label}</span></span>
            </td>
            <td style="padding: 12px 16px; border-bottom: 1px solid ${COLORS.slate200};">
              <span style="font-size: 14px; font-weight: 600; color: ${COLORS.slate900};">${row.value}</span>
            </td>
          </tr>`).join('')}
        </table>

        <!-- Products Section -->
        ${products.length > 0 ? `
        ${sectionHeader('🎯', 'Recommended HPCL Products', `${products.length} product${products.length > 1 ? 's' : ''} identified by AI`)}
        <div style="margin-bottom: 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${products.map((p: string, i: number) => {
              const colors = [
                { bg: COLORS.bluePale, border: '#93c5fd', text: '#1e40af', icon: '⛽' },
                { bg: COLORS.greenPale, border: '#86efac', text: '#065f46', icon: '🛢️' },
                { bg: COLORS.purplePale, border: '#c4b5fd', text: '#5b21b6', icon: '🔧' },
                { bg: COLORS.amberPale, border: '#fde68a', text: '#92400e', icon: '📦' },
              ];
              const c = colors[i % colors.length];
              return `
            <tr>
              <td style="padding: 4px 0;">
                <div style="background: ${c.bg}; border: 1px solid ${c.border}; border-radius: 10px; padding: 14px 18px; display: flex; align-items: center;">
                  <span style="font-size: 18px; margin-right: 12px;">${c.icon}</span>
                  <span style="font-size: 14px; font-weight: 700; color: ${c.text};">${p}</span>
                </div>
              </td>
            </tr>`;
            }).join('')}
          </table>
        </div>
        ` : ''}

        <!-- Why This Lead Matters -->
        ${reasons.length > 0 ? `
        ${sectionHeader('🔍', 'Why This Lead Matters', 'AI-identified opportunity signals')}
        <div style="background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%); border-radius: 14px; padding: 22px; margin-bottom: 28px; border: 1px solid #fde68a; border-left: 5px solid #eab308;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${reasons.map((r: string, i: number) => `
            <tr>
              <td style="padding: 8px 0; vertical-align: top; width: 28px;">
                <div style="width: 22px; height: 22px; line-height: 22px; text-align: center; background: #fbbf24; color: ${COLORS.white}; border-radius: 50%; font-size: 11px; font-weight: 700;">${i + 1}</div>
              </td>
              <td style="padding: 8px 0 8px 10px;">
                <span style="font-size: 14px; color: #78350f; line-height: 1.6; font-weight: 500;">${r}</span>
              </td>
            </tr>`).join('')}
          </table>
        </div>
        ` : ''}

        <!-- Suggested Next Action -->
        ${lead.inference?.suggested_next_action ? `
        ${sectionHeader('🚀', 'Recommended Next Step')}
        <div style="background: linear-gradient(135deg, ${COLORS.bluePale} 0%, #dbeafe 100%); border-radius: 14px; padding: 20px 22px; margin-bottom: 28px; border: 1px solid #93c5fd; border-left: 5px solid ${COLORS.blue};">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align: top; width: 36px;">
                <div style="width: 32px; height: 32px; line-height: 32px; text-align: center; background: ${COLORS.blue}; border-radius: 8px; font-size: 16px;">💡</div>
              </td>
              <td style="padding-left: 14px;">
                <div style="font-size: 15px; font-weight: 700; color: #1e3a8a; line-height: 1.5;">${lead.inference.suggested_next_action}</div>
                <div style="font-size: 12px; color: #3b82f6; margin-top: 4px;">Suggested by AI based on signal analysis</div>
              </td>
            </tr>
          </table>
        </div>
        ` : ''}

        <!-- Source Intelligence -->
        ${lead.source_text ? `
        ${sectionHeader('📰', 'Source Intelligence', 'Original signal that triggered this lead')}
        <div style="background: ${COLORS.slate50}; border-radius: 14px; padding: 22px; margin-bottom: 28px; border: 1px solid ${COLORS.slate200}; position: relative;">
          <div style="position: absolute; top: 16px; left: 16px; font-size: 32px; opacity: 0.08; line-height: 1;">&ldquo;</div>
          <p style="color: ${COLORS.slate700}; margin: 0; font-size: 14px; line-height: 1.8; font-style: italic; padding: 0 8px;">
            ${lead.source_text?.substring(0, 400)}${(lead.source_text?.length || 0) > 400 ? '...' : ''}
          </p>
          ${lead.source_url ? `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${COLORS.slate200};">
            <a href="${lead.source_url}" style="color: ${COLORS.blue}; font-size: 12px; text-decoration: none; font-weight: 600;">🔗 View Original Source &rarr;</a>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${divider()}

        <!-- CTA Buttons -->
        <div style="text-align: center; padding: 8px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align: center;">
                <a href="${appUrl}/leads/${lead.id}" 
                   style="display: inline-block; background: linear-gradient(135deg, ${COLORS.red} 0%, #b91c1c 100%); color: ${COLORS.white}; padding: 16px 44px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 6px 20px rgba(220,38,38,0.3); letter-spacing: 0.3px;">
                  View Full Lead Details &rarr;
                </a>
              </td>
            </tr>
            <tr>
              <td style="text-align: center; padding-top: 12px;">
                <a href="${appUrl}/dashboard" 
                   style="color: ${COLORS.slate500}; text-decoration: none; font-size: 13px; font-weight: 600;">
                  Open Dashboard &bull;
                </a>
                <a href="${appUrl}/dashboard" 
                   style="color: ${COLORS.slate500}; text-decoration: none; font-size: 13px; font-weight: 600;">
                  &bull; Notification Settings
                </a>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Footer -->
      ${emailFooter(logoUrl, appUrl)}
    </div>

    <!-- Sub-footer -->
    ${emailSubFooter(appUrl)}
  </div>
</body>
</html>`;
}


// ─────────────────────────────────────────────────────
// DETAILED LEAD REPORT EMAIL
// Used by: email-lead
// ─────────────────────────────────────────────────────
export function generateLeadReportEmail(lead: any, senderName?: string): string {
  const score = lead.score || 0;
  const urgency = lead.inference?.urgency_level || 'medium';
  const confidence = Math.round((lead.inference?.confidence_score || 0) * 100);
  const products = lead.inference?.inferred_products || [];
  const reasons = lead.inference?.reason_codes || [];
  const reasoning = lead.inference?.reasoning || reasons.join('. ') || 'No AI reasoning available';
  const appUrl = APP_URL();
  const logoUrl = `${appUrl}/images.jpg`;
  const industry = lead.inference?.industry || lead.industry || 'Unknown';
  const status = lead.status?.replace(/_/g, ' ').toUpperCase() || 'NEW';

  // Score breakdown bar helper
  const scoreBar = (label: string, value: number, max: number, color: string, icon: string) => {
    const pct = Math.min(100, Math.round((value / max) * 100));
    return `
    <tr>
      <td style="padding: 10px 0; vertical-align: middle; width: 36px;">
        <div style="width: 28px; height: 28px; line-height: 28px; text-align: center; background: ${color}12; border-radius: 6px; font-size: 13px;">${icon}</div>
      </td>
      <td style="padding: 10px 8px; vertical-align: middle; width: 120px;">
        <div style="font-size: 12px; font-weight: 600; color: ${COLORS.slate700};">${label}</div>
      </td>
      <td style="padding: 10px 0; vertical-align: middle;">
        <div style="background: ${COLORS.slate200}; border-radius: 50px; height: 10px; overflow: hidden; position: relative;">
          <div style="background: linear-gradient(90deg, ${color}, ${color}cc); width: ${pct}%; height: 100%; border-radius: 50px; transition: width 0.3s;"></div>
        </div>
      </td>
      <td style="padding: 10px 0 10px 14px; vertical-align: middle; text-align: right; white-space: nowrap; width: 70px;">
        <span style="font-size: 14px; font-weight: 800; color: ${color};">${value}</span>
        <span style="font-size: 11px; color: ${COLORS.slate400};">/ ${max}</span>
      </td>
    </tr>`;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lead Intelligence Report - ${lead.company_name}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.slate100}; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 680px; margin: 0 auto; padding: 24px 16px;">

    <!-- Main Card -->
    <div style="background: ${COLORS.white}; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.1); border: 1px solid ${COLORS.slate200};">

      <!-- Premium Header -->
      <div style="background: linear-gradient(135deg, #0c1220 0%, #162032 30%, #1a365d 60%, #1e40af 100%); padding: 40px 32px 32px; text-align: center; position: relative;">
        <!-- Subtle pattern overlay -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center;">
              <img src="${logoUrl}" alt="HPCL" style="height: 48px; margin-bottom: 20px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);" />
            </td>
          </tr>
          <tr>
            <td style="text-align: center;">
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); padding: 5px 18px; border-radius: 50px;">
                    <span style="font-size: 10px; font-weight: 700; color: ${COLORS.accent}; letter-spacing: 2px; text-transform: uppercase;">
                      📊 LEAD INTELLIGENCE REPORT
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="text-align: center; padding-top: 16px;">
              <h1 style="color: ${COLORS.white}; margin: 0; font-size: 28px; font-weight: 800; line-height: 1.2; letter-spacing: -0.5px;">
                ${lead.company_name}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="text-align: center; padding-top: 10px;">
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 8px;">
                    <span style="color: #93c5fd; font-size: 12px;">🏭 ${industry}</span>
                  </td>
                  <td style="color: rgba(255,255,255,0.2);">|</td>
                  <td style="padding: 0 8px;">
                    <span style="color: #93c5fd; font-size: 12px;">📍 ${lead.geo || 'India'}</span>
                  </td>
                  <td style="color: rgba(255,255,255,0.2);">|</td>
                  <td style="padding: 0 8px;">
                    <span style="color: #93c5fd; font-size: 12px;">📅 ${formatDate()}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${senderName ? `
          <tr>
            <td style="text-align: center; padding-top: 14px;">
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: rgba(255,255,255,0.08); padding: 6px 16px; border-radius: 50px;">
                    <span style="color: #bfdbfe; font-size: 12px;">Shared by <strong style="color: ${COLORS.white};">${senderName}</strong></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- KPI Dashboard -->
      <div style="background: linear-gradient(180deg, ${COLORS.slate50} 0%, ${COLORS.white} 100%); padding: 24px 20px; border-bottom: 1px solid ${COLORS.slate200};">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <!-- Score Card - Prominent -->
            <td style="padding: 4px; width: 25%;">
              <div style="background: ${getScoreGradient(score)}; border-radius: 14px; padding: 18px 12px; text-align: center; box-shadow: 0 4px 12px ${getScoreColor(score)}30;">
                <div style="font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">SCORE</div>
                <div style="font-size: 32px; font-weight: 900; color: ${COLORS.white}; line-height: 1;">${score}</div>
                <div style="font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 2px;">${getScoreLabel(score)}</div>
              </div>
            </td>
            <!-- Urgency -->
            <td style="padding: 4px; width: 25%;">
              <div style="background: ${COLORS.white}; border-radius: 14px; padding: 18px 12px; text-align: center; border: 1px solid ${COLORS.slate200};">
                <div style="font-size: 10px; font-weight: 700; color: ${COLORS.slate500}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">URGENCY</div>
                <div style="font-size: 20px; font-weight: 800; color: ${getUrgencyColor(urgency)}; text-transform: uppercase; line-height: 1.6;">${urgency}</div>
                <div style="font-size: 10px; color: ${COLORS.slate400};">${getUrgencyEmoji(urgency)} Priority</div>
              </div>
            </td>
            <!-- Confidence -->
            <td style="padding: 4px; width: 25%;">
              <div style="background: ${COLORS.white}; border-radius: 14px; padding: 18px 12px; text-align: center; border: 1px solid ${COLORS.slate200};">
                <div style="font-size: 10px; font-weight: 700; color: ${COLORS.slate500}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">CONFIDENCE</div>
                <div style="font-size: 32px; font-weight: 900; color: ${COLORS.slate900}; line-height: 1;">${confidence}<span style="font-size: 14px; color: ${COLORS.slate400};">%</span></div>
                <div style="font-size: 10px; color: ${COLORS.slate400};">${confidence >= 80 ? 'High' : confidence >= 60 ? 'Moderate' : 'Low'}</div>
              </div>
            </td>
            <!-- Status -->
            <td style="padding: 4px; width: 25%;">
              <div style="background: ${COLORS.white}; border-radius: 14px; padding: 18px 12px; text-align: center; border: 1px solid ${COLORS.slate200};">
                <div style="font-size: 10px; font-weight: 700; color: ${COLORS.slate500}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">STATUS</div>
                <div style="font-size: 14px; font-weight: 800; color: ${COLORS.blue}; line-height: 1.8;">${status}</div>
                <div style="font-size: 10px; color: ${COLORS.slate400};">Workflow</div>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Body -->
      <div style="padding: 32px;">

        <!-- ═══════ SECTION 1: Company Dossier ═══════ -->
        ${sectionHeader('🏢', 'Company Dossier', 'Detailed company identification and classification')}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px; border: 1px solid ${COLORS.slate200}; border-radius: 14px; overflow: hidden;">
          ${[
            { label: 'Company Name', value: lead.company_name, icon: '🏢' },
            { label: 'Industry / Sector', value: industry, icon: '🏭' },
            { label: 'Geography', value: lead.geo || 'India', icon: '📍' },
            { label: 'Data Source', value: lead.source || 'Web Intelligence', icon: '🔗' },
            { label: 'Lead Status', value: status, icon: '📋' },
            { label: 'Trust Index', value: `${lead.trust || 0}% Trust Score`, icon: '🛡️' },
            { label: 'First Detected', value: formatDate(lead.timestamp || lead.created_at), icon: '🕐' },
            { label: 'Last Updated', value: formatDate(lead.updated_at || Date.now()), icon: '🔄' },
          ].map((row, i) => `
          <tr style="background: ${i % 2 === 0 ? COLORS.slate50 : COLORS.white};">
            <td style="padding: 13px 18px; width: 180px; border-bottom: 1px solid ${COLORS.slate100};">
              <span style="font-size: 14px;">${row.icon}</span>
              <span style="font-size: 12px; font-weight: 600; color: ${COLORS.slate600}; margin-left: 6px;">${row.label}</span>
            </td>
            <td style="padding: 13px 18px; border-bottom: 1px solid ${COLORS.slate100};">
              <span style="font-size: 14px; font-weight: 700; color: ${COLORS.slate900};">${row.value}</span>
            </td>
          </tr>`).join('')}
        </table>

        <!-- ═══════ SECTION 2: AI Analysis & Reasoning ═══════ -->
        ${sectionHeader('🤖', 'AI Analysis & Reasoning', 'GPT-4 powered lead intelligence assessment')}
        <div style="background: linear-gradient(135deg, ${COLORS.slate900} 0%, #1a2744 100%); border-radius: 16px; padding: 26px; margin-bottom: 32px; position: relative; overflow: hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="display: inline-block; background: rgba(249,115,22,0.2); border: 1px solid rgba(249,115,22,0.3); padding: 3px 12px; border-radius: 50px; margin-bottom: 14px;">
                  <span style="font-size: 10px; font-weight: 700; color: ${COLORS.accent}; letter-spacing: 1px;">AI-GENERATED INSIGHT</span>
                </div>
                <p style="color: ${COLORS.slate300}; margin: 0; font-size: 14px; line-height: 1.9;">
                  ${reasoning}
                </p>
              </td>
            </tr>
          </table>
        </div>

        <!-- Reason Codes (if separate from reasoning) -->
        ${reasons.length > 0 ? `
        <div style="margin-bottom: 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${reasons.map((r: string, i: number) => `
            <tr>
              <td style="padding: 6px 0; vertical-align: top; width: 32px;">
                <div style="width: 24px; height: 24px; line-height: 24px; text-align: center; background: linear-gradient(135deg, ${COLORS.blue}, ${COLORS.blueLight}); color: ${COLORS.white}; border-radius: 50%; font-size: 11px; font-weight: 700;">${i + 1}</div>
              </td>
              <td style="padding: 8px 0 8px 10px;">
                <span style="font-size: 14px; color: ${COLORS.slate700}; line-height: 1.6;">${r}</span>
              </td>
            </tr>`).join('')}
          </table>
        </div>
        ` : ''}

        <!-- ═══════ SECTION 3: Product Recommendations ═══════ -->
        ${products.length > 0 ? `
        ${sectionHeader('🎯', 'Product Recommendations', `${products.length} HPCL product${products.length > 1 ? 's' : ''} matched to this lead`)}
        <div style="margin-bottom: 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${products.map((p: string, i: number) => {
              const prodColors = [
                { gradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '#93c5fd', text: '#1e40af', badge: '#2563eb', icon: '⛽' },
                { gradient: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '#86efac', text: '#065f46', badge: '#059669', icon: '🛢️' },
                { gradient: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '#c4b5fd', text: '#5b21b6', badge: '#7c3aed', icon: '🔧' },
                { gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '#fde68a', text: '#92400e', badge: '#d97706', icon: '📦' },
                { gradient: 'linear-gradient(135deg, #fef2f2, #fecaca)', border: '#fca5a5', text: '#991b1b', badge: '#dc2626', icon: '🔬' },
              ];
              const c = prodColors[i % prodColors.length];
              return `
            <tr>
              <td style="padding: 5px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background: ${c.gradient}; border: 1px solid ${c.border}; border-radius: 12px; overflow: hidden;">
                  <tr>
                    <td style="padding: 16px 20px; vertical-align: middle; width: 44px;">
                      <div style="width: 36px; height: 36px; line-height: 36px; text-align: center; background: ${COLORS.white}; border-radius: 10px; font-size: 18px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">${c.icon}</div>
                    </td>
                    <td style="padding: 16px 12px; vertical-align: middle;">
                      <div style="font-size: 15px; font-weight: 700; color: ${c.text};">${p}</div>
                      <div style="font-size: 11px; color: ${c.text}; opacity: 0.7; margin-top: 2px;">HPCL B2B Product Line</div>
                    </td>
                    <td style="padding: 16px 20px; vertical-align: middle; text-align: right;">
                      <div style="display: inline-block; background: ${c.badge}; color: ${COLORS.white}; padding: 4px 12px; border-radius: 50px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px;">RECOMMENDED</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`;
            }).join('')}
          </table>
        </div>
        ` : ''}

        <!-- ═══════ SECTION 4: Score Breakdown ═══════ -->
        ${lead.scoreBreakdown ? `
        ${sectionHeader('📊', 'Score Breakdown', 'Weighted scoring across 5 dimensions')}
        <div style="background: ${COLORS.slate50}; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid ${COLORS.slate200};">
          <!-- Total Score Header -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 18px;">
            <tr>
              <td>
                <span style="font-size: 13px; color: ${COLORS.slate600}; font-weight: 600;">Total Score</span>
              </td>
              <td style="text-align: right;">
                <span style="font-size: 24px; font-weight: 900; color: ${getScoreColor(score)};">${score}</span>
                <span style="font-size: 13px; color: ${COLORS.slate400};"> / 100</span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 8px;">
                <div style="background: ${COLORS.slate200}; border-radius: 50px; height: 6px; overflow: hidden;">
                  <div style="background: ${getScoreGradient(score)}; width: ${score}%; height: 100%; border-radius: 50px;"></div>
                </div>
              </td>
            </tr>
          </table>

          <div style="height: 1px; background: ${COLORS.slate200}; margin: 16px 0;"></div>

          <!-- Individual Dimensions -->
          <table width="100%" cellpadding="0" cellspacing="0">
            ${scoreBar('Intent Strength', lead.scoreBreakdown.intentStrength || 0, 35, COLORS.blue, '🎯')}
            ${scoreBar('Freshness', lead.scoreBreakdown.freshness || 0, 20, COLORS.green, '⏱️')}
            ${scoreBar('Company Scale', lead.scoreBreakdown.companySizeProxy || 0, 20, COLORS.amber, '🏗️')}
            ${scoreBar('Source Trust', lead.scoreBreakdown.trustScore || lead.scoreBreakdown.sourceTrust || 0, 15, COLORS.purple, '🛡️')}
            ${scoreBar('Geo Match', lead.scoreBreakdown.geographyMatch || 0, 10, '#0ea5e9', '🌍')}
          </table>
        </div>
        ` : ''}

        <!-- ═══════ SECTION 5: Suggested Action Plan ═══════ -->
        ${lead.inference?.suggested_next_action ? `
        ${sectionHeader('🚀', 'Suggested Action Plan', 'AI-recommended engagement strategy')}
        <div style="background: linear-gradient(135deg, ${COLORS.bluePale} 0%, #dbeafe 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #93c5fd; border-left: 5px solid ${COLORS.blue};">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align: top; width: 44px;">
                <div style="width: 40px; height: 40px; line-height: 40px; text-align: center; background: linear-gradient(135deg, ${COLORS.blue}, ${COLORS.blueLight}); border-radius: 10px; font-size: 20px; box-shadow: 0 3px 8px rgba(37,99,235,0.3);">💡</div>
              </td>
              <td style="padding-left: 16px; vertical-align: top;">
                <div style="font-size: 10px; font-weight: 700; color: ${COLORS.blue}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">NEXT STEP</div>
                <div style="font-size: 16px; font-weight: 700; color: #1e3a8a; line-height: 1.5;">${lead.inference.suggested_next_action}</div>
                <div style="font-size: 12px; color: #3b82f6; margin-top: 6px; font-style: italic;">Auto-suggested by GPT-4 based on signal analysis and historical patterns</div>
              </td>
            </tr>
          </table>
        </div>
        ` : ''}

        <!-- ═══════ SECTION 6: Source Intelligence ═══════ -->
        ${lead.source_text ? `
        ${sectionHeader('📰', 'Source Intelligence', 'Original data signal that generated this lead')}
        <div style="background: ${COLORS.slate50}; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid ${COLORS.slate200}; position: relative;">
          <div style="font-size: 48px; color: ${COLORS.slate200}; position: absolute; top: 8px; left: 14px; line-height: 1;">&ldquo;</div>
          <div style="padding: 8px 12px;">
            <p style="color: ${COLORS.slate700}; margin: 0; font-size: 14px; line-height: 1.9; font-style: italic;">
              ${lead.source_text.substring(0, 600)}${lead.source_text.length > 600 ? '...' : ''}
            </p>
          </div>
          <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid ${COLORS.slate200};">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size: 12px; color: ${COLORS.slate500};">Source: <strong>${lead.source || 'Web Intelligence'}</strong></span>
                </td>
                ${lead.source_url ? `
                <td style="text-align: right;">
                  <a href="${lead.source_url}" style="color: ${COLORS.blue}; font-size: 12px; text-decoration: none; font-weight: 600;">View Original &rarr;</a>
                </td>` : ''}
              </tr>
            </table>
          </div>
        </div>
        ` : ''}

        ${divider()}

        <!-- CTA Section -->
        <div style="text-align: center; padding: 8px 0 4px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="text-align: center; padding-bottom: 16px;">
                <div style="font-size: 14px; font-weight: 600; color: ${COLORS.slate700}; margin-bottom: 4px;">Ready to engage this lead?</div>
                <div style="font-size: 12px; color: ${COLORS.slate400};">Access the full lead profile with all the details</div>
              </td>
            </tr>
            <tr>
              <td style="text-align: center;">
                <a href="${appUrl}/leads/${lead.id}" 
                   style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, ${COLORS.blueLight} 100%); color: ${COLORS.white}; padding: 16px 48px; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 6px 20px rgba(37,99,235,0.3); letter-spacing: 0.3px;">
                  View Full Lead Profile &rarr;
                </a>
              </td>
            </tr>
            <tr>
              <td style="text-align: center; padding-top: 12px;">
                <a href="${appUrl}/dashboard" style="color: ${COLORS.slate500}; text-decoration: none; font-size: 13px; font-weight: 600;">Open Dashboard</a>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Footer -->
      ${emailFooter(logoUrl, appUrl)}
    </div>

    <!-- Sub-footer -->
    ${emailSubFooter(appUrl)}
  </div>
</body>
</html>`;
}


// ─────────────────────────────────────────────────────
// GENERAL NOTIFICATION EMAIL
// Used by: notify
// ─────────────────────────────────────────────────────
export function generateNotificationEmail(notification: any, lead?: any): string {
  const appUrl = APP_URL();
  const logoUrl = `${appUrl}/images.jpg`;

  const typeColors: Record<string, { bg: string; accent: string; text: string; icon: string; gradient: string }> = {
    info:    { bg: COLORS.bluePale, accent: COLORS.blue, text: '#1e40af', icon: 'ℹ️', gradient: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.blueLight})` },
    success: { bg: COLORS.greenPale, accent: COLORS.green, text: '#065f46', icon: '✅', gradient: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.greenLight})` },
    warning: { bg: COLORS.amberPale, accent: COLORS.amber, text: '#92400e', icon: '⚠️', gradient: `linear-gradient(135deg, ${COLORS.amber}, #f59e0b)` },
    error:   { bg: COLORS.redPale, accent: COLORS.red, text: '#991b1b', icon: '🚨', gradient: `linear-gradient(135deg, ${COLORS.red}, #ef4444)` },
  };
  const tc = typeColors[notification.type] || typeColors.info;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.slate100}; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 620px; margin: 0 auto; padding: 24px 16px;">
    
    <div style="background: ${COLORS.white}; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.1); border: 1px solid ${COLORS.slate200};">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0c1220 0%, ${COLORS.primary} 40%, ${COLORS.primaryLight} 100%); padding: 32px 28px; text-align: center;">
        <img src="${logoUrl}" alt="HPCL" style="height: 40px; margin-bottom: 14px; border-radius: 10px; box-shadow: 0 3px 10px rgba(0,0,0,0.3);" />
        <h1 style="color: ${COLORS.white}; margin: 0; font-size: 18px; font-weight: 700;">Lead Intelligence Platform</h1>
        <p style="color: ${COLORS.slate400}; margin: 6px 0 0; font-size: 12px;">${formatDate()}</p>
      </div>

      <!-- Type Indicator Bar -->
      <div style="height: 4px; background: ${tc.gradient};"></div>

      <!-- Notification Card -->
      <div style="padding: 32px;">
        <div style="background: ${tc.bg}; border-radius: 16px; padding: 28px; border-left: 5px solid ${tc.accent}; margin-bottom: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align: top; width: 44px;">
                <div style="width: 40px; height: 40px; line-height: 40px; text-align: center; background: ${tc.gradient}; border-radius: 12px; font-size: 20px; box-shadow: 0 3px 8px ${tc.accent}30;">${tc.icon}</div>
              </td>
              <td style="padding-left: 16px; vertical-align: top;">
                <h2 style="color: ${tc.text}; margin: 0 0 10px; font-size: 18px; font-weight: 700; line-height: 1.3;">${notification.title}</h2>
                <p style="color: ${tc.text}; margin: 0; font-size: 14px; line-height: 1.7; opacity: 0.85;">${notification.message}</p>
              </td>
            </tr>
          </table>
        </div>

        ${lead ? `
        ${sectionHeader('🏢', 'Related Lead', 'Quick reference for the associated lead')}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border: 1px solid ${COLORS.slate200}; border-radius: 12px; overflow: hidden;">
          <tr style="background: ${COLORS.slate50};">
            <td style="padding: 12px 16px; border-bottom: 1px solid ${COLORS.slate100}; width: 120px;">
              <span style="font-size: 12px; font-weight: 600; color: ${COLORS.slate600};">🏢 Company</span>
            </td>
            <td style="padding: 12px 16px; border-bottom: 1px solid ${COLORS.slate100};">
              <span style="font-size: 14px; font-weight: 700; color: ${COLORS.slate900};">${lead.company_name}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid ${COLORS.slate100};">
              <span style="font-size: 12px; font-weight: 600; color: ${COLORS.slate600};">🏭 Industry</span>
            </td>
            <td style="padding: 12px 16px; border-bottom: 1px solid ${COLORS.slate100};">
              <span style="font-size: 14px; font-weight: 600; color: ${COLORS.slate900};">${lead.industry || 'N/A'}</span>
            </td>
          </tr>
          <tr style="background: ${COLORS.slate50};">
            <td style="padding: 12px 16px; border-bottom: 1px solid ${COLORS.slate100};">
              <span style="font-size: 12px; font-weight: 600; color: ${COLORS.slate600};">${getScoreEmoji(lead.score || 0)} Score</span>
            </td>
            <td style="padding: 12px 16px; border-bottom: 1px solid ${COLORS.slate100};">
              <span style="font-size: 14px; font-weight: 800; color: ${getScoreColor(lead.score || 0)};">${lead.score || 0}/100</span>
              <span style="font-size: 11px; color: ${COLORS.slate400}; margin-left: 4px;">${getScoreLabel(lead.score || 0)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 16px;">
              <span style="font-size: 12px; font-weight: 600; color: ${COLORS.slate600};">${getUrgencyEmoji(lead.inference?.urgency_level || 'medium')} Priority</span>
            </td>
            <td style="padding: 12px 16px;">
              <span style="display: inline-block; background: ${getUrgencyBg(lead.inference?.urgency_level || 'medium')}; color: ${getUrgencyColor(lead.inference?.urgency_level || 'medium')}; padding: 3px 14px; border-radius: 50px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
                ${lead.inference?.urgency_level || 'Medium'}
              </span>
            </td>
          </tr>
        </table>
        ` : ''}

        <div style="text-align: center;">
          <a href="${appUrl}/dashboard" 
             style="display: inline-block; background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.slate700} 100%); color: ${COLORS.white}; padding: 15px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(15,23,42,0.25); letter-spacing: 0.3px;">
            Open Dashboard &rarr;
          </a>
        </div>
      </div>

      <!-- Footer -->
      ${emailFooter(logoUrl, appUrl)}
    </div>

    <!-- Sub-footer -->
    ${emailSubFooter(appUrl)}
  </div>
</body>
</html>`;
}
