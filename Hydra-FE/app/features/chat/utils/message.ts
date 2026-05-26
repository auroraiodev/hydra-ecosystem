import React from 'react';

/**
 * Detects an active @"..." query before the cursor.
 * Only the quoted syntax is supported — typing @ auto-inserts "".
 */
export function getAtQuery(value: string, cursorPos: number): string | null {
  const before = value.slice(0, cursorPos);
  const quotedMatch = before.match(/@"([^"]*)"?$/);
  return quotedMatch ? quotedMatch[1] : null;
}

/** Replaces the @"..." block before the cursor with a card token */
export function replaceAtQuery(value: string, cursorPos: number, token: string): string {
  const before = value.slice(0, cursorPos);
  const after = value.slice(cursorPos);
  const replaced = before.replace(/@"[^"]*"?$/, token + ' ');
  if (replaced !== before) {
    const cleanAfter = after.startsWith('"') ? after.slice(1) : after;
    return replaced + cleanAfter;
  }
  return before + after;
}

const MD_LINK = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

function renderTextWithLinks(text: string, dark: boolean) {
  const linkClass = dark
    ? 'underline text-blue-300 hover:text-blue-100'
    : 'underline text-blue-600 hover:text-blue-800';
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  MD_LINK.lastIndex = 0;
  while ((match = MD_LINK.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      React.createElement(
        'a',
        {
          key: match.index,
          href: match[2],
          target: '_blank',
          rel: 'noopener noreferrer',
          className: linkClass,
        },
        match[1]
      )
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function TextWithLinks({ text, dark }: { text: string; dark: boolean }) {
  return React.createElement('span', null, ...renderTextWithLinks(text, dark));
}

export function formatCardToken(name: string, imageUrl: string): string {
  return `[[card:${name}||${imageUrl}]]`;
}

export function parseMessageContent(
  content: string
): Array<{ type: 'text'; value: string } | { type: 'card'; name: string; imageUrl: string }> {
  const parts: Array<
    { type: 'text'; value: string } | { type: 'card'; name: string; imageUrl: string }
  > = [];
  const regex = /\[\[card:(.+?)\|\|(.+?)\]\]/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > last) parts.push({ type: 'text', value: content.slice(last, match.index) });
    parts.push({ type: 'card', name: match[1], imageUrl: match[2] });
    last = match.index + match[0].length;
  }
  if (last < content.length) parts.push({ type: 'text', value: content.slice(last) });
  return parts;
}
