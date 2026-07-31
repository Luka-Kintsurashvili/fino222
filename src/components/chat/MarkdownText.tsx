import type { ReactNode } from "react";

const NUMBERED_RE = /^\d+\.\s+/;
const BULLET_RE = /^[-•]\s+/;

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

/** Minimal markdown renderer for chat bubbles: bold, numbered lists, bullet lists, paragraphs. */
export function MarkdownText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);

  return (
    <div className="space-y-2">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter((l) => l.trim().length > 0);

        if (lines.length > 0 && lines.every((l) => NUMBERED_RE.test(l))) {
          return (
            <ol key={bi} className="list-decimal space-y-1 pl-5">
              {lines.map((l, li) => (
                <li key={li}>{parseInline(l.replace(NUMBERED_RE, ""), `${bi}-${li}`)}</li>
              ))}
            </ol>
          );
        }

        if (lines.length > 0 && lines.every((l) => BULLET_RE.test(l))) {
          return (
            <ul key={bi} className="list-disc space-y-1 pl-5">
              {lines.map((l, li) => (
                <li key={li}>{parseInline(l.replace(BULLET_RE, ""), `${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={bi} className="whitespace-pre-wrap">
            {parseInline(block, `${bi}`)}
          </p>
        );
      })}
    </div>
  );
}
