import { useState } from 'react'
import { View, Text, ScrollView, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { mockUser, problemTypeMap } from '../../utils/mock'
import { problemStore, taskStore } from '../../utils/store'
import './index.scss'

export default function Statistics() {
  const [activeChart, setActiveChart] = useState('trend')
  const [stats, setStats] = useState({
    totalPatrols: 0,
    totalDistance: 0,
    totalProblems: 0,
    completedProblems: 0,
    overdueProblems: 0,
    problemTypes: [] as { type: string; count: number }[],
    heatmapData: [] as { latitude: number; longitude: number; count: number }[],
  })

  useDidShow(() => {
    const problems = problemStore.getAll()
    const tasks = taskStore.getAll()
    
    const completedProblems = problems.filter(p => p.status === 'verified' || p.status === 'completed').length
    const overdueProblems = problems.filter(p => 
      p.status !== 'verified' && p.rectifyDeadline && new Date(p.rectifyDeadline) < new Date()
    ).length

    const typeCounts: Record<string, number> = {}
    problems.forEach(p => {
      const label = problemTypeMap[p.type]?.label || p.type
      typeCounts[label] = (typeCounts[label] || 0) + 1
    })
    const problemTypes = Object.entries(typeCounts).map(([type, count]) => ({ type, count }))

    const heatmapMap: Record<string, { latitude: number; longitude: number; count: number }> = {}
    problems.forEach(p => {
      const key = `${p.latitude.toFixed(4)},${p.longitude.toFixed(4)}`
      if (!heatmapMap[key]) {
        heatmapMap[key] = { latitude: p.latitude, longitude: p.longitude, count: 0 }
      }
      heatmapMap[key].count++
    })
    const heatmapData = Object.values(heatmapMap)

    const totalDistance = tasks.reduce((sum, t) => sum + (t.distance || 0), 0)

    setStats({
      totalPatrols: tasks.length,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalProblems: problems.length,
      completedProblems,
      overdueProblems,
      problemTypes,
      heatmapData,
    })
  })

  const completionRate = stats.totalProblems > 0 
    ? Math.round((stats.completedProblems / stats.totalProblems) * 100)
    : 0

  const generateReport = () => {
    Taro.showLoading({ title: '生成报告中...' })
    setTimeout(() => {
      Taro.hideLoading()
      Taro.showModal({
        title: '报告已生成',
        content: '月度履职报告已生成，是否查看？',
        confirmText: '查看报告',
        success: (res) => {
          if (res.confirm) {
            Taro.showToast({ title: '报告预览', icon: 'success' })
          }
        },
      })
    }, 1500)
  }

  const getHeatmapColor = (count: number) => {
    if (count >= 10) return 'rgba(255, 77, 79, 0.8)'
    if (count >= 7) return 'rgba(250, 173, 20, 0.8)'
    if (count >= 4) return 'rgba(22, 119, 255, 0.8)'
    return 'rgba(82, 196, 26, 0.8)'
  }

  return (
    <ScrollView className='statistics-page' scrollY>
      <View className='user-card'>
        <View className='user-avatar'>
          <Text className='avatar-text'>{mockUser.name.charAt(0)}</Text>
        </View>
        <View className='user-info'>
          <Text className='user-name'>{mockUser.name}</Text>
          <Text className='user-role'>{mockUser.role === 'riverChief' ? '乡镇河湖长' : '巡查员'}</Text>
          <Text className='user-dept'>{mockUser.department}</Text>
        </View>
      </View>

      <View className='stats-overview'>
        <View className='overview-item'>
          <Text className='overview-value'>{stats.totalPatrols}</Text>
          <Text className='overview-label'>巡查次数</Text>
        </View>
        <View className='overview-item'>
          <Text className='overview-value'>{stats.totalDistance}</Text>
          <Text className='overview-label'>巡查里程(km)</Text>
        </View>
        <View className='overview-item'>
          <Text className='overview-value'>{stats.totalProblems}</Text>
          <Text className='overview-label'>上报问题</Text>
        </View>
        <View className='overview-item'>
          <Text className='overview-value success'>{completionRate}%</Text>
          <Text className='overview-label'>整改完成率</Text>
        </View>
      </View>

      {stats.overdueProblems > 0 && (
        <View className='warning-card'>
          <View className='warning-icon'>⚠️</View>
          <View className='warning-content'>
            <Text className='warning-title'>超期问题提醒</Text>
            <Text className='warning-text'>您有 {stats.overdueProblems} 个问题已超期未整改，请及时处理</Text>
          </View>
        </View>
      )}

      <View className='chart-section'>
        <View className='section-header'>
          <Text className='section-title'>数据统计</Text>
          <View className='chart-tabs'>
            <Text
              className={`chart-tab ${activeChart === 'trend' ? 'tab-active' : ''}`}
              onClick={() => setActiveChart('trend')}
            >
              巡查趋势
            </Text>
            <Text
              className={`chart-tab ${activeChart === 'type' ? 'tab-active' : ''}`}
              onClick={() => setActiveChart('type')}
            >
              问题分类
            </Text>
            <Text
              className={`chart-tab ${activeChart === 'heatmap' ? 'tab-active' : ''}`}
              onClick={() => setActiveChart('heatmap')}
            >
              热力图
            </Text>
          </View>
        </View>

        {activeChart === 'trend' && (
          <View className='chart-container'>
            <View className='chart-legend'>
              <View className='legend-item'>
                <View className='legend-color patrol' />
                <Text>巡查次数</Text>
              </View>
              <View className='legend-item'>
                <View className='legend-color distance' />
                <Text>巡查里程(km)</Text>
              </View>
            </View>
            <View className='bar-chart'>
              {Array.from({ length: 6 }, (_, i) => {
                const month = new Date()
                month.setMonth(month.getMonth() - 5 + i)
                const monthStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
                const count = Math.floor(Math.random() * 15) + 10
                const distance = Math.round((Math.random() * 50 + 30) * 10) / 10
                return (
                  <View key={i} className='bar-group'>
                    <View className='bars'>
                      <View 
                        className='bar bar-count'
                        style={{ height: `${(count / 30) * 100}%` }}
                      >
                        <Text className='bar-value'>{count}</Text>
                      </View>
                      <View 
                        className='bar bar-distance'
                        style={{ height: `${(distance / 100) * 100}%` }}
                      >
                        <Text className='bar-value'>{distance}</Text>
                      </View>
                    </View>
                    <Text className='bar-label'>{monthStr.slice(-2)}月</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {activeChart === 'type' && (
          <View className='chart-container'>
            <View className='pie-chart'>
              <View className='pie-center'>
                <Text className='pie-total'>{stats.totalProblems}</Text>
                <Text className='pie-label'>问题总数</Text>
              </View>
            </View>
            <View className='type-list'>
              {stats.problemTypes.length > 0 ? (
                stats.problemTypes.map((item, index) => (
                  <View key={index} className='type-item'>
                    <View 
                      className='type-color' 
                      style={{ 
                        backgroundColor: [
                          '#faad14', '#1677ff', '#ff4d4f', '#722ed1', '#eb2f96', '#8c8c8c'
                        ][index % 6] 
                      }} 
                    />
                    <Text className='type-name'>{item.type}</Text>
                    <Text className='type-count'>{item.count}</Text>
                    <Text className='type-percent'>
                      {stats.totalProblems > 0 ? Math.round((item.count / stats.totalProblems) * 100) : 0}%
                    </Text>
                  </View>
                ))
              ) : (
                <View className='empty-state'>
                  <Text className='empty-text'>暂无数据</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activeChart === 'heatmap' && (
          <View className='chart-container'>
            <View className='heatmap-container'>
              <View className='heatmap-map'>
                <Text className='map-placeholder'>
                  🗺️ 问题热力图
                </Text>
                {stats.heatmapData.length > 0 ? (
                  stats.heatmapData.map((item, index) => (
                    <View
                      key={index}
                      className='heat-point'
                      style={{
                        left: `${50 + (item.longitude - 121.47) * 2000}%`,
                        top: `${50 - (item.latitude - 31.23) * 2000}%`,
                        backgroundColor: getHeatmapColor(item.count),
                        width: `${20 + item.count * 3}px`,
                        height: `${20 + item.count * 3}px`,
                      }}
                    >
                      <Text className='point-count'>{item.count}</Text>
                    </View>
                  ))
                ) : (
                  <View className='empty-state'>
                    <Text className='empty-text'>暂无数据</Text>
                  </View>
                )}
              </View>
              <View className='heatmap-legend'>
                <View className='legend-row'>
                  <View className='legend-color' style={{ backgroundColor: 'rgba(82, 196, 26, 0.8)' }} />
                  <Text>少 (1-3)</Text>
                </View>
                <View className='legend-row'>
                  <View className='legend-color' style={{ backgroundColor: 'rgba(22, 119, 255, 0.8)' }} />
                  <Text>中 (4-6)</Text>
                </View>
                <View className='legend-row'>
                  <View className='legend-color' style={{ backgroundColor: 'rgba(250, 173, 20, 0.8)' }} />
                  <Text>多 (7-9)</Text>
                </View>
                <View className='legend-row'>
                  <View className='legend-color' style={{ backgroundColor: 'rgba(255, 77, 79, 0.8)' }} />
                  <Text>很多 (10+)</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      <View className='report-section'>
        <Text className='section-title'>月度履职报告</Text>
        <View className='report-card'>
          <View className='report-icon'>📊</View>
          <View className='report-info'>
            <Text className='report-title'>{new Date().getFullYear()}年{new Date().getMonth() + 1}月履职报告</Text>
            <Text className='report-desc'>包含巡查统计、问题分析、整改情况等</Text>
          </View>
          <Button className='report-btn' onClick={generateReport}>
            生成报告
          </Button>
        </View>
      </View>

      <View className='quick-stats'>
        <Text className='section-title'>快速统计</Text>
        <View className='quick-grid'>
          <View className='quick-item'>
            <Text className='quick-icon'>🏆</Text>
            <Text className='quick-label'>本月排名</Text>
            <Text className='quick-value'>第 3 名</Text>
          </View>
          <View className='quick-item'>
            <Text className='quick-icon'>📅</Text>
            <Text className='quick-label'>本月巡查</Text>
            <Text className='quick-value'>{Math.floor(Math.random() * 10) + 15} 次</Text>
          </View>
          <View className='quick-item'>
            <Text className='quick-icon'>📍</Text>
            <Text className='quick-label'>打卡完成率</Text>
            <Text className='quick-value'>98%</Text>
          </View>
          <View className='quick-item'>
            <Text className='quick-icon'>⏱️</Text>
            <Text className='quick-label'>平均时长</Text>
            <Text className='quick-value'>2.5h</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
