import { useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption, SeriesOption } from 'echarts';
import { cn } from '@/lib/utils';

interface LineChartSeries {
  name: string;
  data: number[];
  color?: string;
  smooth?: boolean;
  areaStyle?: boolean;
}

interface LineChartProps {
  title?: string;
  xAxisData: string[];
  series: LineChartSeries[];
  legend?: boolean;
  height?: string | number;
  className?: string;
  yAxisName?: string;
  showGrid?: boolean;
}

const PRIMARY_COLOR = '#15803d';
const DEFAULT_COLORS = [PRIMARY_COLOR, '#0d9488', '#f59e0b', '#dc2626', '#2563eb'];

export default function LineChart({
  title,
  xAxisData,
  series,
  legend = true,
  height = 350,
  className,
  yAxisName,
  showGrid = true,
}: LineChartProps) {
  const chartRef = useRef<ReactECharts>(null);

  useEffect(() => {
    const handleResize = () => {
      chartRef.current?.getEchartsInstance().resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getSeries = (): SeriesOption[] => {
    return series.map((s, index) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: s.smooth ?? true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2,
        color: s.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      },
      itemStyle: {
        color: s.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      },
      areaStyle: s.areaStyle
        ? {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: `${s.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}30`,
                },
                {
                  offset: 1,
                  color: `${s.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}05`,
                },
              ],
            },
          }
        : undefined,
    }));
  };

  const option: EChartsOption = {
    title: title
      ? {
          text: title,
          left: 'center',
          top: 0,
          textStyle: {
            fontSize: 14,
            fontWeight: 600,
            color: '#111827',
          },
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
        fontSize: 12,
      },
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: '#15803d',
          type: 'dashed',
        },
      },
    },
    legend: legend
      ? {
          data: series.map((s) => s.name),
          bottom: 0,
          textStyle: {
            fontSize: 12,
            color: '#6b7280',
          },
        }
      : undefined,
    grid: showGrid
      ? {
          left: '3%',
          right: '4%',
          bottom: legend ? 40 : 10,
          top: title ? 40 : 10,
          containLabel: true,
        }
      : undefined,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
      },
      axisTick: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      nameTextStyle: {
        color: '#9ca3af',
        fontSize: 11,
        padding: [0, 0, 0, 40],
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: '#f3f4f6',
          type: 'dashed',
        },
      },
    },
    series: getSeries(),
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ReactECharts
        ref={chartRef}
        option={option}
        notMerge={true}
        lazyUpdate={true}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
