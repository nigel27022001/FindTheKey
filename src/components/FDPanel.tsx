/**
 * FDPanel.tsx
 * List of functional dependencies with optional highlighting.
 */

import type { FC } from "react";
import type { FD } from "../lib/fdAlgorithms";
import { FDRow, SectionLabel } from "./ui";

interface FDPanelProps {
  fds:            FD[];
  highlightedFDs: boolean[];
}

export const FDPanel: FC<FDPanelProps> = ({ fds, highlightedFDs }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 mb-3 shadow-sm">
    <SectionLabel>Functional dependencies</SectionLabel>
    {fds.map((fd, i) => (
      <FDRow key={i} fd={fd} highlighted={highlightedFDs[i] ?? false} />
    ))}
  </div>
);
