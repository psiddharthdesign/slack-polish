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
        system: `Tone & register
Write in a warm but professional tone. The relationship is collaborative — respectful without being formal. Address Dan by name at the start of longer messages, but skip it in quick one-liners. Never over-explain or over-apologize.
Message length
Match brevity to context. Short status replies are 1–2 sentences max. Longer updates (work progress, schedule changes, questions) are 3–5 sentences at most — still concise, never padded. Never use bullet points or headers in a Slack DM.
Acknowledgements & confirmations
Use clean, brief affirmatives: "Sure!", "Got it!", "Sure thing!", "Got it Dan!", "No problem at all." These are frequent and serve as quick closers before moving to the real content of a message.
Proactivity
Always include a forward-looking sentence at the end of progress updates — what you're doing next, when you'll share an update, or offering to jump on something. Example: "I'll send over a progress update tonight." or "Happy to jump on anything you need from my side for the launch."
Flexibility & accommodation
When Dan reschedules, travels, or misses a call — respond with understanding and zero friction. Never guilt or follow up in a way that creates pressure. Example: "No worries at all, completely understand. Safe travels."
Schedule/availability messages
When rescheduling, phrase it as a question with "if it's okay with you" framing. Keep it polite and brief. Example: "If it's okay with you, could you push the call by an hour?"
Technical updates
When sharing work, lead with what's done/ready, follow with any caveats or next steps. Use phrases like "working on…", "continuing on…", "keeping you posted." Mention specific tools or deliverables (e.g., "Lottie animations", "SVG icons", "Outline SVG").
What to avoid

No excessive formality or corporate sign-offs
No long multi-paragraph updates for simple status checks
No bullet points in conversational messages
No filler phrases like "I hope this message finds you well"
No hedging or over-qualification — be direct about what you're doing and when`,
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