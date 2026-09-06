<template>
  <!-- 快捷入口 -->
  <el-row :gutter="8">
    <el-col :span="24" class="mb-4px">
      <el-card shadow="never" class="shortcut-card">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="text-16px font-medium">{{ t('workplace.shortcutOperation') }}</span>
          </div>
        </template>
        <el-skeleton :loading="loading" animated>
          <el-row :gutter="12">
            <el-col
              v-for="item in shortcut"
              :key="`shortcut-${item.name}`"
              :xl="4" :lg="4" :md="8" :sm="8" :xs="12"
              class="mb-4px"
            >
              <div
                class="flex flex-col items-center justify-center py-4px cursor-pointer rounded-8px hover:bg-gray-50 transition-all"
                @click="handleShortcutClick(item.url)"
              >
                <Icon :icon="item.icon" :size="52" :style="{ color: item.color }" class="mb-2px" />
                <span class="text-14px text-gray-700">{{ item.name }}</span>
              </div>
            </el-col>
          </el-row>
        </el-skeleton>
      </el-card>
    </el-col>
  </el-row>

  <!-- 当日员工工序用料统计 -->
  <el-row class="mt-8px" :gutter="8">
    <el-col :span="24" class="mb-4px">
      <HomeTodayUserMaterialStatistics />
    </el-col>
  </el-row>

  <!-- 统计区域：订单统计与用料统计共用时间筛选 -->
  <el-row class="mt-8px" :gutter="8">
    <el-col :span="24" class="mb-8px">
      <div class="w-full flex justify-end mb-12px">
        <div class="statistics-time-filter flex flex-wrap items-center justify-end gap-12px">
          <el-radio-group
            v-model="timeRangeType"
            size="large"
            @change="handleTimeRangeTypeChange"
          >
            <el-radio-button
              v-for="item in homeStatisticsTimeRangeOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
          <el-date-picker
            v-model="customTimes"
            size="large"
            value-format="YYYY-MM-DD HH:mm:ss"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
            class="statistics-date-picker"
            @change="handleCustomDateChange"
          />
        </div>
      </div>
      <HomeSalesOrderStatistics :confirm-time="confirmTime" class="mb-8px" />
      <HomeMaterialStatistics :confirm-time="confirmTime" />
    </el-col>
  </el-row>

  <!-- 图表区域 -->
  <!-- <el-row class="mt-8px" :gutter="8">
    <el-col :span="24" class="mb-8px">
      <el-card shadow="never">
        <el-skeleton :loading="loading" animated>
          <el-row :gutter="20" justify="space-between">
            <el-col :xl="10" :lg="10" :md="24" :sm="24" :xs="24">
              <el-card shadow="hover" class="mb-8px">
                <el-skeleton :loading="loading" animated>
                  <Echart :options="pieOptionsData" :height="280" />
                </el-skeleton>
              </el-card>
            </el-col>
            <el-col :xl="14" :lg="14" :md="24" :sm="24" :xs="24">
              <el-card shadow="hover" class="mb-8px">
                <el-skeleton :loading="loading" animated>
                  <Echart :options="barOptionsData" :height="280" />
                </el-skeleton>
              </el-card>
            </el-col>
          </el-row>
        </el-skeleton>
      </el-card>
    </el-col>
  </el-row> -->
</template>
<script lang="ts" setup>
import { set } from 'lodash-es'
import { EChartsOption } from 'echarts'
import type { Shortcut } from './types'
import { pieOptions, barOptions } from './echarts-data'
import { useRouter } from 'vue-router'
import HomeSalesOrderStatistics from './HomeSalesOrderStatistics.vue'
import HomeMaterialStatistics from './HomeMaterialStatistics.vue'
import HomeTodayUserMaterialStatistics from './HomeTodayUserMaterialStatistics.vue'
import {
  homeStatisticsTimeRangeOptions,
  useHomeStatisticsTimeRange
} from './useHomeStatisticsTimeRange'

defineOptions({ name: 'Index' })

// ======================== 统计共用时间筛选 ========================
const {
  timeRangeType,
  customTimes,
  confirmTime,
  handleTimeRangeTypeChange,
  handleCustomDateChange
} = useHomeStatisticsTimeRange()

const { t } = useI18n()
const router = useRouter()
const loading = ref(true)
const pieOptionsData = reactive<EChartsOption>(pieOptions) as EChartsOption
// 获取快捷入口
let shortcut = reactive<Shortcut[]>([])

const getShortcut = async () => {
  const data = [
    {
      name: '销售订单管理',
      icon: 'ion:home-outline',
      url: '/zc/order/sales-order',
      color: '#1fdaca'
    },
      {
      name: '产品管理',
      icon: 'tabler:ai',
      url: '/zc/product/product',
      color: '#7c3aed'
    },
    {
      name: '产品批次管理',
      icon: 'ep:shop',
      url: '/zc/product/product-batch',
      color: '#ff6b6b'
    },
  
    {
      name: '客户资料',
      icon: 'simple-icons:erpnext',
      url: '/zc/baseInfo/customer',
      color: '#3fb27f'
    },
    {
      name: '用户管理',
      icon: 'simple-icons:civicrm',
      url: '/system/user',
      color: '#4daf1bc9'
    },
    {
      name: '角色管理',
      icon: 'fa-solid:hdd',
      url: '/system/role',
      color: '#1a73e8'
    }
  ]
  shortcut = Object.assign(shortcut, data)
}

// 用户来源
const getUserAccessSource = async () => {
  const data = [
    { value: 335, name: 'analysis.directAccess' },
    { value: 310, name: 'analysis.mailMarketing' },
    { value: 234, name: 'analysis.allianceAdvertising' },
    { value: 135, name: 'analysis.videoAdvertising' },
    { value: 1548, name: 'analysis.searchEngines' }
  ]
  set(
    pieOptionsData,
    'legend.data',
    data.map((v) => t(v.name))
  )
  pieOptionsData!.series![0].data = data.map((v) => {
    return {
      name: t(v.name),
      value: v.value
    }
  })
}
const barOptionsData = reactive<EChartsOption>(barOptions) as EChartsOption

// 周活跃量
const getWeeklyUserActivity = async () => {
  const data = [
    { value: 13253, name: 'analysis.monday' },
    { value: 34235, name: 'analysis.tuesday' },
    { value: 26321, name: 'analysis.wednesday' },
    { value: 12340, name: 'analysis.thursday' },
    { value: 24643, name: 'analysis.friday' },
    { value: 1322, name: 'analysis.saturday' },
    { value: 1324, name: 'analysis.sunday' }
  ]
  set(
    barOptionsData,
    'xAxis.data',
    data.map((v) => t(v.name))
  )
  set(barOptionsData, 'series', [
    {
      name: t('analysis.activeQuantity'),
      data: data.map((v) => v.value),
      type: 'bar'
    }
  ])
}

const getAllApi = async () => {
  await Promise.all([getShortcut(), getUserAccessSource(), getWeeklyUserActivity()])
  loading.value = false
}

const handleShortcutClick = (url: string) => {
  router.push(url)
}

getAllApi()
</script>

<style lang="scss" scoped>
.shortcut-card {
  :deep(.el-card__header) {
    padding: 6px 16px;
  }

  :deep(.el-card__body) {
    padding: 4px 12px 2px;
  }
}

.statistics-time-filter {
  :deep(.el-radio-button__inner) {
    padding: 10px 20px;
    font-size: 15px;
  }
}

.statistics-date-picker {
  width: 340px !important;
}
</style>
