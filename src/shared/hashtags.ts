export function extractHashtags(text: string): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();
  const pattern = /#([A-Za-z0-9_ğüşıöçĞÜŞİÖÇ]+)/g;
  let match = pattern.exec(text);
  while (match) {
    const tag = match[1]?.toLocaleLowerCase('tr-TR');
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
    match = pattern.exec(text);
  }
  return tags;
}

export function countHashtags(texts: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const text of texts) {
    for (const tag of extractHashtags(text)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}
