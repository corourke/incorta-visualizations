// @ts-nocheck

import React, { useEffect, useMemo, useState } from 'react';
import {
  ErrorOverlay,
  LoadingOverlay,
  useContext,
  usePrompts,
  useQuery
} from '@incorta-org/component-sdk';
import './styles.less';
import { Bubble } from 'react-chartjs-2';
import { FiPlay, FiPause } from 'react-icons/fi';
import { Slider } from '@reach/slider';
import '@reach/slider/styles.css';

function BubbleRace({ resData, context }) {
  let colorPalette = context.app.color_palette;
  let incortaData = resData;
  let {
    name: nameBinding,
    color: colorBinding,
    time: timeBinding,
    value: valuesBinding
  } = context.component.bindings ?? {};
  let [xBinding, yBinding, rBinding] = valuesBinding;

  let { duration } = context.component.settings;

  let chartData = useMemo(() => {
    return incortaData.data.map(args => {
      let name, colorCol, date, values;
      if (colorBinding?.length > 0) {
        [name, colorCol, date, ...values] = args;
      } else {
        [name, date, ...values] = args;
      }
      return {
        date: date.formatted,
        name: {
          name: nameBinding[0].name,
          value: name.value
        },
        colorBy: colorCol
          ? {
              name: colorBinding[0].name,
              value: colorCol.value
            }
          : undefined,
        values: values.map((value, i) => ({
          name: valuesBinding[i].name,
          value: +value.value,
          formatted: value.formatted
        }))
      };
    });
  }, [incortaData, colorBinding, nameBinding]);

  let [datesData, datesRange] = useMemo(() => {
    let datesData = {};
    let datesRange = [];

    chartData.forEach(row => {
      if (!(row.date in datesData)) {
        datesRange.push(row.date);
      }
      datesData[row.date] = datesData[row.date] ? [...datesData[row.date], row] : [row];
    });

    return [datesData, datesRange];
  }, [chartData]);

  let maxRadius = Math.max(...chartData.map(d => +d.values[2].value));

  let colorByString = useMemo(() => {
    let colorsHash = {};
    let i = 0;
    return function colorByString(str: type) {
      if (str in colorsHash) {
        return colorsHash[str];
      }
      colorsHash[str] = colorPalette[i];
      i = (i + 1) % colorPalette.length;
      return colorsHash[str];
    };
  }, []);

  function radiusFn(context) {
    var size = context.chart.width;
    var base = Math.abs(context.raw.v) / maxRadius;
    return 5 + (size / 12) * base;
  }

  let options = {
    responsive: true, // Instruct chart js to respond nicely.
    maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height
    scales: {
      x: {
        title: {
          display: true,
          text: xBinding.name
        }
      },
      y: {
        title: {
          display: true,
          text: yBinding.name
        }
      }
    },
    elements: {
      point: {
        backgroundColor: function (context) {
          let color = colorByString(context.raw.c ?? context.raw.name);
          return `${color}80`;
        },
        radius: radiusFn,
        hoverRadius: radiusFn
      }
    },
    plugins: {
      plugins: {
        legend: {
          position: 'right'
        }
      },
      tooltip: {
        callbacks: {
          title: function ([context]) {
            return context.raw.date;
          },

          label: function (context) {
            return context.raw.name;
          },
          beforeBody: function ([context]) {
            return context.raw.cName ? `${context.raw.cName}: ${context.raw.c}` : null;
          },
          afterBody: function ([context]) {
            return [
              `${context.raw.xName}: ${context.raw.xFormatted}`,
              `${context.raw.yName}: ${context.raw.yFormatted}`,
              `${context.raw.vName}: ${context.raw.vFormatted}`
            ];
          }
        }
      }
    }
  };

  return (
    <BubbleRaceChart
      dimensions={context.component.dimensions}
      datesData={datesData}
      datesRange={datesRange}
      options={options}
      duration={duration}
      label={timeBinding[0].name}
    />
  );
}

function BubbleRaceChart({ dimensions, datesData, datesRange, options, duration, label }) {
  let hasColorCol = !!Object.values(datesData)[0];

  let [index, setIndex] = useState(0);

  let date = datesRange[index];

  let data = datesData?.[date]?.map(item => {
    let c = item.colorBy;
    let [x, y, r] = item.values;
    return {
      x: x.value,
      y: y.value,
      v: r.value,
      c: c?.value,
      // Additional Data
      xName: x.name,
      yName: y.name,
      vName: r.name,
      cName: c?.name,
      xFormatted: x.formatted,
      yFormatted: y.formatted,
      vFormatted: r.formatted,
      date: item.date,
      name: item.name.value
    };
  });

  useEffect(() => {
    setIndex(0);
  }, [datesRange]);

  if (!data) {
    return null;
  }

  let datasets = [];
  if (hasColorCol) {
    let datasetsObject = data.reduce((acc, item) => {
      acc[item.c] = acc[item.c] ? [...acc[item.c], item] : [item];
      return acc;
    }, {});
    for (let [label, data] of Object.entries(datasetsObject)) {
      datasets.push({
        label,
        data,
        borderColor: 'black'
      });
    }
  } else {
    datasets = [
      {
        label: '2011', // Name the series
        data: data, // Specify the data values array
        borderColor: 'black' // Add custom color border
      }
    ];
  }

  return (
    <div
      className="Bubble-wrapper"
      style={{
        width: dimensions.width,
        height: dimensions.height
      }}
    >
      <div className="Bubble-chart">
        <Bubble data={{ datasets }} options={options} />
      </div>
      <PlaySlider
        label={label}
        duration={duration}
        max={datesRange.length - 1}
        value={index}
        valueLabel={date}
        onChange={index => {
          setIndex(index);
        }}
      />
    </div>
  );
}

function PlaySlider({ label, duration, onChange, value, max, valueLabel }) {
  let [play, setPlay] = useState(true);

  useEffect(() => {
    if (play) {
      if (value < max) {
        let id = setTimeout(() => {
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

export default () => {
  const { prompts } = usePrompts();
  const { data, context, isLoading, isError, error } = useQuery(useContext(), prompts);
  return (
    <ErrorOverlay isError={isError} error={error}>
      <LoadingOverlay isLoading={isLoading} data={data}>
        {context && data ? <BubbleRace resData={data} context={context} /> : null}
      </LoadingOverlay>
    </ErrorOverlay>
  );
};
