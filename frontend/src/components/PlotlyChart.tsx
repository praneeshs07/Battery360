import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

interface PlotlyChartProps {
  data: any[];
  layout?: any;
  config?: any;
  style?: React.CSSProperties;
  className?: string;
}

export const PlotlyChart: React.FC<PlotlyChartProps> = ({
  data,
  layout = {},
  config = {},
  style,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const baseLayout: any = {
      autosize: true,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(11, 19, 43, 0.6)',
      font: {
        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#94A3B8',
        size: 11,
      },
      margin: { l: 50, r: 25, t: 35, b: 45 },
      xaxis: {
        gridcolor: 'rgba(58, 80, 107, 0.35)',
        zerolinecolor: 'rgba(58, 80, 107, 0.6)',
        color: '#94A3B8',
        linecolor: 'rgba(58, 80, 107, 0.5)',
      },
      yaxis: {
        gridcolor: 'rgba(58, 80, 107, 0.35)',
        zerolinecolor: 'rgba(58, 80, 107, 0.6)',
        color: '#94A3B8',
        linecolor: 'rgba(58, 80, 107, 0.5)',
      },
      legend: {
        orientation: 'h',
        y: -0.22,
        x: 0,
        font: { color: '#E2E8F0', size: 11 },
      },
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: '#0B132B',
        bordercolor: '#00F0FF',
        font: { color: '#FFFFFF', size: 11 },
      },
      ...layout,
    };

    const baseConfig: any = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: 'battery360_plot',
        height: 600,
        width: 1000,
        scale: 2,
      },
      ...config,
    };

    Plotly.react(containerRef.current, data, baseLayout, baseConfig);

    const handleResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, layout, config]);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden ${className}`}
      style={{ minHeight: '320px', ...style }}
    />
  );
};
