export async function detectResourceOrigins(): Promise<string[]> {
  const originsSet = new Set([
    window.location.toString(),
    ...performance
      .getEntriesByType('resource')
      .filter(r => !!r.name)
      .map(r => new URL(r.name).origin),
  ]);
  return Array.from(originsSet);
}
