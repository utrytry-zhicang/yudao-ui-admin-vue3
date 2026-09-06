<!--
  成品订单-用料明细列表页
  功能：按客户/产品版本/创建时间查询用料明细，展示用料合计与金额合计，支持导出
-->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="客户" prop="customerId">
        <el-select
          v-model="queryParams.customerId"
          placeholder="请选择"
          clearable
          filterable
          class="!w-120px"
        >
          <el-option
            v-for="item in customerList"
            :key="item.id"
            :label="item.shortName"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="产品版本" prop="versionId">
        <el-select
          v-model="queryParams.versionId"
          placeholder="请选择"
          clearable
          filterable
          class="!w-120px"
        >
          <el-option
            v-for="item in versionList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="组件类型" prop="elementId">
        <el-select
          v-model="queryParams.elementId"
          placeholder="请选择"
          clearable
          filterable
          class="!w-120px"
        >
          <el-option
            v-for="item in elementList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['zc:ZC-sales-order-material:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      row-key="id"
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      show-summary
      :summary-method="getSummaries"
    >
      <el-table-column label="序号" align="center" type="index" width="60" />
      <el-table-column label="销售单号" align="center" prop="orderNo" min-width="120px" />
      <el-table-column label="客户名称" align="center" prop="customerName" min-width="120px" />
      <el-table-column label="组件类型" align="center" prop="elementName" min-width="100px" />
      <el-table-column label="产品名称" align="center" prop="productName" min-width="120px" />
      <el-table-column label="批次号" align="center" prop="batchNo" min-width="120px" />
      <el-table-column label="规格" align="center" prop="spec" />
      <el-table-column label="单价" align="center" prop="price" />
      <el-table-column label="用料" align="center" prop="quantity" />
      <el-table-column label="小计" align="center" prop="amount" min-width="120px" />
      <el-table-column label="裁剪数量" align="center" prop="cutQuantity" />
      <el-table-column label="配料状态" align="center" prop="status">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'HAVE_PEILIAO' ? 'success' : 'info'">
            {{ scope.row.status === 'HAVE_PEILIAO' ? '已配料' : '未配料' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="note" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
// ======================== 导入与声明 ========================
import { dateFormatter, beginOfDay, endOfDay, formatDate } from '@/utils/formatTime'
import download from '@/utils/download'
import type { TableColumnCtx } from 'element-plus'
import {
  ZCSalesOrderMaterialApi,
  ZCSalesOrderMaterial,
  ZCSalesOrderMaterialPageRespVO
} from '@/api/zc/salesorder/material'
import { CustomerApi, CustomerSimpleVO } from '@/api/zc/customer'
import { ProductVersionApi, ProductVersionSimpleVO } from '@/api/zc/productversion'
import { CurtainStructureElementApi, CurtainStructureElementSimpleVO } from '@/api/zc/curtainstructureelement'

/** 成品订单-用料明细 列表 */
defineOptions({ name: 'ZCSalesOrderMaterial' })

const message = useMessage() // 消息弹窗

// ======================== 响应式状态 ========================
const loading = ref(true) // 列表的加载中
const list = ref<ZCSalesOrderMaterial[]>([]) // 列表的数据
const total = ref(0) // 列表的总记录数
/** 用料合计（当前筛选条件下全量求和） */
const totalQuantity = ref(0)
/** 金额合计（当前筛选条件下全量求和） */
const totalAmount = ref(0)
/** 客户下拉选项 */
const customerList = ref<CustomerSimpleVO[]>([])
/** 产品版本下拉选项 */
const versionList = ref<ProductVersionSimpleVO[]>([])
/** 组件类型下拉选项 */
const elementList = ref<CurtainStructureElementSimpleVO[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  createTime: [
    formatDate(beginOfDay(new Date())),
    formatDate(endOfDay(new Date()))
  ],
  customerId: undefined,
  versionId: undefined,
  elementId: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

// ======================== 生命周期 ========================
/** 初始化：先加载筛选项，再查列表 */
onMounted(async () => {
  customerList.value = await CustomerApi.getCustomerSimpleList()
  versionList.value = await ProductVersionApi.getProductVersionSimpleList()
  elementList.value = await CurtainStructureElementApi.getCurtainStructureElementSimpleList()
  await getList()
})

// ======================== 数据获取 ========================
/**
 * 表格合计行：最左显示「合计」，用料/小计列仅展示数值
 * （使用接口全量合计，非当前页求和）
 */
const getSummaries = (param: { columns: TableColumnCtx<ZCSalesOrderMaterial>[] }) => {
  const { columns } = param
  const sums: string[] = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    if (column.property === 'quantity') {
      sums[index] = String(totalQuantity.value ?? 0)
      return
    }
    if (column.property === 'amount') {
      sums[index] = String(totalAmount.value ?? 0)
      return
    }
    sums[index] = ''
  })
  return sums
}

/** 查询列表，并同步用料/金额合计 */
const getList = async () => {
  loading.value = true
  try {
    const data: ZCSalesOrderMaterialPageRespVO =
      await ZCSalesOrderMaterialApi.getZCSalesOrderMaterialPage(queryParams)
    list.value = data.list
    total.value = data.total
    totalQuantity.value = data.totalQuantity ?? 0
    totalAmount.value = data.totalAmount ?? 0
  } finally {
    loading.value = false
  }
}

// ======================== 事件处理 ========================
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await ZCSalesOrderMaterialApi.exportZCSalesOrderMaterial(queryParams)
    download.excel(data, '成品订单-用料明细.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}
</script>

<style scoped>
:deep(.el-table__footer-wrapper td.el-table__cell) {
  background-color: #e2e8f0 !important;
  color: #0f172a !important;
  font-weight: bold;
}
</style>
