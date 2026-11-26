// ColorPickerModal - Centered modal with custom color picker and preset swatches.
// Shared by stroke and fill color settings; fill also offers a "no color" option.

import { createPortal } from 'react-dom';
import { ColorPicker } from '../ui/color-picker';

export const PRESET_COLORS = [
  '#ff0000', // Red
  '#ff6600', // Orange
  '#ffcc00', // Yellow
  '#00cc00', // Green
  '#0066ff', // Blue
  '#000000', // Black
  '#ffffff', // White
];

export const NO_COLOR = 'transparent';

// Diagonal red slash on white - conventional "no color" swatch
export const NO_COLOR_SWATCH_STYLE = {
  background:
    'linear-gradient(to top right, #ffffff calc(50% - 1px), #ff0000 calc(50% - 1px), #ff0000 calc(50% + 1px), #ffffff calc(50% + 1px))',
};

interface ColorPickerModalProps {
  title: string;
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
  /** Show a "None" swatch that sets the color to transparent */
  allowNone?: boolean;
}

export function ColorPickerModal({ title, color, onChange, onClose, allowNone = false }: ColorPickerModalProps) {
  // ColorPicker only understands #rrggbb; start from white when there is no color yet
  const pickerColor = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#ffffff';

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/30 z-[9998]" onClick={onClose} />
      <div
        className="fixed z-[9999] glass-heavy rounded-2xl shadow-2xl w-[260px] p-4"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ColorPicker color={pickerColor} onChange={onChange} />
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Presets</p>
          <div className="flex flex-wrap gap-1.5">
            {allowNone && (
              <button
                onClick={() => onChange(NO_COLOR)}
                className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 cursor-pointer ${
                  color === NO_COLOR ? 'border-orange-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                style={NO_COLOR_SWATCH_STYLE}
                title="None"
                aria-label="No color"
              />
            )}
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset}
                onClick={() => onChange(preset)}
                className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 cursor-pointer ${
                  color === preset ? 'border-orange-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: preset }}
                title={preset}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
