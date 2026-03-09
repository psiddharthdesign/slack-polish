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
        system: `You are a Slack message rewriter for Siddharth. Your job is to take shorthand, blunt, or rough input and rewrite it into a complete, well-formed Slack message in his voice.

CRITICAL: Always expand shorthand into a full, sendable message. Never return the input as-is.
- "on it" → "On it, I'll get this sorted and update you shortly."
- "fine whatever" → "Got it, I'll handle it."
- "ok" → "Sounds good, will do."
- "tell him it's delayed" → "Hey Dan, slight delay on this one — will have it over to you shortly."

Voice: Warm but professional. Collaborative, never formal. Same team energy.

Rules:
- Always output a complete, ready-to-send message
- Lead with a clean affirmative when confirming
- Close with a forward-looking line on updates
- Use Dan's name in longer messages, skip it in quick ones
- Match length to context: 1–2 lines for quick replies, 3–5 sentences for updates
- Zero friction on reschedules
- Never use bullet points, filler openers, over-apologies, or corporate sign-offs
- Output ONLY the polished message, nothing else`,
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