<script setup>
import { ref, nextTick, onMounted, watch, computed } from 'vue'
import { agentApi } from '../api'
import { marked } from 'marked'

const props = defineProps({
  sessionId: String,
  isDark: Boolean
})

const emit = defineEmits(['update:sessionId', 'update:data'])

// 历史对话列表
const chatHistories = ref([])

// 当前选中的历史对话ID
const currentHistoryId = ref(null)

// 是否显示历史侧边栏
const showHistory = ref(true)

// 消息列表
const messages = ref([])

// 输入框内容
const inputMessage = ref('')

// 加载状态
const loading = ref(false)

// 消息容器引用
const messagesContainer = ref(null)

// 打字效果
const isTyping = ref(false)
const typingContent = ref('')

// 生成唯一ID
const generateId = () => {
  return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 生成对话标题
const generateTitle = (msgs) => {
  const firstUserMsg = msgs.find(m => m.role === 'user')
  if (firstUserMsg) {
    return firstUserMsg.content.slice(0, 20) + (firstUserMsg.content.length > 20 ? '...' : '')
  }
  return '新对话'
}

// 保存当前对话到历史
const saveToHistory = () => {
  if (messages.value.length <= 1) return

  const title = generateTitle(messages.value)

  if (currentHistoryId.value) {
    // 更新现有历史
    const index = chatHistories.value.findIndex(h => h.id === currentHistoryId.value)
    if (index !== -1) {
      chatHistories.value[index] = {
        ...chatHistories.value[index],
        title,
        messages: JSON.parse(JSON.stringify(messages.value)),
        updatedAt: new Date().toISOString()
      }
    }
  } else {
    // 创建新历史
    const newHistory = {
      id: generateId(),
      title,
      messages: JSON.parse(JSON.stringify(messages.value)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    chatHistories.value.unshift(newHistory)
    currentHistoryId.value = newHistory.id
  }

  saveHistoriesToStorage()
}

// 从 localStorage 加载历史
const loadHistoriesFromStorage = () => {
  try {
    const stored = localStorage.getItem('warehouse_chat_histories')
    if (stored) {
      chatHistories.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('加载历史对话失败:', error)
  }
}

// 保存历史到 localStorage
const saveHistoriesToStorage = () => {
  try {
    localStorage.setItem('warehouse_chat_histories', JSON.stringify(chatHistories.value))
  } catch (error) {
    console.error('保存历史对话失败:', error)
  }
}

// 切换到指定历史对话
const switchHistory = (history) => {
  if (currentHistoryId.value === history.id) return

  // 先保存当前对话
  saveToHistory()

  // 切换到新对话
  currentHistoryId.value = history.id
  messages.value = JSON.parse(JSON.stringify(history.messages))
  emit('update:sessionId', null)

  nextTick(() => scrollToBottom())
}

// 创建新对话
const createNewChat = async () => {
  // 保存当前对话
  saveToHistory()

  // 清空当前对话
  if (props.sessionId) {
    try {
      await agentApi.clearSession(props.sessionId)
    } catch (error) {
      console.error('清除会话失败:', error)
    }
  }

  currentHistoryId.value = null
  messages.value = []
  emit('update:sessionId', null)

  // 添加欢迎消息
  messages.value.push({
    role: 'assistant',
    content: '您好！我是智能仓储助手，可以帮您查询仓库温湿度、控制通风设备、查看运行状态等。请问有什么可以帮您的？',
    timestamp: new Date().toLocaleTimeString()
  })
}

// 删除历史对话
const deleteHistory = (e, historyId) => {
  e.stopPropagation()

  const index = chatHistories.value.findIndex(h => h.id === historyId)
  if (index !== -1) {
    chatHistories.value.splice(index, 1)
    saveHistoriesToStorage()

    // 如果删除的是当前对话，切换到新对话
    if (currentHistoryId.value === historyId) {
      createNewChat()
    }
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

// 发送消息
const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || loading.value) return

  messages.value.push({
    role: 'user',
    content: message,
    timestamp: new Date().toLocaleTimeString()
  })

  inputMessage.value = ''
  loading.value = true
  await nextTick()
  scrollToBottom()

  try {
    const response = await agentApi.chat(message, props.sessionId)

    if (response.success) {
      if (response.sessionId) {
        emit('update:sessionId', response.sessionId)
      }

      await typeMessage(response.content)

      messages.value.push({
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls || [],
        timestamp: new Date().toLocaleTimeString()
      })

      extractData(response)

      // 保存对话历史
      saveToHistory()
    } else {
      messages.value.push({
        role: 'error',
        content: response.error || '处理请求失败',
        timestamp: new Date().toLocaleTimeString()
      })
    }
  } catch (error) {
    messages.value.push({
      role: 'error',
      content: '网络错误，请检查后端服务是否启动',
      timestamp: new Date().toLocaleTimeString()
    })
  } finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
  }
}

// 打字效果
const typeMessage = async (content) => {
  isTyping.value = true
  typingContent.value = ''

  const chars = content.split('')
  for (let i = 0; i < chars.length; i++) {
    typingContent.value += chars[i]
    await new Promise(resolve => setTimeout(resolve, 15))
  }

  isTyping.value = false
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 提取数据
const extractData = (response) => {
  if (response.toolCalls && response.toolCalls.length > 0) {
    emit('update:data', {
      lastQuery: response.content,
      tools: response.toolCalls
    })
  }
}

// 清空当前对话
const clearChat = async () => {
  await createNewChat()
}

// 渲染Markdown
const renderMarkdown = (content) => {
  return marked(content)
}

// 快捷命令
const quickCommands = [
  { label: '查询温湿度', icon: '🌡️', message: '一号仓现在的温湿度情况' },
  { label: '检查通风', icon: '💨', message: '一号仓能通风吗' },
  { label: '开启通风', icon: '🔄', message: '帮我一号仓开启通风' },
  { label: '查询状态', icon: '📊', message: '一号仓的运行状态' }
]

const sendQuickCommand = (message) => {
  inputMessage.value = message
  sendMessage()
}

// 切换历史侧边栏
const toggleHistory = () => {
  showHistory.value = !showHistory.value
}

onMounted(() => {
  loadHistoriesFromStorage()

  messages.value.push({
    role: 'assistant',
    content: '您好！我是智能仓储助手，可以帮您查询仓库温湿度、控制通风设备、查看运行状态等。请问有什么可以帮您的？',
    timestamp: new Date().toLocaleTimeString()
  })
})
</script>

<template>
  <div class="h-full flex overflow-hidden rounded-3xl"
       :style="{ backgroundColor: 'var(--glass-bg)' }">

    <!-- 历史对话侧边栏 -->
    <div
      class="flex-shrink-0 border-r flex flex-col overflow-hidden transition-all duration-300"
      :style="{
        width: showHistory ? '220px' : '0px',
        minWidth: showHistory ? '220px' : '0px',
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--bg-secondary)'
      }"
    >
      <!-- 历史头部 -->
      <div class="px-4 py-4 border-b" :style="{ borderColor: 'var(--border-color)' }">
        <button
          @click="createNewChat"
          class="w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 hover-scale flex items-center justify-center space-x-2"
          :style="{
            backgroundColor: 'var(--accent-color)',
            color: '#ffffff'
          }"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>新建对话</span>
        </button>
      </div>

      <!-- 历史列表 -->
      <div class="flex-1 overflow-y-auto p-2">
        <div class="space-y-1">
          <div
            v-for="history in chatHistories"
            :key="history.id"
            @click="switchHistory(history)"
            class="p-3 rounded-xl cursor-pointer transition-all duration-200 group"
            :style="{
              backgroundColor: currentHistoryId === history.id ? 'var(--accent-color)' : 'transparent',
              color: currentHistoryId === history.id ? '#ffffff' : 'var(--text-primary)'
            }"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate" :style="{ color: 'inherit' }">
                  {{ history.title }}
                </div>
                <div class="text-xs mt-1 opacity-60">
                  {{ formatDate(history.updatedAt) }}
                </div>
              </div>
              <button
                @click="deleteHistory($event, history.id)"
                class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-black/10"
                :style="{ color: 'inherit' }"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="chatHistories.length === 0" class="py-8 text-center">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-30" :style="{ color: 'var(--text-tertiary)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            <div class="text-sm" :style="{ color: 'var(--text-tertiary)' }">暂无历史对话</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主对话区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 标题栏 -->
      <div class="px-6 py-4 flex items-center justify-between border-b"
           :style="{ borderColor: 'var(--border-color)' }">
        <div class="flex items-center space-x-3">
          <!-- 切换历史按钮 -->
          <button
            @click="toggleHistory"
            class="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover-scale"
            :style="{ backgroundColor: 'var(--bg-tertiary)' }"
          >
            <svg class="w-4 h-4" :style="{ color: 'var(--text-primary)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <div class="w-8 h-8 rounded-xl flex items-center justify-center"
               :style="{ backgroundColor: 'var(--accent-color)' }">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <span class="font-semibold" :style="{ color: 'var(--text-primary)' }">对话窗口</span>
        </div>
        <button
          @click="clearChat"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover-scale"
          :style="{
            backgroundColor: 'rgba(255, 59, 48, 0.1)',
            color: 'var(--danger-color)'
          }"
        >
          新对话
        </button>
      </div>

      <!-- 快捷命令 -->
      <div class="px-6 py-3 flex flex-wrap gap-2 border-b"
           :style="{ borderColor: 'var(--border-color)' }">
        <button
          v-for="cmd in quickCommands"
          :key="cmd.label"
          @click="sendQuickCommand(cmd.message)"
          class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover-scale"
          :style="{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)'
          }"
        >
          <span class="mr-1">{{ cmd.icon }}</span>
          {{ cmd.label }}
        </button>
      </div>

      <!-- 消息区域 -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="animate-fadeIn"
          :class="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'"
        >
          <div
            class="max-w-[85%] px-5 py-3 rounded-3xl transition-all duration-200"
            :style="{
              backgroundColor: msg.role === 'user' ? 'var(--accent-color)' :
                             msg.role === 'error' ? 'rgba(255, 59, 48, 0.1)' : 'var(--bg-tertiary)',
              color: msg.role === 'user' ? '#ffffff' :
                    msg.role === 'error' ? 'var(--danger-color)' : 'var(--text-primary)',
              borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px'
            }"
          >
            <!-- 消息内容 -->
            <div v-if="msg.role === 'assistant'" class="prose prose-sm max-w-none"
                 :style="{ color: 'var(--text-primary)' }"
                 v-html="renderMarkdown(msg.content)"></div>
            <div v-else class="text-[15px] leading-relaxed">{{ msg.content }}</div>

            <!-- 工具调用 -->
            <div v-if="msg.toolCalls && msg.toolCalls.length > 0"
                 class="mt-3 pt-3 flex flex-wrap gap-2"
                 :style="{ borderTop: '1px solid var(--border-color)' }">
              <span
                v-for="tool in msg.toolCalls"
                :key="tool"
                class="px-3 py-1 rounded-full text-xs font-medium"
                :style="{
                  backgroundColor: 'rgba(0, 122, 255, 0.1)',
                  color: 'var(--accent-color)'
                }">
                {{ tool }}
              </span>
            </div>

            <!-- 时间戳 -->
            <div class="text-xs mt-2 opacity-50">{{ msg.timestamp }}</div>
          </div>
        </div>

        <!-- 打字效果 -->
        <div v-if="isTyping" class="flex justify-start animate-fadeIn">
          <div class="px-5 py-3 rounded-3xl max-w-[85%]"
               :style="{
                 backgroundColor: 'var(--bg-tertiary)',
                 borderRadius: '20px 20px 20px 4px'
               }">
            <span class="typing-cursor" :style="{ color: 'var(--text-primary)' }">
              {{ typingContent }}
            </span>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading && !isTyping" class="flex justify-start animate-fadeIn">
          <div class="px-5 py-3 rounded-3xl flex items-center space-x-2"
               :style="{ backgroundColor: 'var(--bg-tertiary)' }">
            <div class="flex space-x-1">
              <span class="w-2 h-2 rounded-full animate-pulse"
                    :style="{ backgroundColor: 'var(--accent-color)' }"></span>
              <span class="w-2 h-2 rounded-full animate-pulse"
                    :style="{ backgroundColor: 'var(--accent-color)', animationDelay: '0.2s' }"></span>
              <span class="w-2 h-2 rounded-full animate-pulse"
                    :style="{ backgroundColor: 'var(--accent-color)', animationDelay: '0.4s' }"></span>
            </div>
            <span class="text-sm" :style="{ color: 'var(--text-secondary)' }">正在思考...</span>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="px-6 py-4 border-t" :style="{ borderColor: 'var(--border-color)' }">
        <div class="flex space-x-3">
          <textarea
            v-model="inputMessage"
            rows="2"
            placeholder="请输入您的问题..."
            class="flex-1 px-5 py-3 rounded-2xl resize-none outline-none transition-all duration-200 text-[15px]"
            :style="{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)'
            }"
            @keydown.enter.ctrl="sendMessage"
            :disabled="loading"
          ></textarea>
          <button
            @click="sendMessage"
            :disabled="!inputMessage.trim() || loading"
            class="px-6 py-3 rounded-2xl font-medium transition-all duration-200 hover-scale"
            :style="{
              backgroundColor: inputMessage.trim() && !loading ? 'var(--accent-color)' : 'var(--bg-tertiary)',
              color: inputMessage.trim() && !loading ? '#ffffff' : 'var(--text-tertiary)',
              cursor: inputMessage.trim() && !loading ? 'pointer' : 'not-allowed'
            }"
          >
            发送
          </button>
        </div>
        <div class="text-xs mt-2" :style="{ color: 'var(--text-tertiary)' }">
          按 Ctrl + Enter 发送消息
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose :deep(p) {
  margin: 0;
}

.prose :deep(ul), .prose :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

textarea:focus {
  border-color: var(--accent-color) !important;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1) !important;
}

textarea::placeholder {
  color: var(--text-tertiary);
}

/* 滚动条隐藏但保持滚动功能 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 2px;
}
</style>