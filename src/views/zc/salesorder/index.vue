<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    
      @submit.prevent
    >
      <el-form-item label="订单号" prop="orderNo">
        <el-input
          v-model="queryParams.orderNo"
          placeholder="请输入订单号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="客户" prop="customerId">
        <div class="flex items-center gap-4px">
          <el-input
            v-model="customerInput"
            placeholder="输入客户名称后回车搜索"
            clearable
            class="!w-200px"
            @keyup.enter="handleOpenCustomerSearch"
            @clear="handleClearCustomerFilter"
          />
          <el-button :icon="SearchIcon" circle size="small" @click="handleOpenCustomerSearch" title="搜索客户" />
        </div>
      </el-form-item>
      <el-form-item label="下单日期" prop="orderDate">
        <el-date-picker
          v-model="queryParams.orderDate"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="交付日期" prop="deliveryDate">
        <div class="flex items-center gap-8px">
          <el-date-picker
            v-model="queryParams.deliveryDate"
            value-format="YYYY-MM-DD HH:mm:ss"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
            class="!w-220px"
          />
          <el-tag
            type="danger"
            effect="light"
            class="cursor-pointer hover:opacity-80 transition-opacity font-bold select-none"
            @click="handleFilterTodayDelivery"
            title="点击直接筛选交付日期等于今天的订单"
          >
            今日需发货客户数：{{ todayDeliveryCustomerCount }}
          </el-tag>
        </div>
      </el-form-item>
      <el-form-item label="结算状态" prop="payStatus">
        <el-select
          v-model="queryParams.payStatus"
          placeholder="请选择结算状态"
          clearable
          multiple
          collapse-tags
          class="!w-240px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.ZC_ORDER_PAY_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="订单状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择订单状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.ZC_ORDER_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="订单类型" prop="types">
        <el-select
          v-model="queryParams.types"
          placeholder="请选择订单类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.ZC_ORDER_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="是否加急" prop="isExpedited">
        <el-select
          v-model="queryParams.isExpedited"
          placeholder="请选择是否加急"
          clearable
          class="!w-240px"
        >
          <el-option label="是" :value="1" />
          <el-option label="否" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="品牌" prop="brandId">
        <el-select
          v-model="queryParams.brandId"
          placeholder="请选择品牌"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="item in brandsList"
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
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['zc:sales-order:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 成品单
        </el-button>
        <el-button
          type="warning"
          plain
          @click="openProductForm('create')"
          v-hasPermi="['zc:sales-order:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 面料单
        </el-button>
        <!-- <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['zc:sales-order:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button> -->
        <el-button
          type="warning"
          plain
          @click="openCollectionDialog"
        >
          <Icon icon="ep:wallet" class="mr-5px" /> 新增收款
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
        class="cursor-pointer"
        :row-class-name="tableRowClassName"
        @selection-change="handleRowCheckboxChange"
        @row-dblclick="handleRowDblClick"
    >
    <el-table-column type="selection" width="55" />
      <el-table-column label="序号" type="index" align="center" width="60" />
      <el-table-column label="订单类型" align="center" prop="types" min-width="90px">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.ZC_ORDER_TYPE" :value="scope.row.types" />
        </template>
      </el-table-column>
      <el-table-column label="订单号" align="center" prop="orderNo" min-width="180px"/>
             <el-table-column label="状态" align="center" prop="status" min-width="90px">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.ZC_ORDER_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="当前工序" align="center" prop="currentNodeName" min-width="140px">
        <template #default="scope">
          <span v-if="!scope.row.currentNodeName">-</span>
          <div v-else class="flex flex-col items-center gap-1">
            <span>{{ scope.row.currentNodeName }}</span>
            <el-button link type="primary" size="small" @click="openProcessRecordDialog(scope.row.id)">
              查看记录
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="客户" align="center" prop="customerName" min-width="160px"/>

      <el-table-column label="下单日期" align="center" prop="orderDate" width="110px">
        <template #default="scope">{{ scope.row.orderDate?.substring(0, 10) }}</template>
      </el-table-column>
      <el-table-column label="交付日期" align="center" prop="deliveryDate" width="110px">
        <template #default="scope">{{ scope.row.deliveryDate?.substring(0, 10) }}</template>
      </el-table-column>


      <el-table-column label="是否加急" align="center" prop="isExpedited">
        <template #default="scope">
          <el-tag :type="scope.row.isExpedited ? 'danger' : 'info'" size="small">
            {{ scope.row.isExpedited ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
    
      <el-table-column label="结算状态" align="center" prop="payStatus" min-width="90px">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.ZC_ORDER_PAY_STATUS" :value="scope.row.payStatus" />
        </template>
      </el-table-column>
      <el-table-column label="品牌" align="center" prop="brandId" min-width="100px">
        <template #default="scope">{{ brandIdMap[scope.row.brandId] }}</template>
      </el-table-column>
      <el-table-column label="物流" align="center" prop="logisticName" min-width="100px"/>

      <el-table-column label="运费" align="center" prop="freight" />
      <el-table-column label="优惠金额" align="center" prop="discountAmount" />
      <el-table-column label="订单金额" align="center" prop="amount" />
      <el-table-column label="已收金额" align="center" prop="amountReceived" />
      <el-table-column
        label="确认时间"
        align="center"
        prop="confirmTime"
        :formatter="dateFormatter"
        width="180px"
      />

      <el-table-column label="备注" align="center" prop="note" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" min-width="120px" fixed="right">
        <template #default="scope">
          <el-button
            v-if="scope.row.status !== 'DISCARDED'"
            link
            type="warning"
            @click="handleDiscard(scope.row.id)"
            v-hasPermi="['zc:sales-order:update']"
          >
            废弃
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 成品单表单弹窗 -->
  <SalesOrderForm ref="formRef" :brandsList="brandsList" :logisticsList="logisticsList" :installProcessList="installProcessList" @success="getList" />

  <!-- 面料单表单弹窗 -->
  <SalesOrderProductForm ref="productFormRef" :brandsList="brandsList" :logisticsList="logisticsList" @success="getList" @open-sales-order-form="formRef?.open('create')" />

  <!-- 收款弹窗 -->
  <CollectionDialog ref="collectionDialogRef" @success="getList" />
  <!-- 客户搜索弹窗（列表页筛选用） -->
  <CustomerSearchDialog ref="customerSearchDialogRef" @select="handleSelectCustomerFromSearch" />

  <!-- 工序记录弹窗 -->
  <SalesOrderProcessRecordDialog ref="processRecordDialogRef" />
</template>

<script setup lang="ts">
import { Search as SearchIcon } from '@element-plus/icons-vue'
import { getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { isEmpty } from '@/utils/is'
import { dateFormatter, beginOfDay, endOfDay, formatDate } from '@/utils/formatTime'
import download from '@/utils/download'
import { SalesOrderApi, SalesOrderProductApi, SalesOrderType, SalesOrder } from '@/api/zc/salesorder'
import type { Customer } from '@/api/zc/customer'
import { BrandApi, BrandSimpleVO } from '@/api/zc/brand'
import { LogisticsApi, LogisticsSimpleVO } from '@/api/zc/logistics'
import { CurtainInstallProcessApi, CurtainInstallProcessSimpleVO } from '@/api/zc/curtaininstallprocess'
import SalesOrderForm from './SalesOrderForm.vue'
import SalesOrderProductForm from './SalesOrderProductForm.vue'
import CollectionDialog from './CollectionDialog.vue'
import CustomerSearchDialog from './CustomerSearchDialog.vue'
import SalesOrderProcessRecordDialog from './SalesOrderProcessRecordDialog.vue'
import { checkPermi } from '@/utils/permission'

/** 销售订单 列表 */
defineOptions({ name: 'ZcSalesOrder' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<SalesOrder[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
/** 列表筛选：客户输入框展示文本，实际筛选仍用 queryParams.customerId */
const customerInput = ref('')
const brandsList = ref<BrandSimpleVO[]>([]) // 品牌列表
const logisticsList = ref<LogisticsSimpleVO[]>([]) // 物流列表
const installProcessList = ref<CurtainInstallProcessSimpleVO[]>([]) // 安装工艺列表
const todayDeliveryCustomerCount = ref<number>(0) // 今日需发货客户数

const brandIdMap = computed(() =>
  Object.fromEntries(brandsList.value.map((item) => [item.id, item.name]))
)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  orderNo: undefined,
  customerId: undefined,
  mobile: undefined,
  brandId: undefined,
  orderDate: [],
  logisticId: undefined,
  receiver: undefined,
  deliveryAddress: undefined,
  freight: undefined,
  types: undefined,
  deliveryDate: [],
  payStatus: [] as string[],
  status: undefined,
  confirmTime: [],
  isExpedited: undefined,
  note: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中
const checkedIds = ref<number[]>([]) // 表格勾选的行 ID 列表

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await SalesOrderApi.getSalesOrderPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  customerInput.value = ''
  handleQuery()
}

/** 客户搜索弹窗（列表页筛选用） */
const customerSearchDialogRef = ref<InstanceType<typeof CustomerSearchDialog>>()

/** 回车或点击搜索图标：打开客户搜索弹窗 */
const handleOpenCustomerSearch = () => {
  customerSearchDialogRef.value?.open(customerInput.value)
}

/** 搜索弹窗选中客户：回填展示文本并设置筛选 ID */
const handleSelectCustomerFromSearch = (customer: Customer) => {
  queryParams.customerId = customer.id
  customerInput.value = customer.name ?? ''
}

/** 清空客户输入时同步清除筛选条件 */
const handleClearCustomerFilter = () => {
  queryParams.customerId = undefined
}

/** 添加/修改成品单 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 添加/修改面料单 */
const productFormRef = ref()
const openProductForm = (type: string, id?: number) => {
  productFormRef.value.open(type, id)
}

/** 编辑按钮：根据订单类型打开对应表单 */
const handleEdit = (row: SalesOrder) => {
  if (row.status === 'DISCARDED') {
    message.warning('废弃订单禁止查看')
    return
  }
  if (row.types === SalesOrderType.FABRIC) {
    openProductForm('update', row.id)
  } else {
    openForm('update', row.id)
  }
}

/** 双击行：与编辑按钮一致，按订单类型打开成品单/面料单编辑弹窗 */
const handleRowDblClick = (row: SalesOrder) => {
  if (row.status === 'DISCARDED') {
    message.warning('废弃订单禁止查看')
    return
  }
  if (!checkPermi(['zc:sales-order:update'])) return
  handleEdit(row)
}

/** 废弃按钮操作 */
const handleDiscard = async (id: number) => {
  try {
    await message.confirm('确认废弃该销售订单吗？')
    await SalesOrderApi.discardSalesOrder(id)
    message.success('废弃成功')
    await getList()
  } catch {}
}

/** 打开新增收款弹窗 */
const collectionDialogRef = ref()
const openCollectionDialog = () => {
  collectionDialogRef.value.open()
}

/** 删除按钮操作：面料单走 SalesOrderProductApi，其余走 SalesOrderApi */
const handleDelete = async (id: number, types: string) => {
  try {
    await message.delConfirm()
    if (types === SalesOrderType.FABRIC) {
      await SalesOrderProductApi.deleteSalesOrderProduct(id)
    } else {
      await SalesOrderApi.deleteSalesOrder(id)
    }
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}


const handleRowCheckboxChange = (records: SalesOrder[]) => {
  checkedIds.value = records.map((item) => item.id!);
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await SalesOrderApi.exportSalesOrder(queryParams)
    download.excel(data, '销售订单.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

// ======================== 工序记录 ========================
const processRecordDialogRef = ref<InstanceType<typeof SalesOrderProcessRecordDialog>>()

/** 打开工序记录弹窗 */
const openProcessRecordDialog = (orderId: number) => {
  processRecordDialogRef.value?.open(orderId)
}

/** 废弃订单整行高亮标红样式 */
const tableRowClassName = ({ row }: { row: SalesOrder }) => {
  if (row.status === 'DISCARDED') {
    return 'discarded-row'
  }
  return ''
}

/** 今日需发货客户数获取 **/
const getTodayDeliveryCustomerCount = async () => {
  try {
    todayDeliveryCustomerCount.value = await SalesOrderApi.getTodayDeliveryCustomerCount()
  } catch (e) {
    console.error('获取今日需发货客户数失败', e)
  }
}

/** 点击筛选交付日期等于今天的订单 */
const handleFilterTodayDelivery = () => {
  queryParams.deliveryDate = [
    formatDate(beginOfDay(new Date())),
    formatDate(endOfDay(new Date()))
  ]
  handleQuery()
}

/** 初始化 **/
onMounted(async () => {
  ;[brandsList.value, logisticsList.value, installProcessList.value] = await Promise.all([
    BrandApi.getBrandSimpleList(),
    LogisticsApi.getLogisticsSimpleList(),
    CurtainInstallProcessApi.getCurtainInstallProcessSimpleList(),
  ])
  await getTodayDeliveryCustomerCount()
  await getList()
})
</script>

<style scoped>
:deep(.el-table .discarded-row) {
  background-color: var(--el-color-danger-light-9) !important;
  color: var(--el-color-danger) !important;
}
:deep(.el-table .discarded-row td.el-table__cell) {
  background-color: var(--el-color-danger-light-9) !important;
  color: var(--el-color-danger) !important;
}
</style>
