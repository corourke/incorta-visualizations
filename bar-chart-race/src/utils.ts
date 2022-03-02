// @ts-nocheck
import * as d3 from 'd3';

export const margin = { top: 16, right: 6, bottom: 6, left: 0 };
export const formatNumber = d3.format(',d');
export const formatDate = d3.utcFormat('%Y');
export const n = 12;
export const k = 10;
export const barSize = 48;

export function bars(svg, x, y, data) {
  let bar = svg.append('g').attr('fill-opacity', 0.6).selectAll('rect');
  const color = getColor(data);

  return ([date, data], transition, prev, next) => {
    return (bar = bar
      .data(data.slice(0, n), d => d.name)
      .join(
        enter =>
          enter
            .append('rect')
            .attr('fill', color)
            .attr('height', y.bandwidth())
            .attr('x', x(0))
            .attr('y', d => y((prev.get(d) || d).rank))
            .attr('width', d => x((prev.get(d) || d).value) - x(0)),
        update => update,
        exit =>
          exit
            .transition(transition)
            .remove()
            .attr('y', d => y((next.get(d) || d).rank))
            .attr('width', d => x((next.get(d) || d).value) - x(0))
      )
      .call(bar =>
        bar
          .transition(transition)
          .attr('y', d => y(d.rank))
          .attr('width', d => x(d.value) - x(0))
      ));
  };
}

export function labels(svg, x, y) {
  let label = svg
    .append('g')
    .style('font', 'bold 12px var(--sans-serif)')
    .style('font-variant-numeric', 'tabular-nums')
    .attr('text-anchor', 'end')
    .selectAll('text');

  return ([date, data], transition, prev, next) =>
    (label = label
      .data(data.slice(0, n), d => d.name)
      .join(
        enter =>
          enter
            .append('text')
            .attr(
              'transform',
              d => `translate(${x((prev.get(d) || d).value)},${y((prev.get(d) || d).rank)})`
            )
            .attr('y', y.bandwidth() / 2)
            .attr('x', -6)
            .attr('dy', '-0.25em')
            .text(d => d.name)
            .call(text =>
              text
                .append('tspan')
                .attr('fill-opacity', 0.7)
                .attr('font-weight', 'normal')
                .attr('x', -6)
                .attr('dy', '1.15em')
            ),
        update => update,
        exit =>
          exit
            .transition(transition)
            .remove()
            .attr(
              'transform',
              d => `translate(${x((next.get(d) || d).value)},${y((next.get(d) || d).rank)})`
            )
            .call(g =>
              g.select('tspan').tween('text', d => textTween(d.value, (next.get(d) || d).value))
            )
      )
      .call(bar =>
        bar
          .transition(transition)
          .attr('transform', d => `translate(${x(d.value)},${y(d.rank)})`)
          .call(g =>
            g.select('tspan').tween('text', d => textTween((prev.get(d) || d).value, d.value))
          )
      ));
}

export function axis(svg, x, y, width) {
  const g = svg.append('g').attr('transform', `translate(0,${margin.top})`);

  const axis = d3
    .axisTop(x)
    .ticks(width / 160)
    .tickSizeOuter(0)
    .tickSizeInner(-barSize * (n + y.padding()));

  return (_, transition) => {
    g.transition(transition).call(axis);
    g.select('.tick:first-of-type text').remove();
    g.selectAll('.tick:not(:first-of-type) line').attr('stroke', 'white');
    g.select('.domain').remove();
  };
}

//Year number text field
export function ticker(svg, width, keyframes) {
  const now = svg
    .append('text')
    .style('font', `bold ${barSize}px var(--sans-serif)`)
    .style('font-variant-numeric', 'tabular-nums')
    .attr('text-anchor', 'end')
    .attr('x', width - 6)
    .attr('y', margin.top + barSize * (n - 0.45) - 70)
    .attr('dy', '0.32em')
    .text(formatDate(keyframes[0][0]));

  return ([date], transition) => {
    transition.end().then(() => now.text(formatDate(date)));
  };
}

export const getColor = data => {
  const scale = d3.scaleOrdinal(d3.schemeTableau10);
  if (data.some(d => d.category !== undefined)) {
    const categoryByName = new Map(data.map(d => [d.name, d.category]));
    scale.domain(categoryByName.values());
    return d => scale(categoryByName.get(d.name));
  }
  return d => scale(d.name);
};

export const getKeyframes = data => {
  const datevalues = Array.from(
    d3.rollup(
      data,
      ([d]) => d.value,
      d => d.date,
      d => d.name
    )
  )
    .map(([date, data]) => {
      return [new Date(date), data];
    })
    .sort(([a], [b]) => d3.ascending(a, b));

  const names = new Set(data.map(d => d.name));
  const keyframes = [];
  let ka, a, kb, b;
  for ([[ka, a], [kb, b]] of d3.pairs(datevalues)) {
    for (let i = 0; i < k; ++i) {
      const t = i / k;
      keyframes.push([
        new Date(ka * (1 - t) + kb * t),
        rank(name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t, names)
      ]);
    }
  }
  keyframes.push([new Date(kb), rank(name => b.get(name) || 0, names)]);
  return keyframes;
};

export function rank(value, names) {
  const data = Array.from(names, name => ({ name, value: value(name) }));
  data.sort((a, b) => d3.descending(a.value, b.value));
  for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
  return data;
}

function textTween(a, b) {
  const i = d3.interpolateNumber(a, b);
  return function (t) {
    this.textContent = formatNumber(i(t));
  };
}
