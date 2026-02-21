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
    subject: 'Free website + Detroit neighborhood campaign — Pizza Bricks',
    html: (vars) => `
<p>${greeting(vars)},</p>

<p>I'm reaching out from <strong>Pizza Bricks</strong> — a Detroit community initiative that pairs local food vendors with a neighborhood marketing campaign and a free AI-generated website.</p>

<p>Here's how it works for <strong>${vars.name}</strong>:</p>
<ol>
  <li>Our community bot builds you a free, fully deployed professional website — live within 24 hours.</li>
  <li>Your business gets featured in the <strong>Pizza Bricks community game</strong>, which drives Detroit residents to discover and visit participating local spots.</li>
  <li>We run a local marketing campaign on your behalf: neighborhood promos, digital assets, and social content — at no cost to you.</li>
</ol>

<p>No fees, no technical setup, no catch. We're building this community together.</p>

<p>Interested? Just reply and we'll send over a preview of what your site would look like, or we can jump on a quick 10-minute call.</p>

<p>Best,<br>
The Pizza Bricks Team<br>
<a href="https://builddetroit.xyz">builddetroit.xyz</a></p>
`,
    text: (vars) => `${greeting(vars)},

I'm reaching out from Pizza Bricks — a Detroit community initiative that pairs local food vendors with a neighborhood marketing campaign and a free AI-generated website.

Here's how it works for ${vars.name}:

1. Our community bot builds you a free, fully deployed professional website — live within 24 hours.
2. Your business gets featured in the Pizza Bricks community game, which drives Detroit residents to discover and visit participating local spots.
3. We run a local marketing campaign on your behalf: neighborhood promos, digital assets, and social content — at no cost to you.

No fees, no technical setup, no catch. We're building this community together.

Interested? Just reply and we'll send over a preview of what your site would look like, or we can jump on a quick 10-minute call.

Best,
The Pizza Bricks Team
builddetroit.xyz`,
  },
  {
    id: 'follow_up_1',
    sequenceStep: 2,
    subject: 'Following up — free site + Detroit campaign',
    html: (vars) => `
<p>${greeting(vars)},</p>

<p>Wanted to follow up on our note about the free website and Detroit neighborhood campaign for <strong>${vars.name}</strong> through Pizza Bricks.</p>

<p>We've launched sites for several Detroit food vendors this month and they're already seeing more foot traffic from the community game and local campaign. The whole thing takes about 24 hours from a yes to going live.</p>

<p>If you have any questions about how it works, or want us to just go ahead and show you a draft of your site, just hit reply — happy to make it easy.</p>

<p>Best,<br>
The Pizza Bricks Team</p>
`,
    text: (vars) => `${greeting(vars)},

Wanted to follow up on our note about the free website and Detroit neighborhood campaign for ${vars.name} through Pizza Bricks.

We've launched sites for several Detroit food vendors this month and they're already seeing more foot traffic from the community game and local campaign. The whole thing takes about 24 hours from a yes to going live.

If you have any questions about how it works, or want us to just go ahead and show you a draft of your site, just hit reply — happy to make it easy.

Best,
The Pizza Bricks Team`,
  },
  {
    id: 'follow_up_2',
    sequenceStep: 3,
    subject: 'Last note — Pizza Bricks campaign for your business',
    html: (vars) => `
<p>${greeting(vars)},</p>

<p>This is our last follow-up about the free Pizza Bricks website and local marketing campaign for <strong>${vars.name}</strong>.</p>

<p>If now isn't the right time, no problem — just reply and let us know, and we won't reach out again. We'll be onboarding the next batch of Detroit vendors in a few weeks if you'd like to revisit then.</p>

<p>Either way, we appreciate what you're doing for the Detroit food scene.</p>

<p>Best,<br>
The Pizza Bricks Team</p>
`,
    text: (vars) => `${greeting(vars)},

This is our last follow-up about the free Pizza Bricks website and local marketing campaign for ${vars.name}.

If now isn't the right time, no problem — just reply and let us know, and we won't reach out again. We'll be onboarding the next batch of Detroit vendors in a few weeks if you'd like to revisit then.

Either way, we appreciate what you're doing for the Detroit food scene.

Best,
The Pizza Bricks Team`,
  },
];

export function getTemplate(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find(t => t.id === id);
}

export function getTemplateByStep(step: number): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find(t => t.sequenceStep === step);
}
