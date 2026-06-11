import { useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption, SeriesOption } from 'echarts';
import { cn } from '@/lib/utils';

interface BarChartSeries {
  name: string;
  data: number[];
  color?: string;
  stack?: string;
}

interface BarChartProps {
  title?: string;
  xAxisData: string[];
  series: BarChartSeries[];
  horizontal?: boolean;
  stacked?: boolean;
  legend?: boolean;
  height?: string | number;
  className?: string;
  yAxisName?: string;
  xAxisName?: string;
  showGrid?: boolean;
}

const PRIMARY_COLOR = '#15803d';
const DEFAULT_COLORS = [PRIMARY_COLOR, '#0d9488', '#f59e0b', '#dc2626', '#2563eb', '#7c3aed'];

export default function BarChart({
  title,
  xAxisData,
  series,
  horizontal = false,
  stacked = false,
  legend = true,
  height = 350,
  className,
  yAxisName,
  xAxisName,
  showGrid = true,
}: BarChartProps) {
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
      type: 'bar',
      data: s.data,
      stack: stacked ? (s.stack || 'total') : undefined,
      barWidth: horizontal ? '45%' : '35%',
      itemStyle: {
        color: {
          type: horizontal ? 'linear' : 'linear',
          x: 0,
          y: 0,
          x2: horizontal ? 1 : 0,
          y2: horizontal ? 0 : 1,
          colorStops: [
            {
              offset: 0,
              color: `${s.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}`,
            },
            {
              offset: 1,
              color: `${s.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}cc`,
            },
          ],
        },
        borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.2)',
        },
      },
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
      axisPointer: {
        type: horizontal ? 'shadow' : 'shadow',
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
        fontSize: 12,
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
    xAxis: horizontal
      ? {
          type: 'value',
          name: xAxisName,
          nameTextStyle: {
            color: '#9ca3af',
            fontSize: 11,
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
        }
      : {
          type: 'category',
          data: xAxisData,
          name: xAxisName,
          nameTextStyle: {
            color: '#9ca3af',
            fontSize: 11,
          },
          axisLine: {
            lineStyle: {
              color: '#e5e7eb',
            },
          },
          axisLabel: {
            color: '#6b7280',
            fontSize: 11,
            interval: 0,
            rotate: xAxisData.length > 6 ? 30 : 0,
          },
          axisTick: {
            show: false,
          },
        },
    yAxis: horizontal
      ? {
          type: 'category',
          data: xAxisData,
          name: yAxisName,
          nameTextStyle: {
            color: '#9ca3af',
            fontSize: 11,
            padding: [0, 40, 0, 0],
          },
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
        }
      : {
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
