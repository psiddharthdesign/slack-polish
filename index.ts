import 'dotenv/config';
import { App } from '@slack/bolt';
import Anthropic from '@anthropic-ai/sdk';

console.log('Starting app...');
console.log('SLACK_BOT_TOKEN set:', !!process.env.SLACK_BOT_TOKEN);
console.log('SLACK_SIGNING_SECRET set:', !!process.env.SLACK_SIGNING_SECRET);
console.log('ANTHROPIC_API_KEY set:', !!process.env.ANTHROPIC_API_KEY);

const app = new App({
  token: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

const claude = new Anthropic();

app.command('/polish', async ({ command, ack, respond }) => {
  console.log('Command received:', command.text);
  await ack();
  console.log('Ack sent');

  const raw = command.text;
  if (!raw) {
    await respond({ response_type: 'ephemeral', text: 'Usage: `/polish your message here`' });
    return;
  }

  setImmediate(async () => {
    try {
      console.log('Calling Claude API...');
      const result = await claude.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: `Siddharth's Slack Style with DanTone
Warm but professional. Collaborative, never formal. Think reliable colleague, not vendor. Same team energy.Input translation
If the input is shorthand, blunt, or rash — understand the intent, smooth the tone, and deliver it in Siddharth's natural voice. Don't over-polish. Just enough to sound like him on a good day.
"just get this done" → "On it, I'll take care of it."
"fine whatever" → "Got it, I'll handle it."
"tell him it's delayed" → "Hey Dan, slight delay on this — will have it to you shortly."Length
Match the energy of what you're replying to. Quick reply or confirmation? 1–2 lines. Progress update or schedule change? 3–5 sentences max. Never pad.Dan's name
Use it in longer messages or when opening a new topic. Drop it in quick one-liners — it adds unnecessary weight.Confirmations
Lead with a clean affirmative first, then follow with action. "Got it.", "Sure!", "On it." — never bury the acknowledgement.Progress updates
What's done → what's next. Always close with a forward-looking line. Never leave a message open-ended.Rescheduling
Zero friction. If you're moving something: "If it's okay with you, could we push by an hour?" If Dan cancels: one line, no pressure. "No worries, safe travels."Sharing work
State what's ready, then caveats or next steps. Name specific deliverables (icons, Lottie, SVGs). Factual, not performative.Never:

- Bullet points or headers in a DM
- Filler openers ("Hope you're well", "Just checking in")
- Over-apologizing or hedging
- Long paragraphs for simple status replies
- Corporate sign-offs`,
        messages: [{ role: 'user', content: raw }],
      });

      console.log('Claude response received:', JSON.stringify(result.content));
      const polished = (result.content[0] as { type: string; text: string }).text ?? '';
      await respond({ response_type: 'ephemeral', text: `✦ *Polished:*\n${polished}` });
      console.log('Response sent to Slack');
    } catch (e: any) {
      console.error('Claude error name:', e?.name);
      console.error('Claude error message:', e?.message);
      console.error('Claude error status:', e?.status);
      console.error('Claude error full:', JSON.stringify(e, Object.getOwnPropertyNames(e)));
      await respond({ response_type: 'ephemeral', text: 'Something went wrong, try again.' });
    }
  });
});

(async () => {
  await app.start(3000);
  console.log('Bot running on port 3000');
})();