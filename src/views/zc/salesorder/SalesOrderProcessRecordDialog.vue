<!--
  销售订单 - 工序记录弹窗
  功能：展示完整窗帘结构，各层级挂载 processRecords 横向流程
  使用方：views/zc/salesorder/index.vue
-->
<template>
  <el-dialog v-model="dialogVisible" title="工序记录" width="900px" destroy-on-close>
    <div v-loading="loading" class="min-h-80px">
      <el-empty
        v-if="!loading && !detail?.orderRecords?.length && !detail?.curtains?.length"
        description="暂无订单结构数据"
      />

      <div v-else class="flex flex-col gap-4">
        <!-- 订单级记录 -->
        <section v-if="detail?.orderRecords?.length" class="process-section">
          <div class="process-section__title">
            <Icon icon="ep:document" class="mr-1" />
            订单级
          </div>
          <ProcessRecordTimeline :records="detail!.orderRecords!" />
        </section>

        <!-- 窗帘行（完整结构，无工序也展示） -->
        <section
          v-for="curtain in detail?.curtains"
          :key="curtain.id ?? curtain.curtainId"
          class="process-section"
        >
          <div class="process-section__title">
            <Icon icon="ep:house" class="mr-1" />
            <span>{{ curtain.curtainName || '窗帘' }}</span>
            <span v-if="curtain.room" class="text-gray-500 font-normal"> · {{ curtain.room }}</span>
          </div>

          <ProcessRecordTimeline
            v-if="curtain.processRecords?.length"
            :records="curtain.processRecords"
            class="mb-3"
          />
          <div v-else class="text-gray-400 text-sm py-1 mb-3">暂无工序记录</div>

          <!-- 结构行 -->
          <div
            v-for="structure in curtain.structures"
            :key="structure.id ?? structure.structureId"
            class="process-subsection"
          >
            <div class="process-subsection__title">
              <Icon icon="ep:grid" class="mr-1" />
              <span>{{ structure.structureName || `结构 #${structure.structureId}` }}</span>
              <span
                v-if="structure.width != null || structure.height != null"
                class="ml-2 text-red-500 font-bold"
              >
                （宽：{{ structure.width ?? '-' }} 高：{{ structure.height ?? '-' }}）
              </span>
            </div>

            <ProcessRecordTimeline
              v-if="structure.processRecords?.length"
              :records="structure.processRecords"
              class="mb-3"
            />
            <div v-else class="text-gray-400 text-sm py-1 mb-3">暂无工序记录</div>

            <!-- 用料明细 -->
            <div
              v-for="material in structure.materials"
              :key="material.id"
              class="process-material"
            >
              <div class="process-material__title">
                <Icon icon="ep:box" class="mr-1" />
                {{ formatMaterialTitle(material) }}
              </div>
              <ProcessRecordTimeline
                v-if="material.processRecords?.length"
                :records="material.processRecords"
              />
              <div v-else class="text-gray-400 text-sm py-1">暂无工序记录</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
// ======================== 导入与声明 ========================
import {
  SalesOrderApi,
  type ZcSalesOrderMaterialProcessRecordRespVO,
  type ZcSalesOrderProcessRecordDetailRespVO
} from '@/api/zc/salesorder'
import ProcessRecordTimeline from './ProcessRecordTimeline.vue'

defineOptions({ name: 'SalesOrderProcessRecordDialog' })

const message = useMessage()

// ======================== 响应式状态 ========================
const dialogVisible = ref(false)
const loading = ref(false)
const detail = ref<ZcSalesOrderProcessRecordDetailRespVO | null>(null)

/** 用料明细标题：组件名称 + 产品名称 */
const formatMaterialTitle = (material: ZcSalesOrderMaterialProcessRecordRespVO) => {
  const name = material.elementName || `用料 #${material.id}`
  return material.productName ? `${name} · ${material.productName}` : name
}

// ======================== 对外方法 ========================
/**
 * 打开工序记录弹窗
 * @param orderId 销售订单 ID
 */
const open = async (orderId: number) => {
  dialogVisible.value = true
  loading.value = true
  detail.value = null
  try {
    detail.value = await SalesOrderApi.getSalesOrderProcessRecordDetail({
      id: orderId,
      groups: '0,1'
    })
  } catch (e) {
    message.error('获取工序记录失败')
    console.error('[工序记录]', e)
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.process-section {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.process-section__title {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.process-subsection {
  padding: 10px 12px;
  margin-top: 8px;
  margin-left: 8px;
  border-left: 3px solid var(--el-color-primary-light-5);
  background: var(--el-fill-color-light);
  border-radius: 0 6px 6px 0;
}

.process-subsection__title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.process-material {
  padding: 8px 10px;
  margin-top: 8px;
  margin-left: 8px;
  border-left: 2px solid var(--el-border-color);
  border-radius: 0 4px 4px 0;
}

.process-material__title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}
</style>
