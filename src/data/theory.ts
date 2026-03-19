/**
 * theory.ts
 * Static content for the in-game theory reference accordion.
 */

export interface TheoryEntry {
  heading: string;
  body:    string;
}

export const THEORY_ENTRIES: TheoryEntry[] = [
  {
    heading: "Functional dependency (FD)",
    body:
      "X → Y holds when knowing X uniquely determines Y. " +
      "For any two tuples with equal X-values, their Y-values must also be equal.",
  },
  {
    heading: "Attribute closure X⁺",
    body:
      "Start with X⁺ = X. Repeatedly: if A → B and A ⊆ X⁺, add B to X⁺. " +
      "Stop when nothing changes. X is a superkey iff X⁺ = all attributes.",
  },
  {
    heading: "Candidate key",
    body:
      "K is a superkey if K⁺ = U (all attributes). " +
      "K is a candidate key if it is a superkey and no proper subset of K " +
      "is also a superkey — i.e. it satisfies minimality.",
  },
  {
    heading: "Armstrong's axioms",
    body:
      "Reflexivity: Y ⊆ X ⇒ X → Y. " +
      "Augmentation: X → Y ⇒ XZ → YZ. " +
      "Transitivity: X → Y ∧ Y → Z ⇒ X → Z. " +
      "These three axioms are sound and complete.",
  },
  {
    heading: "Difficulty levels",
    body:
      "Easy: 3–4 attrs, 2–3 FDs, exactly 1 key. " +
      "Medium: 4–5 attrs, 3–4 FDs, 1–2 keys. " +
      "Hard: 5–6 attrs, 4–6 FDs, 2–4 keys. " +
      "Expert: 6–7 attrs, 5–8 FDs, 3+ keys with multi-attribute LHS/RHS.",
  },
];
