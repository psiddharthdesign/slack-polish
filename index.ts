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
        system: `Polish this Slack message. Fix grammar and clarity, keep the casual voice. Output ONLY the polished message, nothing else.`,
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