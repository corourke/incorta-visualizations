import {
  useContext,
  useCustomQuery,
  usePrompts,
  useQueryBuilder
} from '@incorta-org/component-sdk';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import _, { min } from 'lodash';
import { createSliderWithTooltip, Range } from 'rc-slider';

import './slider.css';
import './styles.less';

const RangeWithTooltip = createSliderWithTooltip(Range);

const IframeSlicer = () => {
  const context = useContext();
  const { drillDown, prompts } = usePrompts();
  const { data, isLoading: queryBuilderLoading } = useQueryBuilder(context);

  const minQueryObject = useMemo(() => {
    if (!data) {
      return null;
    }

    const queryObject = _.cloneDeep(data);
    delete queryObject.showDetails;
    queryObject.measures[0].aggregation = 'min';
    queryObject.rowTotal = true;
    return queryObject;
  }, [data]);

  const maxQueryObject = useMemo(() => {
    if (!data) {
      return null;
    }

    const queryObject = _.cloneDeep(data);
    delete queryObject.showDetails;
    queryObject.measures[0].aggregation = 'max';
    queryObject.rowTotal = true;
    return queryObject;
  }, [data]);

  const { data: minQueryData, isLoading: minQueryLoading } = useCustomQuery(minQueryObject);
  const { data: maxQueryData, isLoading: maxQueryLoading } = useCustomQuery(maxQueryObject);

  const loading = queryBuilderLoading || minQueryLoading || maxQueryLoading;

  const minData = minQueryData ? +minQueryData?.data[0][0].value : null;
  const maxData = maxQueryData ? +maxQueryData?.data[0][0].value : null;

  const [currentMinMax, setCurrentMinMax] = useState([0, 0]);

  useEffect(() => {
    if (minData == null || maxData == null) {
      return;
    }
    const insightContext = context.component;
    const bindingContext = insightContext.bindings?.field[0]; // the 'field' is the tray key
    if (!bindingContext) {
      return;
    }
    // @ts-ignore
    const prompt = prompts?.[bindingContext.field.column || bindingContext.field.formula];
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
            setCurrentMinMax([min, maxData]);
          }
          break;
        case '<':
        case '<=':
          {
            const [max] = prompt.values.map(x => +x);
            setCurrentMinMax([minData, max]);
          }
          break;
        default:
          setCurrentMinMax([]);
      }
    } else {
      setCurrentMinMax([]);
    }
  }, [prompts]);

  useEffect(() => {
    if (minData != null && maxData != null) {
      console.log('here', minData, maxData);
      setCurrentMinMax([Math.ceil(minData), Math.floor(maxData)]);
    }
  }, [minData, maxData]);

  const doDrilldown = useCallback(([min, max]) => {
    const insightContext = context.component;
    const bindingContext = insightContext.bindings?.field[0];
    drillDown &&
      bindingContext &&
      drillDown({
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
        event: {} as MouseEvent,
        measureIndex: 0
      });
  }, []);

  const { current: debouncedDrilldown } = useRef(_.debounce(doDrilldown, 100));

  const { height } = context.component.dimensions;
  const [sliderColor] = context.app.color_palette;

  return (
    <div className="numeric-range-slicer" style={{ height }}>
      <div className="min-max-inputs">
        <label>Min: </label>
        <input
          type="number"
          className="ant-input ant-input-sm"
          value={currentMinMax[0]}
          onChange={e => {
            const value = +e.target.value;
            console.log('min', value);
            setCurrentMinMax([value, currentMinMax[1]]);
            debouncedDrilldown([value, currentMinMax[1]]);
          }}
        />
        <br />
        <label>Max: </label>
        <input
          type="number"
          className="ant-input ant-input-sm"
          value={currentMinMax[1]}
          onChange={e => {
            const value = +e.target.value;
            console.log('max', value);
            setCurrentMinMax([currentMinMax[0], value]);
            debouncedDrilldown([currentMinMax[0], value]);
          }}
        />
        <br />
      </div>

      {currentMinMax && minData != null && maxData != null && (
        <RangeWithTooltip
          value={currentMinMax}
          railStyle={{ backgroundColor: '#F5F5F5', borderColor: '#F5F5F5' }}
          trackStyle={[
            { backgroundColor: sliderColor, borderColor: sliderColor },
            { backgroundColor: sliderColor, borderColor: sliderColor }
          ]}
          handleStyle={[
            { borderColor: sliderColor, boxShadow: 'unset', height: 20, width: 20, marginTop: -8 },
            { borderColor: sliderColor, boxShadow: 'unset', height: 20, width: 20, marginTop: -8 }
          ]}
          min={minData}
          max={maxData}
          onChange={value => {
            if (value?.[0] !== currentMinMax?.[0] || value?.[1] !== currentMinMax?.[1]) {
              console.log('RangeWithTooltip', value, currentMinMax);
              setCurrentMinMax(value);
              debouncedDrilldown(value);
            }
          }}
          allowCross={false}
        />
      )}
    </div>
  );
};

export default IframeSlicer;
