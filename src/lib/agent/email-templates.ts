export interface EmailTemplate {
  id: string;
  subject: string;
  sequenceStep: number;
  html: (vars: { name: string; contactName?: string }) => string;
  text: (vars: { name: string; contactName?: string }) => string;
}

const greeting = (vars: { name: string; contactName?: string }) =>
  vars.contactName ? `Hi ${vars.contactName}` : `Hi there`;

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'cold_outreach_1',
    sequenceStep: 1,
    subject: 'Get your free website & accept online orders — Bricks',
    html: (vars) => `
<p>${greeting(vars)},</p>
<p>We came across <strong>${vars.name}</strong> and wanted to reach out. Bricks helps Detroit food vendors like you get a free professional website and start accepting orders online — no monthly fees, no technical setup required.</p>
<p>We handle everything: the site, the payments, and the crypto-backed loyalty program your customers will love.</p>
<p>Interested in a free demo? Just reply to this email or book a 15-minute call.</p>
<p>Best,<br>The Bricks Team</p>
`,
    text: (vars) => `${greeting(vars)},

We came across ${vars.name} and wanted to reach out. Bricks helps Detroit food vendors like you get a free professional website and start accepting orders online — no monthly fees, no technical setup required.

We handle everything: the site, the payments, and the crypto-backed loyalty program your customers will love.

Interested in a free demo? Just reply to this email or book a 15-minute call.

Best,
The Bricks Team`,
  },
  {
    id: 'follow_up_1',
    sequenceStep: 2,
    subject: 'Following up — free website for ${vars.name}',
    html: (vars) => `
<p>${greeting(vars)},</p>
<p>Just following up on our last note about getting <strong>${vars.name}</strong> set up with a free website on Bricks.</p>
<p>We recently launched sites for several Detroit food vendors and they're already seeing more orders. We'd love to do the same for you — completely free to start.</p>
<p>Any questions? Hit reply and I'll answer them personally.</p>
<p>Best,<br>The Bricks Team</p>
`,
    text: (vars) => `${greeting(vars)},

Just following up on our last note about getting ${vars.name} set up with a free website on Bricks.

We recently launched sites for several Detroit food vendors and they're already seeing more orders. We'd love to do the same for you — completely free to start.

Any questions? Hit reply and I'll answer them personally.

Best,
The Bricks Team`,
  },
  {
    id: 'follow_up_2',
    sequenceStep: 3,
    subject: 'Last note — your free Bricks site',
    html: (vars) => `
<p>${greeting(vars)},</p>
<p>This is our last follow-up regarding a free website for <strong>${vars.name}</strong> on the Bricks platform.</p>
<p>If you're not interested right now, no worries — just let us know and we won't reach out again. But if timing is an issue, we're happy to connect whenever works best for you.</p>
<p>Best,<br>The Bricks Team</p>
`,
    text: (vars) => `${greeting(vars)},

This is our last follow-up regarding a free website for ${vars.name} on the Bricks platform.

If you're not interested right now, no worries — just let us know and we won't reach out again. But if timing is an issue, we're happy to connect whenever works best for you.

Best,
The Bricks Team`,
  },
];

export function getTemplate(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find(t => t.id === id);
}

export function getTemplateByStep(step: number): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find(t => t.sequenceStep === step);
}
