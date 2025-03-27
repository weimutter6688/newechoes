import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import worldData from '@/assets/world.zh.json';
import chinaData from '@/assets/china.json';

interface WorldHeatmapProps {
  visitedPlaces: string[];
}

const WorldHeatmap: React.FC<WorldHeatmapProps> = ({ visitedPlaces }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 确保之前的实例被正确销毁
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    // 初始化图表并保存实例引用
    const chart = echarts.init(chartRef.current, null, {
      renderer: 'canvas',
      useDirtyRect: false
    });
    chartInstanceRef.current = chart;

    const mergedWorldData = {
      ...worldData,
      features: worldData.features.map((feature: any) => {
        if (feature.properties.name === '中国') {
          return {
            ...feature,
            geometry: {
              type: 'MultiPolygon',
              coordinates: []
            }
          };
        }
        return feature;
      }).concat(
        chinaData.features.map((feature: any) => ({
          ...feature,
          properties: {
            ...feature.properties,
            name: feature.properties.name
          }
        }))
      )
    };

    echarts.registerMap('merged-world', mergedWorldData as any);

    // 检查当前是否为暗色模式
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // 根据当前模式设置颜色
    const getChartColors = () => {
      return {
        textColor: isDarkMode ? '#ffffff' : '#374151',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        unvisitedColor: isDarkMode ? '#1f2937' : '#e5e7eb',
        visitedColor: isDarkMode ? '#059669' : '#10b981',
        emphasisColor: isDarkMode ? '#059669' : '#10b981',
        tooltipBgColor: isDarkMode ? '#111827' : '#ffffff',
      };
    };
    
    const colors = getChartColors();

    // 使用动态颜色方案
    const option = {
      title: {
        text: '我的旅行足迹',
        left: 'center',
        top: 20,
        textStyle: {
          color: colors.textColor,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: ({name}: {name: string}) => {
          const visited = visitedPlaces.includes(name);
          return `${name}<br/>${visited ? '✓ 已去过' : '尚未去过'}`;
        },
        backgroundColor: colors.tooltipBgColor,
        borderColor: colors.borderColor,
        textStyle: {
          color: colors.textColor
        }
      },
      visualMap: {
        show: true,
        type: 'piecewise',
        pieces: [
          { value: 1, label: '已去过' },
          { value: 0, label: '未去过' }
        ],
        inRange: {
          color: [colors.unvisitedColor, colors.visitedColor]
        },
        outOfRange: {
          color: [colors.unvisitedColor]
        },
        textStyle: {
          color: colors.textColor,
          fontWeight: 500
        }
      },
      series: [{
        name: '旅行足迹',
        type: 'map',
        map: 'merged-world',
        roam: true,
        emphasis: {
          label: {
            show: true,
            color: colors.textColor
          },
          itemStyle: {
            areaColor: colors.emphasisColor
          }
        },
        itemStyle: {
          borderColor: colors.borderColor,
          borderWidth: 1,
          borderType: 'solid'
        },
        data: mergedWorldData.features.map((feature: any) => ({
          name: feature.properties.name,
          value: visitedPlaces.includes(feature.properties.name) ? 1 : 0
        })),
        nameProperty: 'name'
      }]
    };

    chart.setOption(option);
    
    // 确保图表初始化后立即调整大小以适应容器
    chart.resize();

    const handleResize = () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    // 监听暗色模式变化并更新图表
    const darkModeObserver = new MutationObserver(() => {
      if (!chartRef.current) return;
      
      // 检查当前是否为暗色模式
      const newIsDarkMode = document.documentElement.classList.contains('dark');
      
      if (chartInstanceRef.current) {
        // 更新颜色设置
        const newColors = {
          textColor: newIsDarkMode ? '#ffffff' : '#374151',
          borderColor: newIsDarkMode ? '#4b5563' : '#d1d5db',
          unvisitedColor: newIsDarkMode ? '#1f2937' : '#e5e7eb',
          visitedColor: newIsDarkMode ? '#059669' : '#10b981',
          emphasisColor: newIsDarkMode ? '#059669' : '#10b981',
          tooltipBgColor: newIsDarkMode ? '#111827' : '#ffffff',
        };
        
        // 更新图表选项
        const newOption = {
          title: {
            textStyle: {
              color: newColors.textColor
            }
          },
          tooltip: {
            backgroundColor: newColors.tooltipBgColor,
            borderColor: newColors.borderColor,
            textStyle: {
              color: newColors.textColor
            }
          },
          visualMap: {
            inRange: {
              color: [newColors.unvisitedColor, newColors.visitedColor]
            },
            outOfRange: {
              color: [newColors.unvisitedColor]
            },
            textStyle: {
              color: newColors.textColor
            }
          },
          series: [{
            emphasis: {
              label: {
                show: true,
                color: newColors.textColor
              },
              itemStyle: {
                areaColor: newColors.emphasisColor
              }
            },
            itemStyle: {
              borderColor: newColors.borderColor,
              borderWidth: 1,
              borderType: 'solid'
            }
          }]
        };
        
        // 应用新选项
        chartInstanceRef.current.setOption(newOption);
      }
    });

    darkModeObserver.observe(document.documentElement, { attributes: true });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
      darkModeObserver.disconnect();
    };
  }, [visitedPlaces]);

  return (
    <div 
      ref={chartRef} 
      className="w-full h-[600px] md:h-[500px] lg:h-[600px] xl:h-[700px] dark:[&_.echarts-tooltip]:bg-[#111827] dark:[&_.echarts-tooltip]:border-[#374151] dark:[&_.echarts-tooltip]:text-white dark:[&_.echarts-title]:text-white dark:[&_.echarts-visual-map]:text-white dark:[&_.echarts-map]:border-[#4b5563] dark:[&_.echarts-map-emphasis]:text-white dark:[&_.echarts-map-emphasis]:bg-[#059669] dark:[&_.echarts-map-unvisited]:bg-[#1f2937] dark:[&_.echarts-map-visited]:bg-[#059669]"
    />
  );
};

export default WorldHeatmap; 