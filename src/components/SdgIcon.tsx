import { useState } from 'react'
import { SDG_DATA } from '../data/sdgs'

interface SdgIconProps {
  n: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function SdgIcon({ n, size = 'md', className = '' }: SdgIconProps) {
  const [failed, setFailed] = useState(false)
  const sdg = SDG_DATA.find(s => s.n === n)
  if (!sdg) return null

  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-12 h-12 text-[14px]',
    lg: 'w-24 h-24 text-[24px]'
  }

  const lines = sdg.label.split('\n')

  if (!failed) {
    return (
      <img
        src={sdg.imgUrl}
        alt={sdg.fullLabel}
        title={sdg.fullLabel}
        onError={() => setFailed(true)}
        className={`object-cover rounded-lg shadow-sm ${sizeClasses[size]} ${className}`}
        loading="lazy"
      />
    )
  }

  return (
    <div 
      className={`relative rounded-lg overflow-hidden flex flex-col justify-between p-1 text-white shadow-sm transition-all ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: sdg.color }}
      title={sdg.fullLabel}
    >
      <div className="flex items-start gap-0.5 leading-none">
        <span className="font-black" style={{ fontSize: size === 'sm' ? '12px' : size === 'md' ? '18px' : '32px' }}>{sdg.n}</span>
        <div className="flex flex-col opacity-90 overflow-hidden" style={{ fontSize: size === 'sm' ? '3px' : size === 'md' ? '5px' : '10px' }}>
          {lines.map((line, i) => (
            <span key={i} className="font-bold uppercase leading-tight tracking-tighter whitespace-nowrap">{line}</span>
          ))}
        </div>
      </div>
      <div className="text-right self-end opacity-90" style={{ fontSize: size === 'sm' ? '14px' : size === 'md' ? '22px' : '44px' }}>
        {sdg.icon}
      </div>
    </div>
  )
}
