import { useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption, PieSeriesOption } from 'echarts';
import { cn } from '@/lib/utils';

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  title?: string;
  data: PieChartData[];
  donut?: boolean;
  showLabel?: boolean;
  showLegend?: boolean;
  height?: string | number;
  className?: string;
  center?: [string | number, string | number];
  radius?: [string | number, string | number];
}

const PRIMARY_COLOR = '#15803d';
const DEFAULT_COLORS = [PRIMARY_COLOR, '#0d9488', '#f59e0b', '#dc2626', '#2563eb', '#7c3aed'];

export default function PieChart({
  title,
  data,
  donut = false,
  showLabel = true,
  showLegend = true,
  height = 350,
  className,
  center,
  radius,
}: PieChartProps) {
  const chartRef = useRef<ReactECharts>(null);

  useEffect(() => {
    const handleResize = () => {
      chartRef.current?.getEchartsInstance().resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getColors = (): string[] => {
    return data.map((item, index) => item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]);
  };

  const getSeriesData = (): PieSeriesOption['data'] => {
    return data.map((item, index) => ({
      value: item.value,
      name: item.name,
      itemStyle: {
        color: {
          type: 'radial',
          x: 0.5,
          y: 0.5,
          r: 0.8,
          colorStops: [
            {
              offset: 0,
              color: `${item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}`,
            },
            {
              offset: 1,
              color: `${item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}cc`,
            },
          ],
        },
      },
    }));
  };

  const defaultRadius: [string, string] = donut ? ['45%', '70%'] : ['0%', '70%'];
  const defaultCenter: [string, string] = showLegend ? ['40%', '50%'] : ['50%', '50%'];

  const option: EChartsOption = {
    color: getColors(),
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
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
        fontSize: 12,
      },
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; percent: number };
        return `<div class="font-medium">${p.name}</div>
                <div class="mt-1">
                  <span class="text-gray-500">数量：</span>
                  <span class="font-semibold">${p.value.toLocaleString()}</span>
                </div>
                <div>
                  <span class="text-gray-500">占比：</span>
                  <span class="font-semibold">${p.percent}%</span>
                </div>`;
      },
    },
    legend: showLegend
      ? {
          orient: 'vertical',
          right: '5%',
          top: 'center',
          textStyle: {
            fontSize: 12,
            color: '#6b7280',
          },
          itemWidth: 12,
          itemHeight: 12,
          itemGap: 12,
          formatter: (name: string) => {
            const item = data.find((d) => d.name === name);
            if (item) {
              const total = data.reduce((sum, d) => sum + d.value, 0);
              const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
              return `${name}  ${percent}%`;
            }
            return name;
          },
        }
      : undefined,
    series: [
      {
        name: title || '数据分布',
        type: 'pie',
        center: center || defaultCenter,
        radius: radius || defaultRadius,
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: showLabel
          ? {
              show: true,
              position: 'outside',
              formatter: '{b}\n{d}%',
              fontSize: 11,
              color: '#4b5563',
            }
          : {
              show: false,
            },
        labelLine: showLabel
          ? {
              show: true,
              length: 15,
              length2: 10,
              lineStyle: {
                color: '#d1d5db',
              },
            }
          : {
              show: false,
            },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
          scale: true,
          scaleSize: 8,
        },
        data: getSeriesData(),
      },
    ],
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
