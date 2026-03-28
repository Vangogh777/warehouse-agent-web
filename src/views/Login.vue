<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()

const loginForm = ref({
  username: '',
  password: ''
})

const loading = ref(false)

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true

  try {
    const response = await axios.post('http://localhost:8088/api/auth/login', {
      username: loginForm.value.username,
      password: loginForm.value.password
    })

    if (response.data.success) {
      // 存储 token
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('username', response.data.username)

      ElMessage.success('登录成功')

      // 跳转首页
      router.push('/')
    } else {
      ElMessage.error(response.data.message || '登录失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '登录失败，请检查网络')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center"
       :style="{ backgroundColor: 'var(--bg-primary)' }">
    <div class="w-full max-w-md px-8">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center gradient-primary mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold" :style="{ color: 'var(--text-primary)' }">
          智能仓储 Agent
        </h1>
        <p class="mt-2 text-sm" :style="{ color: 'var(--text-secondary)' }">
          Intelligent Warehouse Assistant
        </p>
      </div>

      <!-- 登录表单 -->
      <div class="rounded-2xl p-8"
           :style="{
             backgroundColor: 'var(--glass-bg)',
             backdropFilter: 'var(--backdrop-blur)',
             border: '1px solid var(--border-color)'
           }">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- 用户名 -->
          <div>
            <label class="block text-sm font-medium mb-2"
                   :style="{ color: 'var(--text-primary)' }">
              用户名
            </label>
            <input
              v-model="loginForm.username"
              type="text"
              placeholder="请输入用户名"
              class="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
              :style="{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }"
              @focus="$event.target.style.borderColor='var(--primary-color)'"
              @blur="$event.target.style.borderColor='var(--border-color)'"
            />
          </div>

          <!-- 密码 -->
          <div>
            <label class="block text-sm font-medium mb-2"
                   :style="{ color: 'var(--text-primary)' }">
              密码
            </label>
            <input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              class="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
              :style="{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }"
              @focus="$event.target.style.borderColor='var(--primary-color)'"
              @blur="$event.target.style.borderColor='var(--border-color)'"
            />
          </div>

          <!-- 登录按钮 -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 rounded-xl font-medium text-white transition-all duration-200 hover:opacity-90"
            :class="{ 'opacity-70 cursor-not-allowed': loading }"
            :style="{ background: 'var(--gradient-primary)' }"
          >
            <span v-if="!loading">登 录</span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              登录中...
            </span>
          </button>
        </form>
      </div>

      <!-- 版权信息 -->
      <p class="text-center mt-8 text-xs" :style="{ color: 'var(--text-secondary)' }">
        &copy; 2024 智能仓储 Agent 系统
      </p>
    </div>
  </div>
</template>

<style scoped>
input::placeholder {
  color: var(--text-muted);
}
</style>