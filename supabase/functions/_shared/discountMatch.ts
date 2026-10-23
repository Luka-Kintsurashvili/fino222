// Deterministic matching between a user's own spending history and the stores ekalata tracks —
// pure pattern matching over real transaction notes, no LLM guessing. The model never decides
// which stores a user "frequents"; this does, from what they actually spent money on.

export interface StoreDirectoryEntry {
  slug: string;
  name_ka: string;
  name_en: string;
}

export interface FrequentStore {
  storeSlug: string;
  storeNameKa: string;
  storeNameEn: string;
  visitCount: number;
  totalSpent: number;
}

export function detectFrequentStores(
  expenses: { note: string; amount: number }[],
  knownStores: StoreDirectoryEntry[]
): FrequentStore[] {
  const byNameEn = knownStores
    .map((s) => ({ ...s, nameEnLower: s.name_en.toLowerCase() }))
    .sort((a, b) => b.nameEnLower.length - a.nameEnLower.length); // longest match first, avoids short-name false positives

  const map = new Map<string, FrequentStore>();

  for (const e of expenses) {
    const noteLower = e.note.trim().toLowerCase();
    if (!noteLower) continue;
    const match = byNameEn.find((s) => noteLower === s.nameEnLower || noteLower.includes(s.nameEnLower));
    if (!match) continue;

    const existing = map.get(match.slug) ?? {
      storeSlug: match.slug,
      storeNameKa: match.name_ka,
      storeNameEn: match.name_en,
      visitCount: 0,
      totalSpent: 0,
    };
    existing.visitCount += 1;
    existing.totalSpent += e.amount;
    map.set(match.slug, existing);
  }

  return [...map.values()].sort((a, b) => b.visitCount - a.visitCount || b.totalSpent - a.totalSpent);
}
