/* eslint-disable prefer-const */
// @ts-nocheck

import React from 'react';
import { ICONS } from './icons';
import { ComponentProps } from '@incorta-org/component-sdk';
import _sortBy from 'lodash/sortBy';
import './styles.less';
import { formatNumber } from './formatNumber';

let ICON_SIZE = 24;
let MAX_ROWS = 4;

const Pictogram = (props: ComponentProps) => {
  let { height, width } = props.context.component.dimensions;
  if (height == null || width == null) {
    return null;
  }
  let themeColors = props.context.app.color_palette;
  let aggregatedData = props.response.data;
  let { row, col, measure } = props.context.component.bindings ?? {};
  let {
    iconType = 'population',
    isPercent = false,
    legend = true,
    legendPosition = 'bottom',
    sort
  } = props.context.component.settings ?? {};

  let footerData = props.response.footer;
  let colNames = footerData?.pivotColumnHeaders?.map(([colName]) => colName);
  let colNamesColors =
    colNames?.reduce((acc, colName, i) => {
      acc[colName] = themeColors[i % themeColors.length];
      return acc;
    }, {}) ?? {};

  let rowName = row?.[0].name;
  let measureSettings = measure?.[0].settings ?? {};
  let colSettings = col?.[0]?.settings ?? {};
  let hasCol = (col ?? []).length > 0;

  let chartData;

  if (hasCol) {
    chartData = aggregatedData.reduce((acc, item) => {
      let [dim, col, measure] = item;

      let rowData = {
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
      let value = categories.reduce((acc, r) => acc + r.value, 0);
      let valueFormatted = formatNumber(value, measureSettings.format);
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
      let [dim, measure] = item;
      return {
        name: dim.value,
        value: +measure.value,
        valueFormatted: measure.formatted,
        color: measureSettings.color ?? themeColors[0]
      };
    });
    let totalValue = chartData.reduce((acc, r) => acc + r.value, 0);
    chartData = chartData.map(item => ({ ...item, percent: item.value / totalValue }));
  }

  let rowCount = Math.floor(width / ICON_SIZE);

  let maxNumberOfIcons = rowCount * MAX_ROWS;

  let maxValue = Math.max(...chartData.map(row => row?.value ?? 0));

  let unitValue = 10 ** Math.ceil(Math.log10(maxValue / maxNumberOfIcons));

  let Icon = ICONS[iconType];

  if (sort === 'descending') {
    chartData = _sortBy(chartData, ['value']).reverse();
  } else if (sort === 'ascending') {
    chartData = _sortBy(chartData, ['value']);
  }

  console.log({ unitValue, maxValue, maxNumberOfIcons });

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
        chartData.map(row => {
          if (!row) {
            return null;
          }

          let iconsUI;

          if (hasCol) {
            let percentCounts = splitIconsPacedOnPercent({
              categories: row.categories,
              iconsCount: rowCount
            });
            iconsUI = row.categories.map((item, i) => {
              return Array.from({ length: percentCounts[i] }, (_, i) => (
                <Icon key={i} style={{ fontSize: ICON_SIZE, color: item.color }} />
              ));
            });
          } else {
            let iconsCount = Math.ceil(rowCount * row.percent);
            iconsUI = Array.from({ length: rowCount }, (_, i) => {
              if (i < iconsCount) {
                return <Icon key={i} style={{ fontSize: ICON_SIZE, color: row.color }} />;
              }
              return <Icon key={i} style={{ fontSize: ICON_SIZE, opacity: 0.5 }} />;
            });
          }

          return (
            <div className="Chart__row">
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
        chartData.map(row => {
          if (!row) {
            return null;
          }

          let iconsCount = Math.ceil(row.value / unitValue);
          let iconsUI;

          if (hasCol) {
            let percentCounts = splitIconsPacedOnPercent({
              categories: row.categories,
              iconsCount
            });
            // console.log({
            //   categories: row.categories,
            //   percentCounts,
            //   iconsCount,
            //   percentCountsIcon: percentCounts.reduce((acc, x) => acc + x, 0)
            // });
            iconsUI = row.categories.map((item, i) => {
              return Array.from({ length: percentCounts[i] }, (_, i) => (
                <Icon key={i} style={{ fontSize: ICON_SIZE, color: item.color }} />
              ));
            });
          } else {
            iconsUI = Array.from({ length: iconsCount }, (_, i) => {
              return <Icon key={i} style={{ fontSize: ICON_SIZE, color: row.color }} />;
            });
          }

          return (
            <div className="Chart__row">
              <div className="Chart__label">
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

function Legend({ width, hasCol, colNamesColors, chartData, rowName }) {
  return (
    <div className="Chart__legends" style={{ width }}>
      {hasCol ? (
        Object.entries(colNamesColors).map(([name, color]) => {
          return (
            <div className="Chart__legend">
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

export default Pictogram;

// utils

function splitIconsPacedOnPercent({ categories, iconsCount }) {
  let percentCounts = categories.map(item => item.percent * iconsCount);
  let point = 1;
  let maxIndex = 0;
  let max = 0;
  [...percentCounts].forEach((percent, i) => {
    let integerPoint = Math.floor(percent);
    let ratio = percent - integerPoint;
    percentCounts[i] = integerPoint;
    if (ratio <= point) {
      point -= ratio;
      if (ratio > max) {
        max = ratio;
        maxIndex = i;
      }
    } else {
      let usedRatio = point;
      let remendedRatio = ratio - usedRatio;
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
