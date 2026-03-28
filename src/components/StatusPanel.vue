<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  warehouseData: { type: Object, default: () => ({}) },
  sessionId: String,
  isDark: Boolean
})

// 仓库数据（包含摄像头信息）
const warehouses = ref([
  {
    id: '001', name: '一号仓', type: '稻谷存储', capacity: 1000,
    temperature: 25.5, humidity: 65, airQuality: '良好',
    ventilation: '关闭', status: '正常', stockLevel: 85,
    cameras: [
      { id: 'cam-001-1', name: '入口监控', status: 'online' },
      { id: 'cam-001-2', name: '仓内全景', status: 'online' },
      { id: 'cam-001-3', name: '通风口监控', status: 'online' }
    ]
  },
  {
    id: '002', name: '二号仓', type: '小麦存储', capacity: 1500,
    temperature: 24.8, humidity: 62, airQuality: '优秀',
    ventilation: '开启', status: '正常', stockLevel: 72,
    cameras: [
      { id: 'cam-002-1', name: '入口监控', status: 'online' },
      { id: 'cam-002-2', name: '仓内全景', status: 'online' },
      { id: 'cam-002-3', name: '温控设备区', status: 'offline' }
    ]
  },
  {
    id: '003', name: '三号仓', type: '玉米存储', capacity: 800,
    temperature: 26.2, humidity: 68, airQuality: '良好',
    ventilation: '关闭', status: '正常', stockLevel: 90,
    cameras: [
      { id: 'cam-003-1', name: '入口监控', status: 'online' },
      { id: 'cam-003-2', name: '仓内全景', status: 'online' }
    ]
  }
])

const selectedWarehouse = ref(null)
const dialogVisible = ref(false)
const selectedCamera = ref(null)
const isVideoLoading = ref(false)
let refreshTimer = null

const refreshData = () => {
  warehouses.value.forEach(wh => {
    wh.temperature = (25 + Math.random() * 3).toFixed(1)
    wh.humidity = Math.floor(60 + Math.random() * 15)
  })
}

const getStatusColor = (status) => ({
  '正常': 'var(--success-color)',
  '警告': 'var(--warning-color)',
  '异常': 'var(--danger-color)'
}[status] || 'var(--text-tertiary)')

const getAirQualityColor = (quality) => ({
  '优秀': 'var(--success-color)',
  '良好': 'var(--accent-color)',
  '一般': 'var(--warning-color)',
  '较差': 'var(--danger-color)'
}[quality] || 'var(--text-tertiary)')

const canVentilate = (wh) => wh.temperature >= 15 && wh.temperature <= 30 && wh.humidity >= 40 && wh.humidity <= 70 && (wh.airQuality === '良好' || wh.airQuality === '优秀')

const showDetail = (warehouse) => {
  selectedWarehouse.value = warehouse
  // 默认选中第一个在线的摄像头
  const onlineCamera = warehouse.cameras.find(c => c.status === 'online')
  selectedCamera.value = onlineCamera || warehouse.cameras[0]
  dialogVisible.value = true
}

const closeDetail = () => {
  selectedWarehouse.value = null
  selectedCamera.value = null
  dialogVisible.value = false
}

const selectCamera = (camera) => {
  if (camera.status === 'offline') return
  isVideoLoading.value = true
  selectedCamera.value = camera
  // 模拟视频加载
  setTimeout(() => {
    isVideoLoading.value = false
  }, 800)
}

// 模拟视频快照URL（实际项目中替换为真实接口）
const getVideoSnapshot = (cameraId) => {
  // 使用 picsum.photos 生成随机图片模拟视频快照
  const seed = cameraId.replace(/-/g, '')
  return `https://picsum.photos/seed/${seed}/800/450`
}

const statistics = computed(() => {
  const total = warehouses.value.length
  const normal = warehouses.value.filter(w => w.status === '正常').length
  const avgTemp = (warehouses.value.reduce((sum, w) => sum + parseFloat(w.temperature), 0) / total).toFixed(1)
  const avgHumidity = Math.floor(warehouses.value.reduce((sum, w) => sum + w.humidity, 0) / total)
  return { total, normal, warning: total - normal, avgTemp, avgHumidity }
})

onMounted(() => { refreshTimer = setInterval(refreshData, 10000) })
onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer) })
</script>

<template>
  <div class="h-full flex flex-col space-y-5">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="(stat, index) in [
        { label: '仓库总数', value: statistics.total, icon: '📦', color: 'var(--accent-color)' },
        { label: '平均温度', value: statistics.avgTemp + '°C', icon: '🌡️', color: 'var(--warning-color)' },
        { label: '平均湿度', value: statistics.avgHumidity + '%', icon: '💧', color: 'var(--accent-color)' },
        { label: '正常运行', value: statistics.normal + '/' + statistics.total, icon: '✅', color: 'var(--success-color)' }
      ]" :key="stat.label" class="glass-card p-5 hover-lift animate-fadeIn" :style="{ animationDelay: `${index * 0.05}s` }">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm mb-1" :style="{ color: 'var(--text-secondary)' }">{{ stat.label }}</div>
            <div class="text-2xl font-bold" :style="{ color: 'var(--text-primary)' }">{{ stat.value }}</div>
          </div>
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
               :style="{ backgroundColor: stat.color + '15' }">
            {{ stat.icon }}
          </div>
        </div>
      </div>
    </div>

    <!-- 仓库列表 -->
    <div class="flex-1 glass-card flex flex-col overflow-hidden animate-fadeIn" style="animation-delay: 0.15s">
      <div class="px-6 py-4 flex items-center justify-between border-b" :style="{ borderColor: 'var(--border-color)' }">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center"
               :style="{ backgroundColor: 'var(--success-color)' }">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <span class="font-semibold" :style="{ color: 'var(--text-primary)' }">仓库监控</span>
        </div>
        <button @click="refreshData" class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover-scale"
                :style="{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }">
          刷新数据
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-5 space-y-4">
        <div v-for="(wh, index) in warehouses" :key="wh.id"
             class="p-5 rounded-2xl cursor-pointer transition-all duration-200 hover-lift animate-fadeIn"
             :style="{
               backgroundColor: 'var(--bg-tertiary)',
               animationDelay: `${0.2 + index * 0.05}s`
             }"
             @click="showDetail(wh)">
          <!-- 头部 -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                   :style="{ backgroundColor: 'var(--accent-color)' }">🏪</div>
              <div>
                <div class="font-semibold" :style="{ color: 'var(--text-primary)' }">{{ wh.name }}</div>
                <div class="text-xs" :style="{ color: 'var(--text-tertiary)' }">{{ wh.type }}</div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <!-- 摄像头状态指示 -->
              <div class="flex items-center space-x-1 px-2 py-1 rounded-lg"
                   :style="{ backgroundColor: 'rgba(52, 199, 89, 0.1)' }">
                <svg class="w-3 h-3" :style="{ color: 'var(--success-color)' }" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                </svg>
                <span class="text-xs" :style="{ color: 'var(--success-color)' }">
                  {{ wh.cameras.filter(c => c.status === 'online').length }}/{{ wh.cameras.length }}
                </span>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-medium"
                    :style="{ backgroundColor: getStatusColor(wh.status) + '20', color: getStatusColor(wh.status) }">
                {{ wh.status }}
              </span>
            </div>
          </div>

          <!-- 数据 -->
          <div class="grid grid-cols-3 gap-3 mb-4">
            <div class="p-3 rounded-xl text-center" :style="{ backgroundColor: 'rgba(255, 149, 0, 0.1)' }">
              <div class="text-xs mb-1" :style="{ color: 'var(--text-tertiary)' }">温度</div>
              <div class="text-lg font-semibold" :style="{ color: 'var(--warning-color)' }">{{ wh.temperature }}°C</div>
            </div>
            <div class="p-3 rounded-xl text-center" :style="{ backgroundColor: 'rgba(0, 122, 255, 0.1)' }">
              <div class="text-xs mb-1" :style="{ color: 'var(--text-tertiary)' }">湿度</div>
              <div class="text-lg font-semibold" :style="{ color: 'var(--accent-color)' }">{{ wh.humidity }}%</div>
            </div>
            <div class="p-3 rounded-xl text-center" :style="{ backgroundColor: getAirQualityColor(wh.airQuality) + '15' }">
              <div class="text-xs mb-1" :style="{ color: 'var(--text-tertiary)' }">空气质量</div>
              <div class="text-sm font-semibold" :style="{ color: getAirQualityColor(wh.airQuality) }">{{ wh.airQuality }}</div>
            </div>
          </div>

          <!-- 底部 -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 text-sm" :style="{ color: 'var(--text-secondary)' }">
              <span>💨 {{ wh.ventilation }}</span>
              <span>📦 {{ wh.stockLevel }}%</span>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-medium"
                  :style="{
                    backgroundColor: canVentilate(wh) ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 149, 0, 0.1)',
                    color: canVentilate(wh) ? 'var(--success-color)' : 'var(--warning-color)'
                  }">
              {{ canVentilate(wh) ? '适合通风' : '不建议通风' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 会话信息 -->
    <div v-if="sessionId" class="glass-card p-4 animate-fadeIn" style="animation-delay: 0.3s">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2 text-sm" :style="{ color: 'var(--text-secondary)' }">
          <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: 'var(--success-color)' }"></span>
          会话: {{ sessionId.substring(0, 8) }}...
        </div>
        <span class="px-3 py-1 rounded-full text-xs" :style="{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }">
          实时同步
        </span>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="selectedWarehouse?.name + ' - 详情'"
      width="680px"
      @close="closeDetail"
      class="rounded-3xl"
    >
      <div v-if="selectedWarehouse" class="space-y-5">
        <!-- 视频监控区域 -->
        <div class="rounded-2xl overflow-hidden" :style="{ backgroundColor: 'var(--bg-tertiary)' }">
          <!-- 视频头部 -->
          <div class="px-4 py-3 flex items-center justify-between border-b"
               :style="{ borderColor: 'var(--border-color)' }">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 rounded-full animate-pulse" :style="{ backgroundColor: 'var(--danger-color)' }"></div>
              <span class="text-sm font-medium" :style="{ color: 'var(--text-primary)' }">
                实时监控 · {{ selectedCamera?.name }}
              </span>
            </div>
            <span class="text-xs px-2 py-1 rounded-lg"
                  :style="{ backgroundColor: selectedCamera?.status === 'online' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(142, 142, 147, 0.1)', color: selectedCamera?.status === 'online' ? 'var(--success-color)' : 'var(--text-tertiary)' }">
              {{ selectedCamera?.status === 'online' ? '在线' : '离线' }}
            </span>
          </div>

          <!-- 视频画面 -->
          <div class="relative aspect-video bg-black">
            <!-- 加载状态 -->
            <div v-if="isVideoLoading" class="absolute inset-0 flex items-center justify-center"
                 :style="{ backgroundColor: 'var(--bg-tertiary)' }">
              <div class="flex flex-col items-center space-y-3">
                <svg class="w-8 h-8 animate-spin" :style="{ color: 'var(--accent-color)' }" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-sm" :style="{ color: 'var(--text-secondary)' }">加载中...</span>
              </div>
            </div>

            <!-- 视频图片（假数据） -->
            <img
              v-else-if="selectedCamera?.status === 'online'"
              :src="getVideoSnapshot(selectedCamera?.id)"
              :alt="selectedCamera?.name"
              class="w-full h-full object-cover"
              @load="isVideoLoading = false"
            />

            <!-- 离线状态 -->
            <div v-else class="absolute inset-0 flex items-center justify-center"
                 :style="{ backgroundColor: 'var(--bg-tertiary)' }">
              <div class="flex flex-col items-center space-y-2">
                <svg class="w-12 h-12" :style="{ color: 'var(--text-tertiary)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <span class="text-sm" :style="{ color: 'var(--text-tertiary)' }">摄像头离线</span>
              </div>
            </div>

            <!-- 视频控制条 -->
            <div class="absolute bottom-0 left-0 right-0 px-4 py-2 flex items-center justify-between"
                 style="background: linear-gradient(transparent, rgba(0,0,0,0.6))">
              <div class="flex items-center space-x-3">
                <button class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
                  </svg>
                </button>
                <span class="text-xs text-white/80">{{ new Date().toLocaleTimeString() }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <button class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                  </svg>
                </button>
                <button class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 摄像头列表 -->
          <div class="p-3 flex space-x-2 overflow-x-auto">
            <button
              v-for="camera in selectedWarehouse.cameras"
              :key="camera.id"
              @click="selectCamera(camera)"
              :disabled="camera.status === 'offline'"
              class="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              :style="{
                backgroundColor: selectedCamera?.id === camera.id ? 'var(--accent-color)' : 'var(--bg-secondary)',
                color: selectedCamera?.id === camera.id ? '#fff' : camera.status === 'offline' ? 'var(--text-tertiary)' : 'var(--text-primary)',
                opacity: camera.status === 'offline' ? 0.5 : 1,
                cursor: camera.status === 'offline' ? 'not-allowed' : 'pointer'
              }"
            >
              <span class="flex items-center space-x-2">
                <span class="w-1.5 h-1.5 rounded-full"
                      :style="{ backgroundColor: camera.status === 'online' ? (selectedCamera?.id === camera.id ? '#fff' : 'var(--success-color)') : 'var(--text-tertiary)' }"></span>
                <span>{{ camera.name }}</span>
              </span>
            </button>
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="grid grid-cols-4 gap-3">
          <div v-for="item in [
            { label: '仓库编号', value: selectedWarehouse.id },
            { label: '存储类型', value: selectedWarehouse.type },
            { label: '仓库容量', value: selectedWarehouse.capacity + ' 吨' },
            { label: '库存水平', value: selectedWarehouse.stockLevel + '%' }
          ]" :key="item.label" class="p-4 rounded-xl" :style="{ backgroundColor: 'var(--bg-tertiary)' }">
            <div class="text-xs mb-1" :style="{ color: 'var(--text-tertiary)' }">{{ item.label }}</div>
            <div class="text-base font-semibold" :style="{ color: 'var(--text-primary)' }">{{ item.value }}</div>
          </div>
        </div>

        <!-- 环境数据 -->
        <div class="grid grid-cols-3 gap-4">
          <div v-for="(item, i) in [
            { label: '温度', value: selectedWarehouse.temperature + '°C', color: 'var(--warning-color)', percent: selectedWarehouse.temperature / 40 * 100 },
            { label: '湿度', value: selectedWarehouse.humidity + '%', color: 'var(--accent-color)', percent: selectedWarehouse.humidity },
            { label: '库存', value: selectedWarehouse.stockLevel + '%', color: 'var(--success-color)', percent: selectedWarehouse.stockLevel }
          ]" :key="item.label" class="text-center">
            <el-progress type="dashboard" :percentage="item.percent" :color="item.color" :width="72">
              <template #default><span class="text-sm font-semibold">{{ item.value }}</span></template>
            </el-progress>
            <div class="text-xs mt-2" :style="{ color: 'var(--text-tertiary)' }">{{ item.label }}</div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <button @click="closeDetail" class="px-5 py-2 rounded-xl font-medium transition-all duration-200 hover-scale"
                  :style="{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }">
            关闭
          </button>
          <button class="px-5 py-2 rounded-xl font-medium transition-all duration-200 hover-scale"
                  :style="{ backgroundColor: 'var(--accent-color)', color: '#fff' }">
            <span class="flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              <span>全屏查看</span>
            </span>
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
:deep(.el-dialog) { border-radius: 24px !important; }
:deep(.el-dialog__header) { padding: 20px 24px 0; }
:deep(.el-dialog__body) { padding: 20px 24px; }
:deep(.el-dialog__footer) { padding: 0 24px 20px; }

/* 隐藏滚动条但保持滚动功能 */
.overflow-x-auto::-webkit-scrollbar {
  display: none;
}
.overflow-x-auto {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>