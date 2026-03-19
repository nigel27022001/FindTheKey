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
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-3">
    <SectionLabel>Functional dependencies</SectionLabel>
    {fds.map((fd, i) => (
      <FDRow key={i} fd={fd} highlighted={highlightedFDs[i] ?? false} />
    ))}
  </div>
);
