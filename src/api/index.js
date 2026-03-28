import axios from 'axios'
import router from '../router'

// API基础配置
const api = axios.create({
  baseURL: 'http://localhost:8088/api/agent',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加 Token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理 401
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response && error.response.status === 401) {
      // Token 无效，清除本地存储并跳转登录
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      router.push('/login')
    }
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

/**
 * Agent API 服务
 */
export const agentApi = {
  /**
   * 发送聊天消息
   * @param {string} message - 用户消息
   * @param {string} sessionId - 会话ID（可选）
   * @returns {Promise} - 响应结果
   */
  chat(message, sessionId = null) {
    const data = { message }
    if (sessionId) {
      data.sessionId = sessionId
    }
    return api.post('/chat', data)
  },

  /**
   * 获取健康状态
   * @returns {Promise}
   */
  health() {
    return api.get('/health')
  },

  /**
   * 获取系统状态
   * @returns {Promise}
   */
  status() {
    return api.get('/status')
  },

  /**
   * 清除会话
   * @param {string} sessionId - 会话ID
   * @returns {Promise}
   */
  clearSession(sessionId) {
    return api.delete(`/session/${sessionId}`)
  }
}

/**
 * 认证 API
 */
export const authApi = {
  /**
   * 用户登录
   */
  login(username, password) {
    return axios.post('http://localhost:8088/api/auth/login', {
      username,
      password
    }).then(res => res.data)
  },

  /**
   * 验证 Token
   */
  verify() {
    const token = localStorage.getItem('token')
    return axios.get('http://localhost:8088/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => res.data)
  }
}

export default api