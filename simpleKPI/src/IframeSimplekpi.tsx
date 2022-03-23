import {
  AppliedPrompts,
  Context,
  onDrillDownFunction,
  ResponseData,
  TContext
} from '@incorta-org/component-sdk';
import React from 'react';
import { Tile } from './Tile';

interface Props {
  context: Context<TContext>;
  prompts: AppliedPrompts;
  data: ResponseData;
  drillDown: onDrillDownFunction;
}

const IframeSimplekpi = ({ context, prompts, data, drillDown }: Props) => {
  const insightData = data?.data;
  const formattedMeasures = insightData.map((col, index) => {
    const [dim, measure1, measure2] = col;
    return {
      row: dim.value,
      value: String(measure1.formatted),
      value2: String(measure2.formatted),
      iconURL: context.component.settings?.iconURL
    };
  });

  return (
    <div className="SimpleKPI__wrapper">
      {formattedMeasures.map((response, i) => {
        return (
          <Tile
            key={i}
            dim={response.row}
            measure1={response.value}
            measure2={response.value2 || '{1}'}
            iconURL={
              response.iconURL ||
              'https://www.pngkey.com/png/full/675-6751777_general-info-icon.png'
            }
          />
        );
      })}
    </div>
  );
};

export default IframeSimplekpi;
