// SPDX-License-Identifier: AGPL-3.0-or-later
// CatAvatar - Componente React do Avatar Felino Modular

import React from 'react';
import { CatAppearance } from '../types';
import { render, layers, normalize, coats, outfits, glasses } from '../core/cat-avatar';

interface CatAvatarProps {
  appearance?: Partial<CatAppearance>;
  className?: string;
  size?: number | string;
}

export const CatAvatar: React.FC<CatAvatarProps> = ({
  appearance = {},
  className = 'w-24 h-24',
  size
}) => {
  const norm = normalize(appearance);
  const layerList = layers(norm);
  const label = `${coats[norm.coat]?.label || 'Frajola'}, ${outfits[norm.outfit] || 'Natural'}, ${glasses[norm.glasses] || 'Sem óculos'}`;

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title={label}
      aria-label={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 240 240"
        role="img"
        className="w-full h-full drop-shadow-sm transition-transform duration-300 hover:scale-105"
      >
        <title>{label}</title>
        {layerList.map((layer) => (
          <g
            key={layer.name}
            data-layer={layer.name}
            dangerouslySetInnerHTML={{ __html: layer.markup }}
          />
        ))}
      </svg>
    </div>
  );
};

export default CatAvatar;
