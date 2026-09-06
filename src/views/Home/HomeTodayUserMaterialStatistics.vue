<!--
  首页 - 当日员工工序节点用料统计
  功能：展示当日所有车间员工在对应工序节点上的工序次数与用料统计明细
  使用方：views/Home/Index.vue（快捷入口下方）
-->
<template>
  <el-card shadow="never" class="today-user-material-card">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div class="flex items-center gap-8px">
          <Icon icon="ep:avatar" class="text-20px text-primary" />
          <span class="text-16px font-medium">当日员工工序用料统计</span>
          <el-tag size="small" type="info" round class="ml-4px">
            共 {{ filteredList.length }} 位员工
          </el-tag>
        </div>
        <div class="flex items-center gap-8px">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索员工姓名/工序节点..."
            clearable
            size="default"
            class="w-220px!"
          >
            <template #prefix>
              <Icon icon="ep:search" class="text-gray-400" />
            </template>
          </el-input>
          <el-button size="default" circle @click="fetchData">
            <Icon icon="ep:refresh" :class="{ 'animate-spin': loading }" />
          </el-button>
        </div>
      </div>
    </template>

    <el-skeleton :loading="loading" animated :count="2">
      <template #template>
        <div class="py-12px">
          <el-skeleton-item variant="rect" class="h-40px w-full mb-12px rounded-8px" />
          <el-skeleton-item variant="p" class="h-80px w-full rounded-8px" />
        </div>
      </template>
      <template #default>
        <el-empty
          v-if="!loading && filteredList.length === 0"
          description="当日暂无员工工序用料统计数据"
          :image-size="80"
        />

        <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-16px">
          <div
            v-for="user in filteredList"
            :key="user.masterId"
            class="user-stat-box border border-gray-100 dark:border-gray-800 rounded-12px p-16px bg-gray-50/50 dark:bg-gray-900/50 hover:shadow-md transition-all"
          >
            <!-- 员工头部 -->
            <div class="flex items-center justify-between pb-12px border-b border-gray-100 dark:border-gray-800 mb-12px">
              <div class="flex items-center gap-10px">
                <div class="w-36px h-36px rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-16px">
                  {{ user.masterName?.substring(0, 1) || '员' }}
                </div>
                <div>
                  <div class="text-15px font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-6px">
                    {{ user.masterName }}
                    <span class="text-12px text-gray-400 font-normal">#{{ user.masterId }}</span>
                  </div>
                  <div class="text-12px text-gray-500 mt-2px">
                    工序节点数：<span class="text-primary font-medium">{{ user.nodeStats?.length || 0 }}</span>
                  </div>
                </div>
              </div>
              <el-tag
                :type="user.nodeStats && user.nodeStats.length > 0 ? 'success' : 'info'"
                size="small"
                effect="light"
              >
                {{ user.nodeStats && user.nodeStats.length > 0 ? '当日有工序' : '未产生工序' }}
              </el-tag>
            </div>

            <!-- 节点与用料明细列表 -->
            <div v-if="user.nodeStats && user.nodeStats.length > 0" class="space-y-10px">
              <div
                v-for="node in user.nodeStats"
                :key="node.nodeId"
                class="node-card bg-white dark:bg-gray-800 p-12px rounded-8px border border-gray-100 dark:border-gray-700/50"
              >
                <div class="flex items-center justify-between mb-8px">
                  <span class="text-13px font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-4px">
                    <Icon icon="ep:operation" class="text-primary text-14px" />
                    {{ node.nodeName }}
                  </span>
                  <el-tag size="small" type="warning" effect="plain" class="rounded-4px">
                    组件种类: {{ node.materials?.length || 0 }}
                  </el-tag>
                </div>

                <!-- 各种用料组件列表 -->
                <div v-if="node.materials && node.materials.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-8px">
                  <div
                    v-for="mat in node.materials"
                    :key="mat.elementId"
                    class="material-pill flex items-center justify-between p-8px rounded-6px bg-gray-50 dark:bg-gray-900/80 text-12px border border-gray-100 dark:border-gray-800"
                  >
                    <span class="text-gray-700 dark:text-gray-300 font-medium truncate max-w-120px" :title="mat.elementName">
                      {{ mat.elementName }}
                    </span>
                    <div class="flex items-center gap-8px text-right">
                      <span class="text-gray-500">
                        {{ mat.processCount }}次
                      </span>
                      <span class="font-semibold text-primary">
                        {{ formatQuantity(mat.totalQuantity) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else class="text-12px text-gray-400 py-4px">
                  暂无用料关联组件
                </div>
              </div>
            </div>

            <!-- 无工序记录 -->
            <div v-else class="text-12px text-gray-400 text-center py-16px bg-white dark:bg-gray-800 rounded-8px border border-dashed border-gray-200 dark:border-gray-700">
              今日暂无该员工对应节点的加工用料记录
            </div>
          </div>
        </div>
      </template>
    </el-skeleton>
  </el-card>
</template>

<script setup lang="ts">
// ======================== 导入与声明 ========================
import { ref, computed, onMounted } from 'vue'
import {
  OrderProcessRecordApi,
  type ZcOrderProcessRecordTodayUserMaterialRespVO
} from '@/api/zc/orderprocessrecord'

defineOptions({ name: 'HomeTodayUserMaterialStatistics' })

// ======================== 响应式状态 ========================
const loading = ref(false)
const list = ref<ZcOrderProcessRecordTodayUserMaterialRespVO[]>([])
const searchKeyword = ref('')

// ======================== 计算属性 ========================
/** 过滤后的员工列表 */
const filteredList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return list.value

  return list.value.filter((user) => {
    // 匹配员工姓名
    const matchName = user.masterName?.toLowerCase().includes(keyword)
    // 匹配工序节点或组件
    const matchNode = user.nodeStats?.some((node) =>
      node.nodeName?.toLowerCase().includes(keyword) ||
      node.materials?.some((m) => m.elementName?.toLowerCase().includes(keyword))
    )
    return matchName || matchNode
  })
})

// ======================== 数据获取与工具函数 ========================
/** 数量格式化 */
const formatQuantity = (val: number) => {
  if (val == null) return '0'
  return Number.isInteger(val) ? String(val) : val.toFixed(2)
}

/** 加载当日员工节点用料统计 */
const fetchData = async () => {
  loading.value = true
  try {
    const res = await OrderProcessRecordApi.getTodayUserMaterialStat()
    list.value = res || []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

// ======================== 生命周期 ========================
onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.today-user-material-card {
  :deep(.el-card__header) {
    padding: 10px 16px;
  }

  :deep(.el-card__body) {
    padding: 14px;
  }
}

.user-stat-box {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
  }
}

.node-card {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

.material-pill {
  transition: background-color 0.15s ease;

  &:hover {
    background-color: rgba(var(--el-color-primary-rgb), 0.06);
  }
}
</style>
