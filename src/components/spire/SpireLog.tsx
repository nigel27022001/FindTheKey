import { useRef, useEffect } from "react";
import type { ReactNode } from "react";

interface SpireLogProps {
  battleLog: string[];
}

export function SpireLog({ battleLog }: SpireLogProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [battleLog]);

  const colorizeLog = (text: string): ReactNode => {
    const rules: { pattern: RegExp, className: string }[] = [
      { pattern: /(\d+)\s*(dmg|damage)/gi, className: "text-red-600 font-bold" },
      { pattern: /(-\d+\s*(?:HP|Gold))/gi, className: "text-red-600 font-bold" },
      { pattern: /(\+\d+\s*(?:HP|Max HP))/gi, className: "text-green-600 font-bold" },
      { pattern: /(Fully Healed|fully healed)/g, className: "text-green-600 font-bold" },
      { pattern: /(\+?\d+\s*[Gg]old)/g, className: "text-yellow-600 font-bold" },
      { pattern: /(-\d+\s*[Gg]old)/g, className: "text-yellow-600 font-bold" },
      { pattern: /(Cave Rat|Corrosive Slime|Giant Beetle|Lost Skeleton|Phantom|Fire Elemental|Mercenary|The Corrupted King|Iron Golem|Ancient Lich)/g, className: "text-red-500 font-semibold" },
      { pattern: /(Solved!|Victory|defeated!?)/gi, className: "text-emerald-600 font-bold" },
      { pattern: /(Enemy defeated\.)/g, className: "text-emerald-600 font-bold" },
      { pattern: /(Hint Potion|Closure Potion|Skip Potion|Heart Container|Alchemist's Stash)/g, className: "text-purple-600 font-semibold" },
      { pattern: /(Wrong answer!)/g, className: "text-red-600 font-bold" },
      { pattern: /(ambush|spiked trap)/gi, className: "text-red-500 font-semibold" },
      { pattern: /(Enemy intent:)/g, className: "text-orange-600 font-semibold" },
      { pattern: /(MINION|ELITE|BOSS|MYSTERY|TREASURE|REST|SHOP)/g, className: "text-indigo-600 font-semibold" },
    ];

    const dashIdx = text.indexOf(" - ");
    if (dashIdx === -1) return text;
    const timestamp = text.slice(0, dashIdx);
    let message = text.slice(dashIdx + 3);

    type Fragment = { text: string, className?: string };
    let fragments: Fragment[] = [{ text: message }];

    for (const rule of rules) {
      const next: Fragment[] = [];
      for (const frag of fragments) {
        if (frag.className) { next.push(frag); continue; }
        let last = 0;
        const str = frag.text;
        for (const m of str.matchAll(new RegExp(rule.pattern))) {
          if (m.index! > last) next.push({ text: str.slice(last, m.index!) });
          next.push({ text: m[0], className: rule.className });
          last = m.index! + m[0].length;
        }
        if (last < str.length) next.push({ text: str.slice(last) });
      }
      fragments = next;
    }

    return (
      <>
        <span className="text-gray-400">{timestamp}</span>
        <span className="text-gray-400"> - </span>
        {fragments.map((f, i) =>
          f.className
            ? <span key={i} className={f.className}>{f.text}</span>
            : <span key={i}>{f.text}</span>
        )}
      </>
    );
  };

  return (
    <div className="w-80 border-l border-gray-300 bg-gray-100 p-4 flex flex-col">
      <h2 className="text-lg font-bold mb-3 text-gray-900">📜 Battle Log</h2>
      <div ref={logRef} className="flex-1 overflow-y-auto text-sm space-y-2">
        {battleLog.map((entry, i) => (
          <div key={i} className="text-gray-800 border-b border-gray-200 pb-1">
            {colorizeLog(entry)}
          </div>
        ))}
      </div>
    </div>
  );
}
