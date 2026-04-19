const COLORS = [
  '#006D77', '#00C9D4', '#0E8C8C', '#005F6B',
  '#2A9D8F', '#48CAE4', '#0077B6', '#00B4D8',
]

const EMOJIS = [
  '🦁', '🐯', '🦊', '🐺', '🦅', '🐉', '🦄', '🦋',
  '🌊', '⚡', '🔥', '💎', '🚀', '🌟', '🏆', '💪',
  '🥊', '🎯', '🦸', '🐬', '🦝', '🐻', '🦖', '🌋',
]

function nameHash(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export function avatarColor(name: string): string {
  return COLORS[nameHash(name) % COLORS.length]
}

export function avatarEmoji(name: string): string {
  return EMOJIS[nameHash(name) % EMOJIS.length]
}

export function avatarInitials(name: string): string {
  return name
    .trim()
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
