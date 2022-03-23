// @ts-nocheck

import {
  AppliedPrompts,
  Context,
  onDrillDownFunction,
  ResponseData,
  TContext
} from '@incorta-org/component-sdk';
import { useState } from 'react';
import './styles.less';
import { Tile } from './Tile';

interface Props {
  context: Context<TContext>;
  prompts: AppliedPrompts;
  data: ResponseData;
  drillDown: onDrillDownFunction;
}

const IframeDual = ({ context, data: resData }: Props) => {
  const [width, setWidth] = useState(null);

  const formattedMeasures = resData.data.map((col, index) => {
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

export default IframeDual;

// import React, { useState } from 'react';
// import { useContext, usePrompts, useQuery } from '@incorta-org/component-sdk';

// const SimpleKPI = () => {
//   const { prompts } = usePrompts();
//   const { data: resData, context } = useQuery(useContext(), prompts);

//   const [width, setWidth] = useState(null);

//   if (!context || !resData) {
//     return null;
//   }
// };
