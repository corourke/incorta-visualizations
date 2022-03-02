// @ts-nocheck
import React, { useMemo, useReducer, useRef } from 'react';
import './styles.less';
import Measure from 'react-measure';
import _ from 'lodash';
import debounce from 'lodash/debounce';

interface TileProps {
  dim: string;
  measure1: string;
  measure2: string;
  iconURL: string;
}

export const Tile: React.FC<TileProps> = ({
  dim: coinId,
  measure1: price,
  measure2: priceChange,
  iconURL: iconURL,
  width,
  setWidth
}) => {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className={classnames('visualizations__data-item')} style={{ width }}>
      <Measure
        bounds
        onResize={contentRect => {
          if (!containerRef.current) return;
          const containerStyle = getComputedStyle(containerRef.current);
          const width =
            contentRect?.bounds?.width +
            parseInt(containerStyle.paddingLeft) +
            parseInt(containerStyle.paddingRight);
          setWidth(w => Math.max(width, w));
        }}
      >
        {({ measureRef }) => (
          <div ref={measureRef}>
            <div className="visualizations__data-item__container">
              <span className="visualizations__data-item__value">{price}</span>
              <span className="visualizations__data-item__label">{coinId}</span>
            </div>
            {priceChange == null ? null : (
              <div className="visualizations__data-info">
                {!priceChange.startsWith('-') ? (
                  <div className="arrowUp"> &#x25B2; </div>
                ) : (
                  <div className="arrowDown"> &#x25BC; </div>
                )}

                {!priceChange.startsWith('-') ? (
                  <div className="priceChangeUp">
                    {!priceChange.startsWith('-') ? priceChange : priceChange.substr(1)}
                  </div>
                ) : (
                  <div className="priceChangeDown">
                    {!priceChange.startsWith('-') ? priceChange : priceChange.substr(1)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Measure>
    </div>
  );
};

function classnames(...args: any) {
  return args.join(' ');
}
