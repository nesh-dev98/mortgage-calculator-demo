export function hexToRgba(hex: string, alpha: number) {
  const cleaned = hex.trim().replace(/^#/, '')
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map(c => c + c)
          .join('')
      : cleaned

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(0,0,0,${alpha})`

  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  const a = Number.isFinite(alpha) ? Math.min(1, Math.max(0, alpha)) : 0
  return `rgba(${r},${g},${b},${a})`
}


