<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import ChatPanel from './components/ChatPanel.vue'
import StatusPanel from './components/StatusPanel.vue'
import { authApi } from './api'

const router = useRouter()

// 主题状态
const isDark = ref(false)

// 切换主题
const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// 初始化主题
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})

// 系统状态
const systemStatus = ref({
  status: 'UP',
  activeSessions: 0
})

// 当前会话ID
const sessionId = ref(null)

// 仓库数据
const warehouseData = ref({})

// 更新仓库数据
const updateWarehouseData = (data) => {
  if (data) {
    warehouseData.value = { ...warehouseData.value, ...data }
  }
}

// 更新会话ID
const updateSessionId = (id) => {
  sessionId.value = id
}

// 获取系统状态
const fetchStatus = async () => {
  try {
    const response = await fetch('http://localhost:8088/api/agent/status')
    const data = await response.json()
    systemStatus.value = data
  } catch (error) {
    console.error('获取状态失败:', error)
  }
}

// 用户信息
const username = ref('')

// 登出
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('username')

    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (e) {
    // 用户取消
  }
}

// 验证登录状态
onMounted(async () => {
  const token = localStorage.getItem('token')
  const savedUsername = localStorage.getItem('username')

  if (!token) {
    router.push('/login')
    return
  }

  // 验证 token 有效性
  try {
    const result = await authApi.verify()
    if (!result.valid) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      router.push('/login')
      return
    }
    username.value = savedUsername || result.username
  } catch (e) {
    router.push('/login')
    return
  }

  fetchStatus()
  setInterval(fetchStatus, 30000)
})
</script>

<template>
  <div class="min-h-screen transition-colors duration-300"
       :style="{ backgroundColor: 'var(--bg-primary)' }">

    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-50"
            :style="{
              backgroundColor: 'var(--glass-bg)',
              backdropFilter: 'var(--backdrop-blur)',
              borderBottom: '1px solid var(--border-color)'
            }">
      <div class="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center gradient-primary">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <div>
            <h1 class="text-lg font-semibold" :style="{ color: 'var(--text-primary)' }">
              智能仓储 Agent
            </h1>
            <p class="text-xs" :style="{ color: 'var(--text-secondary)' }">
              Intelligent Warehouse Assistant
            </p>
          </div>
        </div>

        <!-- 右侧操作 -->
        <div class="flex items-center space-x-4">
          <!-- 服务状态 -->
          <div class="flex items-center space-x-2 px-4 py-2 rounded-full"
               :style="{ backgroundColor: 'var(--bg-tertiary)' }">
            <span class="w-2 h-2 rounded-full"
                  :class="systemStatus.status === 'UP' ? 'bg-green-500' : 'bg-red-500'"></span>
            <span class="text-sm font-medium" :style="{ color: 'var(--text-secondary)' }">
              {{ systemStatus.status === 'UP' ? '服务正常' : '服务异常' }}
            </span>
          </div>

          <!-- 活跃会话 -->
          <div class="px-4 py-2 rounded-full" :style="{ backgroundColor: 'var(--bg-tertiary)' }">
            <span class="text-sm" :style="{ color: 'var(--text-secondary)' }">
              活跃会话: <span class="font-semibold" :style="{ color: 'var(--text-primary)' }">{{ systemStatus.activeSessions || 0 }}</span>
            </span>
          </div>

          <!-- 用户信息 -->
          <div class="flex items-center space-x-2 px-4 py-2 rounded-full"
               :style="{ backgroundColor: 'var(--bg-tertiary)' }">
            <svg class="w-4 h-4" :style="{ color: 'var(--text-secondary)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <span class="text-sm font-medium" :style="{ color: 'var(--text-primary)' }">
              {{ username }}
            </span>
          </div>

          <!-- 主题切换按钮 -->
          <button @click="toggleTheme"
                  class="w-10 h-10 rounded-full flex items-center justify-center hover-scale"
                  :style="{ backgroundColor: 'var(--bg-tertiary)' }">
            <svg v-if="isDark" class="w-5 h-5" :style="{ color: 'var(--text-primary)' }"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <svg v-else class="w-5 h-5" :style="{ color: 'var(--text-primary)' }"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
          </button>

          <!-- 退出登录 -->
          <button @click="handleLogout"
                  class="w-10 h-10 rounded-full flex items-center justify-center hover-scale"
                  :style="{ backgroundColor: 'var(--bg-tertiary)' }"
                  title="退出登录">
            <svg class="w-5 h-5" :style="{ color: 'var(--text-primary)' }"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="max-w-[1600px] mx-auto px-6 py-6">
      <div class="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
        <!-- 左侧：聊天面板 -->
        <div class="w-full lg:w-[55%] xl:w-[58%] animate-slideUp" style="animation-delay: 0.1s">
          <ChatPanel
            :session-id="sessionId"
            :is-dark="isDark"
            @update:session-id="updateSessionId"
            @update:data="updateWarehouseData"
          />
        </div>

        <!-- 右侧：状态面板 -->
        <div class="w-full lg:w-[45%] xl:w-[42%] animate-slideUp" style="animation-delay: 0.2s">
          <StatusPanel
            :warehouse-data="warehouseData"
            :session-id="sessionId"
            :is-dark="isDark"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>