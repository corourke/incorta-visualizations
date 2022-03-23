// @ts-nocheck
/* eslint-disable prefer-const */

import { ICONS } from './icons';
import _sortBy from 'lodash/sortBy';
import './styles.less';
import { formatNumber } from './formatNumber';
import {
  AppliedPrompts,
  Context,
  onDrillDownFunction,
  ResponseData,
  TContext
} from '@incorta-org/component-sdk';
import React from 'react';

const ICON_SIZE = 24;
const MAX_ROWS = 4;

interface Props {
  context: Context<TContext>;
  prompts: AppliedPrompts;
  data: ResponseData;
  drillDown: onDrillDownFunction;
}

const IframePictogram = ({ context, data: queryResults, drillDown }: Props) => {
  let { height, width } = context.component.dimensions;
  if (height == null || width == null) {
    return null;
  }

  const themeColors = context.app.color_palette;
  const aggregatedData = queryResults.data;
  const { row, col, measure } = context.component.bindings ?? {};
  const {
    iconType = 'population',
    isPercent = false,
    legend = true,
    legendPosition = 'bottom',
    sort
  } = context.component.settings ?? {};

  const footerData = queryResults.footer;
  const colNames = footerData?.pivotColumnHeaders?.map(([colName]) => colName);
  const colNamesColors =
    colNames?.reduce((acc, colName, i) => {
      acc[colName] = themeColors[i % themeColors.length];
      return acc;
    }, {}) ?? {};

  const rowBindingContext = row?.[0];
  const rowName = row?.[0].name;
  const measureSettings = measure?.[0].settings ?? {};
  const colSettings = col?.[0]?.settings ?? {};
  const hasCol = (col ?? []).length > 0;

  let chartData;

  if (hasCol) {
    chartData = aggregatedData.reduce((acc, item) => {
      const [dim, col, measure] = item;

      const rowData = {
        name: dim.value,
        col: col.value,
        value: +measure.value,
        valueFormatted: measure.formatted,
        color: colNamesColors[col.value]
      };

      acc[dim.value] = acc[dim.value] ? [...acc[dim.value], rowData] : [rowData];

      return acc;
    }, {});

    chartData = Object.entries(chartData).map(([name, categories]) => {
      const value = categories.reduce((acc, r) => acc + r.value, 0);
      const valueFormatted = formatNumber(value, measureSettings.format);
      return {
        name,
        value,
        valueFormatted,
        categories
      };
    });

    chartData = chartData.map(row => {
      return {
        ...row,
        categories: row.categories.map(item => ({ ...item, percent: item.value / row.value }))
      };
    });

    if (colSettings.sort === 'descending') {
      chartData = chartData.map(row => {
        return {
          ...row,
          categories: _sortBy(row.categories, ['value']).reverse()
        };
      });
    } else if (colSettings.sort === 'ascending') {
      chartData = chartData.map(row => {
        return {
          ...row,
          categories: _sortBy(row.categories, ['value'])
        };
      });
    }
  } else {
    chartData = aggregatedData.map((item, i) => {
      const [dim, measure] = item;
      return {
        name: dim.value,
        value: +measure.value,
        valueFormatted: measure.formatted,
        color: measureSettings.color ?? themeColors[0]
      };
    });
    const totalValue = chartData.reduce((acc, r) => acc + r.value, 0);
    chartData = chartData.map(item => ({ ...item, percent: item.value / totalValue }));
  }

  const rowCount = Math.floor(width / ICON_SIZE);

  const maxNumberOfIcons = rowCount * MAX_ROWS;

  const maxValue = Math.max(...chartData.map(row => row?.value ?? 0));

  const unitValue = 10 ** Math.ceil(Math.log10(maxValue / maxNumberOfIcons));

  const Icon = ICONS[iconType];

  if (sort === 'descending') {
    chartData = _sortBy(chartData, ['value']).reverse();
  } else if (sort === 'ascending') {
    chartData = _sortBy(chartData, ['value']);
  }

  return (
    <div className="Chart" style={{ height, width }}>
      <div className="Chart__unit">
        <Icon
          style={{
            fontSize: ICON_SIZE,
            color: chartData?.[0]?.color ?? Object.values(colNamesColors)[0]
          }}
        />{' '}
        = {isPercent ? `${(100 / rowCount).toFixed(2)} %` : unitValue}
      </div>

      {legend && legendPosition === 'top' && (
        <Legend
          width={width}
          hasCol={hasCol}
          colNamesColors={colNamesColors}
          chartData={chartData}
          rowName={rowName}
        />
      )}

      {isPercent &&
        chartData.map((row, i) => {
          if (!row) {
            return null;
          }

          let iconsUI;

          if (hasCol) {
            const percentCounts = splitIconsPacedOnPercent({
              categories: row.categories,
              iconsCount: rowCount
            });
            iconsUI = row.categories.map((item, i) => {
              return Array.from({ length: percentCounts[i] }, (_, i) => (
                <Icon key={i} style={{ fontSize: ICON_SIZE, color: item.color }} />
              ));
            });
          } else {
            const iconsCount = Math.ceil(rowCount * row.percent);
            iconsUI = Array.from({ length: rowCount }, (_, i) => {
              if (i < iconsCount) {
                return <Icon key={i} style={{ fontSize: ICON_SIZE, color: row.color }} />;
              }
              return <Icon key={i} style={{ fontSize: ICON_SIZE, opacity: 0.5 }} />;
            });
          }

          return (
            <div key={i} className="Chart__row">
              <div className="Chart__label">
                {row.name}{' '}
                {!hasCol && (
                  <span className="Chart__label-value">({(row.percent * 100).toFixed(2)} %)</span>
                )}
              </div>
              <div className="Chart__items">{iconsUI}</div>
            </div>
          );
        })}

      {!isPercent &&
        chartData.map((row, i) => {
          if (!row) {
            return null;
          }

          const iconsCount = Math.ceil(row.value / unitValue);
          let iconsUI;

          if (hasCol) {
            const percentCounts = splitIconsPacedOnPercent({
              categories: row.categories,
              iconsCount
            });
            iconsUI = row.categories.map((item, i) => {
              return Array.from({ length: percentCounts[i] }, (_, i) => (
                <Icon
                  key={i}
                  style={{ fontSize: ICON_SIZE, color: item.color }}
                  onClick={event => {
                    let drilldownObject = {
                      measureIndex: 0,
                      drills: [
                        { drill: 'row', value: row.name, bindingContext: rowBindingContext },
                        {
                          bindingContext: col?.[0],
                          drill: 'column',
                          value: item.col
                        }
                      ],
                      event: event
                    };
                    drillDown(drilldownObject);
                  }}
                />
              ));
            });
          } else {
            iconsUI = Array.from({ length: iconsCount }, (_, i) => {
              return <Icon key={i} style={{ fontSize: ICON_SIZE, color: row.color }} />;
            });
          }

          return (
            <div key={i} className="Chart__row">
              <div
                className="Chart__label"
                onClick={event => {
                  let drilldownObject = {
                    measureIndex: 0,
                    drills: [{ drill: 'row', value: row.name, bindingContext: rowBindingContext }],
                    event: event
                  };
                  console.log({ drilldownObject });
                  drillDown(drilldownObject);
                }}
              >
                {row.name}{' '}
                <span className="Chart__label-value">({row.valueFormatted ?? row.value})</span>{' '}
              </div>
              <div className="Chart__items">{iconsUI}</div>
            </div>
          );
        })}

      {legend && legendPosition === 'bottom' && (
        <Legend
          width={width}
          hasCol={hasCol}
          colNamesColors={colNamesColors}
          chartData={chartData}
          rowName={rowName}
        />
      )}
    </div>
  );
};

export default IframePictogram;

function Legend({ width, hasCol, colNamesColors, chartData, rowName }) {
  return (
    <div className="Chart__legends" style={{ width }}>
      {hasCol ? (
        Object.entries(colNamesColors).map(([name, color], i) => {
          return (
            <div key={i} className="Chart__legend">
              <span className="Chart__legend-circle" style={{ background: color }} /> {name}
            </div>
          );
        })
      ) : (
        <div className="Chart__legend">
          <span className="Chart__legend-circle" style={{ background: chartData?.[0]?.color }} />{' '}
          {rowName}
        </div>
      )}
    </div>
  );
}

// utils

function splitIconsPacedOnPercent({ categories, iconsCount }) {
  const percentCounts = categories.map(item => item.percent * iconsCount);
  let point = 1;
  let maxIndex = 0;
  let max = 0;
  [...percentCounts].forEach((percent, i) => {
    const integerPoint = Math.floor(percent);
    const ratio = percent - integerPoint;
    percentCounts[i] = integerPoint;
    if (ratio <= point) {
      point -= ratio;
      if (ratio > max) {
        max = ratio;
        maxIndex = i;
      }
    } else {
      const usedRatio = point;
      const remendedRatio = ratio - usedRatio;
      if (usedRatio > max) {
        max = usedRatio;
        maxIndex = i;
      }
      percentCounts[maxIndex] += 1;

      point = 1 - remendedRatio;
      maxIndex = i;
      max = remendedRatio;
    }
  });
  if (point < 0.00001) {
    percentCounts[maxIndex] += 1;
  }
  return percentCounts;
}
