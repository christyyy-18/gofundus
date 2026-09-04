// Curated warm tile colors that harmonize with the brand palette in
// tokens.css (--color-primary: #cf9c5d, --color-accent: #234d45) — used
// as the background behind the GoFundUs logo when an institution has no
// uploaded photo, so cards don't all look identical.
const PLACEHOLDER_TILE_COLORS = [
  '#f3e4c8', // soft gold
  '#e8d5cf', // soft dusty rose
  '#f0d9c8', // soft terracotta
  '#ede1cf', // soft cream-tan
  '#e3d3cd', // soft clay
];

export function getPlaceholderTileColor(seed) {
  const str = String(seed || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash + str.charCodeAt(i)) % PLACEHOLDER_TILE_COLORS.length;
  }
  return PLACEHOLDER_TILE_COLORS[hash];
}
