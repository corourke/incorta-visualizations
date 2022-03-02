// @ts-nocheck

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ComponentProps } from '@incorta-org/component-sdk';
import debounce from 'lodash/debounce';
import { createSliderWithTooltip, Range } from 'rc-slider';
import './slider.css';
import './styles.less';

const RangeWithTooltip = createSliderWithTooltip(Range);

const NumericRangeSlicer = (props: ComponentProps) => {
  const { height, width } = props.context.component.dimensions;
  const [, dataMin, dataMax] = props.response.data[0].map(x => +x.value);
  const [currentMinMax, setCurrentMinMax] = useState([]);
  const [sliderColor] = props.context.app.color_palette;

  useEffect(() => {
    const insightContext = props.context.component;
    const bindingContext = insightContext.bindings.field[0]; // the 'field' is the tray key
    const prompt =
      props.appliedPrompts?.[bindingContext.field.column || bindingContext.field.formula];
    if (prompt) {
      switch (prompt.op) {
        case 'BETWEEN':
          {
            const [min, max] = prompt.values[0].split('~').map(x => +x);
            setCurrentMinMax([min, max]);
          }
          break;
        case '>':
        case '>=':
          {
            const [min] = prompt.values.map(x => +x);
            setCurrentMinMax([min, dataMax]);
          }
          break;
        case '<':
        case '<=':
          {
            const [max] = prompt.values.map(x => +x);
            setCurrentMinMax([dataMin, max]);
          }
          break;
        default:
          setCurrentMinMax([]);
      }
    } else {
      setCurrentMinMax([]);
    }
  }, [props.appliedPrompts]);

  const doDrilldown = useCallback(([min, max]) => {
    const insightContext = props.context.component;
    const bindingContext = insightContext.bindings.field[0];
    props.onDrillDown &&
      props.onDrillDown({
        drills: [
          {
            bindingContext,
            drill: 'column',
            isMeasureDrill: true,
            value: `${min} ~ ${max}`,
            operator: 'BETWEEN',
            dataType: 'double'
          }
        ],
        event: {},
        measureIndex: 0
      });
  }, []);

  const { current: debouncedDrilldown } = useRef(debounce(doDrilldown, 100));

  const renderMinMax = currentMinMax.length > 0 ? currentMinMax : [dataMin, dataMax];

  return (
    <div className="numeric-range-slicer" style={{ height, width }}>
      <div className="min-max-inputs">
        <label>Min: </label>
        <input
          type="number"
          className="ant-input ant-input-sm"
          value={renderMinMax[0]}
          onChange={e => {
            const value = e.target.value;
            setCurrentMinMax([value, renderMinMax[1]]);
            debouncedDrilldown([value, renderMinMax[1]]);
          }}
        />
        <br />
        <label>Max: </label>
        <input
          type="number"
          className="ant-input ant-input-sm"
          value={renderMinMax[1]}
          onChange={e => {
            const value = e.target.value;
            setCurrentMinMax([renderMinMax[0], value]);
            debouncedDrilldown([renderMinMax[0], value]);
          }}
        />
        <br />
      </div>

      <RangeWithTooltip
        value={renderMinMax}
        railStyle={{ backgroundColor: '#F5F5F5', borderColor: '#F5F5F5' }}
        trackStyle={[
          { backgroundColor: sliderColor, borderColor: sliderColor },
          { backgroundColor: sliderColor, borderColor: sliderColor }
        ]}
        handleStyle={[
          { borderColor: sliderColor, boxShadow: 'unset', height: 20, width: 20, marginTop: -8 },
          { borderColor: sliderColor, boxShadow: 'unset', height: 20, width: 20, marginTop: -8 }
        ]}
        min={dataMin}
        max={dataMax}
        onChange={value => {
          setCurrentMinMax(value);
          debouncedDrilldown(value);
        }}
        allowCross={false}
      />
    </div>
  );
};

export default NumericRangeSlicer;
