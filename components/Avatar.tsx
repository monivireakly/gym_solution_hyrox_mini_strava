'use client'

import { avatarColor, avatarEmoji } from '@/lib/avatar'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'w-8 h-8 text-base',
  md: 'w-12 h-12 text-xl',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-24 h-24 text-4xl',
}

export default function Avatar({ name, size = 'md' }: AvatarProps) {
  const color = avatarColor(name)
  const emoji = avatarEmoji(name)

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0 select-none`}
      style={{
        backgroundColor: color,
        boxShadow: `0 4px 16px ${color}55`,
      }}
    >
      {emoji}
    </div>
  )
}
