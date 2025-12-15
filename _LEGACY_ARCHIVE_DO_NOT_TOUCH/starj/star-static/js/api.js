// StarJourney API 封装
class StarJourneyAPI {
  constructor(baseURL = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
  }

  // 通用请求方法
  async request(url, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API请求失败: ${url}`, error);
      throw error;
    }
  }

  // GET 请求
  async get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return this.request(fullUrl);
  }

  // POST 请求
  async post(url, data = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT 请求
  async put(url, data = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // PATCH 请求
  async patch(url, data = {}) {
    return this.request(url, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // DELETE 请求
  async delete(url) {
    return this.request(url, {
      method: 'DELETE'
    });
  }

  // ================ 错题管理 API ================

  // 获取错题列表
  async getMistakes(params = {}) {
    return this.get('/mistakes', params);
  }

  // 创建错题记录
  async createMistake(data) {
    return this.post('/mistakes', data);
  }

  // 更新错题记录
  async updateMistake(id, data) {
    return this.put(`/mistakes/${id}`, data);
  }

  // 删除错题记录
  async deleteMistake(id) {
    return this.delete(`/mistakes/${id}`);
  }

  // ================ 过关管理 API ================

  // 获取过关记录
  async getRecords(params = {}) {
    return this.get('/records', params);
  }

  // 创建过关记录
  async createRecord(data) {
    return this.post('/records', data);
  }

  // 记录辅导尝试 (核心功能！)
  async recordAttempt(id) {
    return this.patch(`/records/${id}/attempt`);
  }

  // 标记为通过
  async markAsPassed(id, expBonus = 0) {
    return this.patch(`/records/${id}/pass`, { exp_bonus: expBonus });
  }

  // 删除过关记录
  async deleteRecord(id) {
    return this.delete(`/records/${id}`);
  }

  // ================ 学情统计 API ================

  // 获取学生学业统计
  async getStudentStats(studentId) {
    return this.get(`/student-stats/${studentId}`);
  }

  // ================ 系统健康检查 ================

  // 健康检查
  async healthCheck() {
    return this.get('/health');
  }
}

// 全局API实例
const starAPI = new StarJourneyAPI();

// UI工具函数
const UI = {
  // 显示消息
  showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;

    const container = document.querySelector('.content');
    container.insertBefore(messageDiv, container.firstChild);

    // 3秒后自动消失
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 3000);
  },

  // 显示成功消息
  showSuccess(message) {
    this.showMessage(message, 'success');
  },

  // 显示错误消息
  showError(message) {
    this.showMessage(message, 'error');
  },

  // 显示信息消息
  showInfo(message) {
    this.showMessage(message, 'info');
  },

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // 生成状态标签HTML
  getStatusBadge(status) {
    const statusMap = {
      'pending': '<span class="status-badge status-pending">待完成</span>',
      'passed': '<span class="status-badge status-passed">已通过</span>',
      'solved': '<span class="status-badge status-solved">已解决</span>'
    };
    return statusMap[status] || `<span class="status-badge">${status}</span>`;
  },

  // 生成尝试次数标签HTML
  getAttemptBadge(count) {
    const countNum = parseInt(count) || 0;
    const className = countNum > 2 ? 'attempt-badge high' : 'attempt-badge';
    return `<span class="${className}">${countNum}次尝试</span>`;
  },

  // 生成任务类型标签HTML
  getTaskTypeBadge(type) {
    const typeMap = {
      'QC': '<span class="status-badge status-pending">质检</span>',
      'TASK': '<span class="status-badge status-solved">任务</span>'
    };
    return typeMap[type] || `<span class="status-badge">${type}</span>`;
  },

  // 切换标签页
  switchTab(tabName) {
    // 隐藏所有标签内容
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    // 取消所有标签的激活状态
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });

    // 激活选中的标签
    const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
    const targetContent = document.getElementById(`${tabName}-content`);

    if (targetTab) targetTab.classList.add('active');
    if (targetContent) targetContent.classList.add('active');
  },

  // 显示加载状态
  showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          正在加载数据...
        </div>
      `;
    }
  },

  // 清空容器
  clearContainer(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }
  },

  // 确认对话框
  confirm(message, callback) {
    if (confirm(message)) {
      callback();
    }
  }
};

// 数据缓存管理
const Cache = {
  data: {},

  // 设置缓存
  set(key, value, ttl = 5 * 60 * 1000) { // 默认5分钟
    this.data[key] = {
      value,
      timestamp: Date.now(),
      ttl
    };
  },

  // 获取缓存
  get(key) {
    const cached = this.data[key];
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      delete this.data[key];
      return null;
    }

    return cached.value;
  },

  // 清除缓存
  clear(key = null) {
    if (key) {
      delete this.data[key];
    } else {
      this.data = {};
    }
  }
};

// 页面初始化后检查服务器状态
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const health = await starAPI.healthCheck();
    if (health.success) {
      console.log('✅ StarJourney服务器连接成功');
      UI.showInfo('StarJourney服务器连接成功');
    }
  } catch (error) {
    console.error('❌ StarJourney服务器连接失败:', error);
    UI.showError('StarJourney服务器连接失败，请检查服务器是否启动');
  }
});