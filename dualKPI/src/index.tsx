// @ts-nocheck

import React, { useRef, useReducer, useMemo, useState } from 'react';
import { ComponentProps } from '@incorta-org/component-sdk';
import './styles.less';
import { Tile } from './Tile';

const SimpleKPI = ({ response: data, context }: ComponentProps) => {
  const insightData = data.data;
  const [width, setWidth] = useState(null);

  const formattedMeasures = data.data.map((col, index) => {
    let [dim, measure1, measure2] = col;

    return {
      row: dim.value,
      value: measure1?.formatted && String(measure1?.formatted),
      value2: measure2?.formatted && String(measure2?.formatted),
      iconURL: context.component.settings?.iconURL
    };
  });

  return (
    <div className="visualizations__kpi-container">
      {formattedMeasures.map(response => {
        return (
          <Tile
            dim={response.row}
            measure1={response.value}
            measure2={response.value2}
            iconURL={response.iconURL}
            width={width}
            setWidth={setWidth}
          />
        );
      })}
    </div>
  );
};

export default SimpleKPI;
