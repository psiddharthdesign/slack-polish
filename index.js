"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bolt_1 = require("@slack/bolt");
const sdk_1 = require("@anthropic-ai/sdk");
const app = new bolt_1.App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
});
const claude = new sdk_1.default();
app.command('/polish', async ({ command, ack, respond }) => {
    await ack(); // responds to Slack instantly
    const raw = command.text;
    if (!raw) {
        await respond({ response_type: 'ephemeral', text: 'Usage: `/polish your message here`' });
        return;
    }
    // this runs AFTER ack, so no timeout
    setImmediate(async () => {
        var _a;
        try {
            const result = await claude.messages.create({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 300,
                system: `Polish this Slack message. Fix grammar and clarity, keep the casual voice. Output ONLY the polished message, nothing else.`,
                messages: [{ role: 'user', content: raw }],
            });
            const polished = (_a = result.content[0].text) !== null && _a !== void 0 ? _a : '';
            await respond({ response_type: 'ephemeral', text: `✦ *Polished:*\n${polished}` });
        }
        catch (e) {
            await respond({ response_type: 'ephemeral', text: 'Something went wrong, try again.' });
        }
    });
});
(async () => {
    await app.start(3000);
    console.log('Bot running on port 3000');
})();
//# sourceMappingURL=index.js.map