import React from 'react';
import * as d3 from 'd3';

export const useD3 = (renderChartFn: (selection: any) => any, dependencies: any[]) => {
  const ref = React.useRef<string>('');

  React.useEffect(() => {
    renderChartFn(d3.select(ref.current));
    return () => {};
  }, dependencies);
  return ref;
};
