import React, { useMemo } from 'react';
import {
  usePrompts,
  useQuery,
  useContext,
  ErrorOverlay,
  LoadingOverlay
} from '@incorta-org/component-sdk';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import * as _ from 'lodash';
import './styles.less';

function CalendarVisual({ resData, context }: any) {
  if (
    // @ts-ignore
    resData.rowHeaders?.[0].dataType !== 'date' &&
    // @ts-ignore
    resData.rowHeaders?.[0].dataType !== 'timestamp'
  ) {
    return (
      <div
        style={{
          display: 'grid',
          alignItems: 'center',
          justifyContent: 'center',
          width: context.component.dimensions.width,
          height: context.component.dimensions.height
        }}
      >
        Invalid Date/Time!
      </div>
    );
  }

  const calData = useMemo(() => {
    return _.chain(resData.data)
      .groupBy(row => echarts.format.formatTime('yyyy', row[0].value))
      .mapValues(data => data.map(row => row.map((cell: any) => cell.value)))
      .entries()
      .value()
      .map((entry, index) => ({
        calendar: {
          range: entry[0],
          top: 200 * index + 50,
          cellSize: ['auto', 20]
        },
        series: {
          type: 'heatmap',
          coordinateSystem: 'calendar',
          calendarIndex: index,
          data: entry[1].map(row => [echarts.format.formatTime('yyyy-MM-dd', row[0]), +row[1]])
        }
      }));
  }, [resData.data]);

  const [min, max] = useMemo(() => {
    const flatData = calData.flatMap(x => x.series.data.map(x => x[1]));
    return [_.minBy(flatData), _.maxBy(flatData)];
  }, [calData]);

  const option = {
    responsive: false,
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        return `${params.marker} ${resData.measureHeaders?.[0].label} : ${params.value[1]}`;
      }
    },
    visualMap: {
      inRange: {
        color: ['#EFF5E4', 'green']
      },
      show: false,
      min: min,
      max: max,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      top: 'top'
    },
    calendar: calData.map(val => val.calendar),
    series: calData.map(val => val.series)
  };

  return (
    <div
      style={{
        overflow: 'auto',
        width: context.component.dimensions.width,
        height: context.component.dimensions.height
      }}
    >
      <ReactECharts
        notMerge
        option={option}
        style={{
          height: calData.length * 200 + 50,
          width: context.component.dimensions.width
        }}
      />
    </div>
  );
}

export default () => {
  const { prompts } = usePrompts();
  const { data, context, isLoading, isError, error } = useQuery(useContext(), prompts);
  return (
    <ErrorOverlay isError={isError} error={error}>
      <LoadingOverlay isLoading={isLoading} data={data}>
        {context && data ? <CalendarVisual resData={data} context={context} /> : null}
      </LoadingOverlay>
    </ErrorOverlay>
  );
};
