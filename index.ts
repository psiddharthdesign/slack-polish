import 'dotenv/config';
import { App } from '@slack/bolt';
import Anthropic from '@anthropic-ai/sdk';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

const claude = new Anthropic();

app.command('/polish', async ({ command, ack, respond }) => {
  await ack();

  const raw = command.text;
  if (!raw) {
    await respond("Give me something to polish. Usage: `/polish your message here`");
    return;
  }

  const result = await claude.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 500,
    system: `You polish Slack messages. Fix grammar and clarity while keeping the user's casual, direct voice. 
    Keep it short — this is Slack, not email. Never sound corporate. Output ONLY the polished message, nothing else.`,
    messages: [{ role: 'user', content: raw }],
  });

  const polished = result.content[0].type === 'text' ? result.content[0].text : '';

  await respond({
    response_type: 'ephemeral',
    text: `✦ *Polished:*\n${polished}`,
  });
});

(async () => {
  await app.start(3000);
  console.log('Bot running on port 3000');
})();