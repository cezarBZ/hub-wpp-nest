import { WAMessage } from 'baileys';

export function extractQuotedMessage(msg: WAMessage) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  const quoted = ctx?.quotedMessage;

  if (!quoted) return undefined;

  const type = Object.keys(quoted)[0];
  const text =
    quoted?.conversation || quoted?.extendedTextMessage?.text || undefined;

  const sentByMe = msg.key.remoteJid === ctx.participant;

  return {
    type,
    text,
    from: ctx.participant,
    fromMe: sentByMe,
  };
}
