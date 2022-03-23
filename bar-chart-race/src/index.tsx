// @ts-nocheck
import { useD3 } from './hooks/useD3';
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  useContext,
  LoadingOverlay,
  ErrorOverlay,
  usePrompts,
  useQuery
} from '@incorta-org/component-sdk';
import { bars, axis, labels, ticker, margin, n, barSize, getKeyframes } from './utils';
import { FiPlay, FiPause } from 'react-icons/fi';
import { format } from 'date-fns';
import { Slider } from '@reach/slider';
import '@reach/slider/styles.css';
``;
import './styles.less';

function BarChart({ resData, context }) {
  const { width, height } = context?.component.dimensions ?? {};
  const duration = context?.component?.settings?.duration;
  const { period } = context?.component.bindings ?? {};
  const periodRow = period?.[0];

  console.log({ 'context?.component?.settings': context?.component?.settings });

  const [index, setIndex] = useState(0);

  data = resData.data.map(row => ({
    date: row[1].value,
    name: row[0].value,
    category: row.length === 4 ? row[2].value : undefined,
    value: row.length === 3 ? +row[2].value : +row[3].value
  }));

  const stringifyData = JSON.stringify(data);

  const keyframes = getKeyframes(data);

  const updateFrame = useRef();

  const ref = useD3(
    async svg => {
      svg.interrupt();
      svg.selectAll('*').remove();

      const x = d3.scaleLinear([0, 1], [margin.left, width - margin.right]);
      const y = d3
        .scaleBand()
        .domain(d3.range(n + 1))
        .rangeRound([margin.top, margin.top + barSize * (n + 1 + 0.1)])
        .padding(0.1);

      svg.attr('viewBox', [0, 0, width, height - 100]);

      const updateBars = bars(svg, x, y, data);
      const updateAxis = axis(svg, x, y, width);
      const updateLabels = labels(svg, x, y);
      const updateTicker = ticker(svg, width, keyframes);

      updateFrame.current = index => {
        const keyframe = keyframes[index];

        const nameframes = d3.groups(
          keyframes.flatMap(([, data]) => data),
          d => d.name
        );
        const prev = new Map(nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a])));
        const next = new Map(nameframes.flatMap(([, data]) => d3.pairs(data)));
        const transition = svg.transition().duration(duration).ease(d3.easeLinear);

        x.domain([0, keyframe[1][0].value]);

        updateAxis(keyframe, transition);
        updateBars(keyframe, transition, prev, next);
        updateLabels(keyframe, transition, prev, next);
        updateTicker(keyframe, transition);
      };
    },
    [stringifyData, duration, width, height]
  );

  useEffect(() => {
    setIndex(0);
  }, [stringifyData]);

  useEffect(() => {
    updateFrame.current(index);
  }, [index, width, height]);

  const [playerDate] = keyframes[index];
  const playerDateFormatted = format(playerDate, 'MM/dd/yyyy');

  return (
    <div>
      <svg ref={ref} />
      <PlaySlider
        label={periodRow?.name}
        duration={duration}
        max={keyframes.length - 1}
        value={index}
        valueLabel={playerDateFormatted}
        onChange={index => {
          setIndex(index);
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
        {context && data ? <BarChart resData={data} context={context} /> : null}
      </LoadingOverlay>
    </ErrorOverlay>
  );
};

function PlaySlider({ label, duration, onChange, value, max, valueLabel }) {
  const [play, setPlay] = useState(true);

  useEffect(() => {
    if (play) {
      if (value < max) {
        const id = setTimeout(() => {
          onChange(i => i + 1);
        }, duration);
        return () => {
          clearTimeout(id);
        };
      } else {
        setPlay(false);
      }
    }
  }, [play, value, duration]);

  return (
    <div className="PlaySlider">
      <button
        onClick={() => {
          if (value >= max) {
            onChange(0);
          }
          setPlay(f => !f);
        }}
      >
        {play ? <FiPause /> : <FiPlay />}
      </button>
      <div className="PlaySlider-slider-wrapper">
        <div className="PlaySlider-slider-label">
          {label} = {valueLabel}
        </div>
        <div className="PlaySlider-slider">
          <Slider
            value={value}
            onChange={n => {
              onChange(n);
            }}
            step={1}
            min={0}
            max={max}
          />
        </div>
      </div>
    </div>
  );
}
