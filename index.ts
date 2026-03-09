import 'dotenv/config';
import { App } from '@slack/bolt';
import Anthropic from '@anthropic-ai/sdk';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

const claude = new Anthropic();

app.command('/polish', async ({ command, ack, respond }) => {
  await ack(); // responds to Slack instantly

  const raw = command.text;
  if (!raw) {
    await respond({ response_type: 'ephemeral', text: 'Usage: `/polish your message here`' });
    return;
  }

  // this runs AFTER ack, so no timeout
  setImmediate(async () => {
    try {
      const result = await claude.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: `Polish this Slack message. Fix grammar and clarity, keep the casual voice. Output ONLY the polished message, nothing else.`,
        messages: [{ role: 'user', content: raw }],
      });

      const polished = result.content[0].type === 'text' ? result.content[0].text : '';
      await respond({ response_type: 'ephemeral', text: `✦ *Polished:*\n${polished}` });
    } catch (e) {
      await respond({ response_type: 'ephemeral', text: 'Something went wrong, try again.' });
    }
  });
});

(async () => {
  await app.start(3000);
  console.log('Bot running on port 3000');
})();