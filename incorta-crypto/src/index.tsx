// Displays current cryptocurency price and market information
// See API documentation at https://www.coingecko.com/en/api/documentation

// TODO: Needs internationalization
import React, { useState, useEffect } from 'react';
import { ComponentProps } from '@incorta-org/component-sdk';
import { Tile } from './Tile';

const IncortaCrypto = (props: ComponentProps) => {
  const [maxTiles, setMaxTiles] = useState<number>(4);

  useEffect(() => {
    // TODO: This seems to fire on just about any update to props,
    // Probably need to use something like https://www.npmjs.com/package/use-deep-compare-effect
    console.log('SETTINGS CHANGE');
    const settings = props.context.component.settings;
    if (settings) {
      if (settings.maxTiles !== maxTiles) {
        setMaxTiles(settings.maxTiles);
        console.log('MAXTILES UPDATE');
      }
    }
  }, [props.context.component.settings]);

  useEffect(() => {
    // TODO: This seems to fire on any change, might need to use useDeepCompareEffect
    console.log('BINDINGS CHANGE');
  }, [props.context.component.bindings]);

  // Render a tile for each row returned
  var tiles = 0;
  const renderedTiles = props.response.data.map(cell => {
    const c: string = cell[0].value;
    const p: number = Number(cell[1].value);

    if (tiles++ < maxTiles) {
      return <Tile key={c} coinId={c} aggPosition={p} />;
    } else return null;
  });

  console.log('PROPS: ', props);
  return (
    <div>
      <div className="tiles">{renderedTiles}</div>
    </div>
  );
};

export default IncortaCrypto;
