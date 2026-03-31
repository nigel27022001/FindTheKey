import React from "react";
import { Bug, Ghost, Crown, Gem, CircleHelp, Tent, Store, Scroll } from "lucide-react";
import type { SpireNode } from "../../lib/spireMap";

interface SpireMapProps {
  map: SpireNode[][];
  currentNode: SpireNode | null;
  onNodeClick: (node: SpireNode) => void;
}

export function SpireMap({ map, currentNode, onNodeClick }: SpireMapProps) {
  if (currentNode) return null;

  return (
    <div className="max-w-2xl w-full mx-auto flex flex-col items-center">
      <h2 className="text-xl font-extrabold text-center text-slate-800 mb-2 flex items-center justify-center gap-2">
        <Scroll size={22} className="text-indigo-600" />
        Spire of FDs
      </h2>
      <div className="text-xs text-slate-600 text-center px-2 space-y-2 leading-relaxed mb-4">
        <p className="italic font-medium text-indigo-700">"The Great Schemas have shattered. Anomalies ravage the once-pristine tables."</p>
        <p>As a rogue <span className="font-bold text-blue-600">Data Knight</span>, ascend the Spire to restore <strong>BCNF</strong>!</p>
      </div>
      <div className="text-lg text-gray-500 mb-4 font-bold">Select a room to proceed</div>

      <div className="relative w-full shrink-0" style={{ minHeight: `${map.length * 90 + 50}px` }}>
        {/* PATHS SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
          {map.flatMap((layer, lIdx) =>
            layer.flatMap(node =>
              node.nextIds.map(nextId => {
                const nextNode = map[lIdx + 1]?.find(n => n.id === nextId);
                if (!nextNode) return null;

                const isAvailable = node.status === 'completed' || node.status === 'current';
                const isNextAvailable = isAvailable && (nextNode.status === 'available' || nextNode.status === 'current' || nextNode.status === 'completed');
                const strokeColor = isNextAvailable ? '#4ade80' : '#e2e8f0';
                const strokeWidth = isNextAvailable ? 4 : 3;
                const opacity = (nextNode.status === 'locked' && !isNextAvailable) ? 0.6 : 1;

                const y1 = (map.length - 1 - node.layer) * 90 + 45;
                const x1 = `${node.x * 100}%`;
                const y2 = (map.length - 1 - nextNode.layer) * 90 + 45;
                const x2 = `${nextNode.x * 100}%`;

                return (
                  <line
                    key={`${node.id}-${nextId}`}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={opacity}
                    strokeDasharray={isNextAvailable ? "none" : "4 4"}
                  />
                );
              })
            )
          )}
        </svg>

        {/* NODES */}
        {map.map((layer) =>
          layer.map(node => {
            const theme = {
              minion: { border: "border-slate-500", bg: "bg-slate-200", shadow: "shadow-slate-300" },
              elite: { border: "border-red-500", bg: "bg-red-100", shadow: "shadow-red-300" },
              boss: { border: "border-purple-600", bg: "bg-purple-200", shadow: "shadow-purple-300" },
              treasure: { border: "border-yellow-500", bg: "bg-yellow-100", shadow: "shadow-yellow-300" },
              mystery: { border: "border-blue-500", bg: "bg-blue-100", shadow: "shadow-blue-300" },
              rest: { border: "border-green-500", bg: "bg-green-100", shadow: "shadow-green-300" },
              shop: { border: "border-amber-600", bg: "bg-amber-100", shadow: "shadow-amber-300" }
            }[node.type as string] || { border: "border-gray-400", bg: "bg-white", shadow: "shadow-gray-300" };

            const isAvailable = node.status === "available" || node.status === "current";
            const isCompleted = node.status === "completed";

            const statusClasses = isAvailable
              ? `${theme.border} ${theme.bg} shadow-lg ${theme.shadow} ${node.status === "current" ? "ring-4 ring-green-400 scale-110" : ""}`
              : isCompleted
                ? `${theme.border} bg-gray-200 opacity-50`
                : `border-gray-300 bg-gray-50 opacity-50 grayscale`;

            return (
              <div
                key={node.id}
                onClick={() => onNodeClick(node)}
                className={`absolute w-12 h-12 -ml-6 -mt-6 flex items-center justify-center rounded-full border-2 cursor-pointer transition-all hover:scale-110 z-10 ${statusClasses}`}
                style={{
                  left: `${node.x * 100}%`,
                  top: `${(map.length - 1 - node.layer) * 90 + 45}px`
                }}
              >
                {node.type === "minion" && <Bug size={24} className="text-gray-700" />}
                {node.type === "elite" && <Ghost size={24} className="text-red-700" />}
                {node.type === "boss" && <Crown size={28} className="text-purple-700" />}
                {node.type === "treasure" && <Gem size={24} className="text-blue-500" />}
                {node.type === "mystery" && <CircleHelp size={24} className="text-green-600" />}
                {node.type === "rest" && <Tent size={24} className="text-orange-600" />}
                {node.type === "shop" && <Store size={24} className="text-amber-700" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
