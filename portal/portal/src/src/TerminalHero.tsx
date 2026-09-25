import { useEffect, useState } from 'react';

const LINES = [
  "pramod@sapkotap:~$ whoami",
  "root (Pramod Sapkota Security Core)",
  "pramod@sapkotap:~$ cat status.txt",
  "System: ONLINE [256-bit AES]",
  "Access: Protected by Supabase Auth",
  "Threat Engine: Active Monitoring",
  "pramod@sapkotap:~$ _"
];

export function TerminalHero() {
  const [displayedText, setDisplayedText] = useState<string[]>([]);
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    if (lineIdx < LINES.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => [...prev, LINES[lineIdx]]);
        setLineIdx((prev) => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [lineIdx]);

  return (
    <div className="terminal-box">
      <div className="terminal-header">
        <span className="term-dot red"></span>
        <span className="term-dot yellow"></span>
        <span className="term-dot green"></span>
        <span className="term-title">bash - 80x24</span>
      </div>
      <div className="terminal-body">
        {displayedText.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
        {lineIdx < LINES.length && <span className="terminal-cursor" />}
      </div>
    </div>
  );
}
