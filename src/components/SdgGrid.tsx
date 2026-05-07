import { SDG_DATA } from '../data/sdgs'
import SdgIcon from './SdgIcon'

interface Props {
  selected: number[]
  onToggle: (sdg: number) => void
}

function SdgTile({ sdg, isSelected, onToggle }: {
  sdg: typeof SDG_DATA[0]
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onToggle}
        title={`ODS ${sdg.n} — ${sdg.fullLabel}`}
        className={`w-full aspect-square rounded-xl overflow-hidden transition transform hover:scale-105 ${
          isSelected
            ? 'ring-4 ring-blue-500 ring-offset-2 shadow-xl scale-105'
            : 'opacity-85 hover:opacity-100 shadow-md'
        }`}
      >
        <SdgIcon n={sdg.n} size="md" className="w-full h-full rounded-none" />

        {/* Badge de seleção */}
        {isSelected && (
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg z-10">
            ✓
          </div>
        )}
      </button>
      <a
        href={sdg.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-[10px] text-center text-blue-600 hover:text-blue-800 mt-1.5 underline truncate"
        title={`Saber mais sobre ODS ${sdg.n}`}
      >
        Saber mais ↗
      </a>
    </div>
  )
}

export default function SdgGrid({ selected, onToggle }: Props) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {SDG_DATA.map((sdg) => (
        <SdgTile
          key={sdg.n}
          sdg={sdg}
          isSelected={selected.includes(sdg.n)}
          onToggle={() => onToggle(sdg.n)}
        />
      ))}
    </div>
  )
}
