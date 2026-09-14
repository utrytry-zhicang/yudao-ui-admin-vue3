<!--
  销售订单 - 新增收款弹窗
  功能：选择客户后，自动加载该客户未结清/部分结清且已确认的订单，填写收款信息后提交
  使用方：views/zc/salesorder/index.vue、views/zc/salesorder/SalesOrderForm.vue、views/zc/salesorder/SalesOrderProductForm.vue
-->
<template>
  <Dialog title="新增收款" v-model="dialogVisible" width="70%">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <!-- ======================== 基本信息 ======================== -->
      <el-row :gutter="16">
        <el-col :span="6">
          <el-form-item label="选择客户" prop="customerId">
            <!-- 订单表单入口：锁定当前订单客户，禁止搜索切换 -->
            <div v-if="customerLocked" class="flex items-center w-full gap-4px">
              <el-input v-model="customerInput" disabled class="flex-1" />
            </div>
            <div v-else class="flex items-center w-full gap-4px">
              <el-input
                v-model="customerInput"
                placeholder="输入客户名称后回车搜索"
                clearable
                class="flex-1"
                @keyup.enter="handleOpenCustomerSearch"
                @clear="handleClearCustomer"
              />
              <el-button
                :icon="SearchIcon"
                circle
                size="small"
                title="搜索客户"
                @click="handleOpenCustomerSearch"
              />
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="账户余额">
            <span
              class="text-sm font-medium leading-32px"
              :class="
                customerBalance == null
                  ? 'text-gray-700'
                  : customerBalance < 0
                    ? 'text-red-500'
                    : customerBalance > 0
                      ? 'text-green-500'
                      : 'text-gray-700'
              "
            >
              {{ customerBalance != null ? customerBalance.toFixed(2) : '-' }}
            </span>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="收款日期" prop="billDate">
            <el-date-picker
              v-model="formData.billDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择收款日期"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="收支方式" prop="billMethodId">
            <el-select
              v-model="formData.billMethodId"
              placeholder="请选择收支方式"
              clearable
              class="!w-full"
            >
              <el-option
                v-for="item in billMethodsList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="优惠金额" prop="discountAmount">
            <el-input-number
              v-model="formData.discountAmount"
              :min="0"
              :precision="2"
              placeholder="请输入优惠金额"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="实收金额" prop="actualAmount">
            <el-input-number
              v-model="formData.actualAmount"
              :min="0"
              :precision="2"
              placeholder="请输入实收金额"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="备注" prop="note">
            <el-input v-model="formData.note" placeholder="请输入备注" class="!w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="附件1">
            <UploadImg v-model="attachment1" width="90px" height="90px" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="附件2">
            <UploadImg v-model="attachment2" width="90px" height="90px" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- ======================== 分摊操作区 ======================== -->
      <div class="flex items-center gap-24px py-10px">
        <el-button type="primary" size="small" @click="handleAllocate">分摊到明细</el-button>
        <span class="text-sm text-gray-600">
          合计分摊金额：<span class="text-blue-500 font-medium">{{ totalAllocAmount.toFixed(2) }}</span>
        </span>
        <span class="text-sm text-gray-600">
          选中订单应收金额：<span class="font-medium">{{ selectedUnpaidAmount.toFixed(2) }}</span>
        </span>
        <span class="text-sm text-gray-600">
          分摊剩余金额：
          <span :class="remainingAmount < 0 ? 'text-red-500' : 'text-blue-500'" class="font-medium">
            {{ remainingAmount.toFixed(2) }}
          </span>
        </span>
      </div>

      <!-- ======================== 订单分摊 ======================== -->
      <el-divider content-position="left">分摊到订单（已确认、未结清）</el-divider>
      <div v-if="!formData.customerId" class="text-center text-gray-400 py-20px text-sm">
        请先选择客户以加载相关订单
      </div>
      <div v-else-if="ordersLoading" class="text-center py-20px">
        <el-text type="info">加载订单中...</el-text>
      </div>
      <div v-else-if="orderList.length === 0" class="text-center text-gray-400 py-20px text-sm">
        该客户暂无未结清的已确认订单
      </div>
      <template v-else>
        <el-table
          ref="orderTableRef"
          :data="orderList"
          size="small"
          border
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" :selectable="(row) => row.status !== 'DISCARDED'" width="45" />
          <el-table-column label="结算状态" prop="payStatus" width="100" align="center">
            <template #default="{ row }">
              <dict-tag :type="DICT_TYPE.ZC_ORDER_PAY_STATUS" :value="row.payStatus" />
            </template>
          </el-table-column>
          <el-table-column label="本次收款" width="150" align="center">
            <template #default="{ row }">
              <el-input-number
                v-model="allocMap[row.id]"
                :min="0"
                :max="getOrderRemainingAmount(row)"
                :precision="2"
                size="small"
                class="!w-full"
                @change="(val) => handleAllocAmountChange(row, val)"
              />
            </template>
          </el-table-column>
          <el-table-column label="订单号" prop="orderNo" min-width="140" />
          <el-table-column label="下单日期" prop="orderDate" width="110">
            <template #default="{ row }">{{ formatDate(row.orderDate) }}</template>
          </el-table-column>
          <el-table-column label="订单金额" prop="amount" width="110" align="right" />
          <el-table-column label="已收金额" prop="amountReceived" width="110" align="right" />
          <el-table-column label="剩余金额" width="110" align="right">
            <template #default="{ row }">
              {{ getOrderRemainingAmount(row).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submitForm">确认</el-button>
    </template>
  </Dialog>

  <!-- 客户搜索弹窗：列表页入口使用，订单表单入口已锁定客户时不渲染 -->
  <CustomerSearchDialog
    v-if="!customerLocked"
    ref="customerSearchDialogRef"
    @select="handleSelectCustomerFromSearch"
  />
</template>

<script setup lang="ts">
import { Search as SearchIcon } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { DICT_TYPE } from '@/utils/dict'
import { ZcBillsApi, ZcBillsSaveReqVO } from '@/api/zc/finance/collection'
import { SalesOrderApi, SalesOrder } from '@/api/zc/salesorder'
import { BillMethodsApi, BillMethods } from '@/api/zc/bill_methods'
import { CustomerApi, type Customer } from '@/api/zc/customer'
import { UploadImg } from '@/components/UploadFile'
import CustomerSearchDialog from './CustomerSearchDialog.vue'

// ======================== Props / Emits ========================
const emit = defineEmits(['success'])

// ======================== 弹窗状态 ========================
const dialogVisible = ref(false)
const formLoading = ref(false)
const submitLoading = ref(false)

// ======================== 表单数据 ========================
const formRef = ref()
/** 两个附件字段，提交时合并为 attachments 数组 */
const attachment1 = ref<string>('')
const attachment2 = ref<string>('')

const formData = reactive<ZcBillsSaveReqVO>({
  billDate: dayjs().format('YYYY-MM-DD'),
  customerId: undefined,
  actualAmount: undefined as unknown as number,
  discountAmount: 0,
  billMethodId: undefined as unknown as number,
  note: undefined,
  attachments: [],
  orderItems: []
})

const formRules = {
  billDate: [{ required: true, message: '请选择收款日期', trigger: 'change' }],
  actualAmount: [{ required: true, message: '请输入实收金额', trigger: 'blur' }],
  billMethodId: [{ required: true, message: '请选择收支方式', trigger: 'change' }]
}

// ======================== 客户选择 ========================
/** 是否锁定客户（订单表单入口传入 customerId 时为 true，禁用搜索） */
const customerLocked = ref(false)
/** 客户输入框展示文本：搜索前为用户输入，选中后为「简称/联系人」 */
const customerInput = ref('')
/** 当前选中客户的账户余额，选择客户或 getCustomer 后同步 */
const customerBalance = ref<number | null>(null)

const customerSearchDialogRef = ref<InstanceType<typeof CustomerSearchDialog>>()

/** 回车打开客户搜索弹窗，并将当前输入作为初始搜索词 */
const handleOpenCustomerSearch = () => {
  customerSearchDialogRef.value?.open(customerInput.value)
}

/** 清空输入时同步清除已选客户及订单列表 */
const handleClearCustomer = () => {
  handleCustomerChange(undefined)
}

/** 回填客户展示信息及账户余额 */
const applyCustomerInfo = (customer: Customer) => {
  customerInput.value = `${customer.shortName ?? ''}/${customer.contactName ?? ''}`
  formData.customerId = customer.id
  customerBalance.value = customer.balance ?? null
}

/** 搜索弹窗选中客户：回填展示文本与 customerId，并加载可分摊订单 */
const handleSelectCustomerFromSearch = async (customer: Customer) => {
  applyCustomerInfo(customer)
  await handleCustomerChange(customer.id)
}

// ======================== 订单列表 ========================
/** 该客户可分摊的订单列表 */
const orderList = ref<SalesOrder[]>([])
const ordersLoading = ref(false)
/** 每条订单对应的本次收款金额，key 为 orderId */
const allocMap = reactive<Record<number, number | undefined>>({})
/** 当前勾选的订单行 */
const selectedOrders = ref<SalesOrder[]>([])
const orderTableRef = ref()
/** 批量分摊进行中，避免 el-input-number @change 与 handleAllocate 互相覆盖 */
const isBulkAllocating = ref(false)

const handleSelectionChange = (rows: SalesOrder[]) => {
  selectedOrders.value = rows
}

// ======================== 分摊统计 ========================
/** 合计分摊金额 = 实收金额 + 优惠金额 */
const totalAllocAmount = computed(
  () => Math.round(((formData.actualAmount || 0) + (formData.discountAmount || 0)) * 100) / 100
)

/** 当前勾选订单的合计应收金额（订单金额 - 已收金额） */
const selectedUnpaidAmount = computed(() =>
  selectedOrders.value.reduce(
    (sum, o) => Math.round((sum + getOrderRemainingAmount(o)) * 100) / 100,
    0
  )
)

/** 分摊剩余金额 = 合计分摊金额 - 已填写的本次收款合计 */
const remainingAmount = computed(() => {
  const allocated = Object.values(allocMap).reduce((sum, v) => sum + (v || 0), 0)
  return Math.round((totalAllocAmount.value - allocated) * 100) / 100
})

/**
 * 将合计分摊金额按订单显示顺序依次分摊到已勾选的订单
 * 每笔订单最多分摊其未结余额（订单金额 - 已收金额），余额不足则继续分摊到下一笔
 */
const handleAllocate = () => {
  if (totalAllocAmount.value <= 0) {
    message.warning('请先填写实收金额')
    return
  }
  if (selectedOrders.value.length === 0) {
    message.warning('请先勾选要分摊的订单')
    return
  }
  // 按 orderList 顺序过滤出已勾选的订单，保证从上到下分摊
  const orderedSelected = orderList.value.filter((o) =>
    selectedOrders.value.some((s) => s.id === o.id)
  )
  isBulkAllocating.value = true
  try {
    // 先清空已选订单的旧分摊，避免残留金额干扰
    for (const order of orderedSelected) {
      if (order.id != null) delete allocMap[order.id]
    }
    let remaining = totalAllocAmount.value
    for (const order of orderedSelected) {
      if (order.id == null || remaining <= 0) break
      const unpaid = getOrderRemainingAmount(order)
      if (unpaid <= 0) continue
      const alloc = Math.min(remaining, unpaid)
      allocMap[order.id] = Math.round(alloc * 100) / 100
      remaining = Math.round((remaining - alloc) * 100) / 100
    }
    syncOrderItems()
    nextTick(() => {
      for (const order of orderedSelected) {
        syncOrderRowSelection(order, allocMap[order.id!] ?? 0)
      }
    })
  } finally {
    nextTick(() => {
      isBulkAllocating.value = false
    })
  }
}

/** 客户切换时重新加载订单并清空已选状态 */
const handleCustomerChange = async (customerId: number | undefined) => {
  orderList.value = []
  selectedOrders.value = []
  Object.keys(allocMap).forEach((k) => delete allocMap[Number(k)])
  formData.orderItems = []
  if (!customerId) {
    customerBalance.value = null
    return
  }

  ordersLoading.value = true
  try {
    const data = await SalesOrderApi.getSalesOrderPage({
      pageNo: 1,
      pageSize: 100,
      customerId,
      payStatus: ['unpaid', 'partialpaid'],
      isConfirm: true
    })
    orderList.value = (data.list ?? []).filter((o) => o.status !== 'DISCARDED')
  } finally {
    ordersLoading.value = false
  }
}

/** 将 allocMap 同步回 formData.orderItems */
const syncOrderItems = () => {
  formData.orderItems = Object.entries(allocMap)
    .filter(([, v]) => v != null && v > 0)
    .map(([k, v]) => ({ orderId: Number(k), allocatedAmount: v as number }))
}

/**
 * 根据本次收款金额自动勾选/取消勾选订单行
 * 输入金额 > 0 时自动选中，便于与「分摊到明细」等统计联动
 */
const syncOrderRowSelection = (order: SalesOrder, amount: number) => {
  if (order.id == null || !orderTableRef.value) return
  const isSelected = selectedOrders.value.some((o) => o.id === order.id)
  if (amount > 0 && !isSelected) {
    orderTableRef.value.toggleRowSelection(order, true)
  } else if (amount <= 0 && isSelected) {
    orderTableRef.value.toggleRowSelection(order, false)
  }
}

/**
 * 校验单笔订单本次收款：不能超过订单剩余应收（订单金额 - 已收金额）
 * 超出时提示并自动修正为最大可收金额
 */
const handleAllocAmountChange = (order: SalesOrder, value: number | null | undefined) => {
  if (order.id == null || isBulkAllocating.value) return
  const maxAmount = getOrderRemainingAmount(order)
  let amount = value ?? 0
  if (amount > maxAmount) {
    message.warning(`本次收款不能大于订单金额（剩余 ${maxAmount.toFixed(2)}）`)
    amount = maxAmount
    allocMap[order.id] = maxAmount
  }
  syncOrderItems()
  nextTick(() => syncOrderRowSelection(order, amount))
}

/** 提交前校验分摊明细：orderItems 不能为空，且每笔本次收款不得超过对应订单剩余应收 */
const validateOrderItems = (): boolean => {
  syncOrderItems()
  if (formData.orderItems.length === 0) {
    message.warning('请选择收款订单并输入收款金额，或使用「分摊到明细」按钮')
    return false
  }
  for (const item of formData.orderItems) {
    const order = orderList.value.find((o) => o.id === item.orderId)
    if (!order) continue
    const maxAmount = getOrderRemainingAmount(order)
    if (item.allocatedAmount > maxAmount) {
      message.warning(`订单 ${order.orderNo} 本次收款不能大于订单金额（剩余 ${maxAmount.toFixed(2)}）`)
      return false
    }
  }
  return true
}

// ======================== 收支方式 ========================
const billMethodsList = ref<BillMethods[]>([])

const loadBillMethods = async () => {
  const data = await BillMethodsApi.getBillMethodsPage({ pageNo: 1, pageSize: 200 })
  billMethodsList.value = data.list ?? []
}

// ======================== 工具函数 ========================
const formatDate = (val: string | number | undefined) => {
  if (!val) return ''
  return dayjs(val).format('YYYY-MM-DD')
}

/** 订单应收基数：优先 amount，列表未返回时回退 totalAmount */
const getOrderReceivableAmount = (order: SalesOrder) => order.amount ?? order.totalAmount ?? 0

/** 订单剩余应收金额 = 订单金额 - 已收金额（与分摊逻辑一致，最小为 0） */
const getOrderRemainingAmount = (order: SalesOrder) =>
  Math.round(Math.max(0, getOrderReceivableAmount(order) - (order.amountReceived ?? 0)) * 100) / 100

// ======================== 弹窗控制 ========================
/**
 * 打开弹窗，由父组件调用
 * @param customerId 可选，传入时锁定该客户（通过 getCustomer 加载信息，禁用客户搜索）
 */
const open = async (customerId?: number) => {
  dialogVisible.value = true
  formLoading.value = true
  customerLocked.value = !!customerId
  try {
    Object.assign(formData, {
      billDate: dayjs().format('YYYY-MM-DD'),
      customerId: undefined,
      actualAmount: undefined,
      discountAmount: 0,
      billMethodId: undefined,
      note: undefined,
      attachments: [],
      orderItems: []
    })
    attachment1.value = ''
    attachment2.value = ''
    customerInput.value = ''
    customerBalance.value = null
    orderList.value = []
    Object.keys(allocMap).forEach((k) => delete allocMap[Number(k)])
    formRef.value?.resetFields()
    await loadBillMethods()
    // 订单表单入口：直接拉取当前订单客户详情，无需搜索
    if (customerId) {
      const customer = await CustomerApi.getCustomer(customerId)
      applyCustomerInfo(customer)
      await handleCustomerChange(customer.id)
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open })

// ======================== 提交 ========================
const message = useMessage()

const submitForm = async () => {
  await formRef.value?.validate()
  if (!validateOrderItems()) return
  // 将两个附件字段合并为 attachments 数组（过滤空值）
  formData.attachments = [attachment1.value, attachment2.value].filter(Boolean) as string[]
  submitLoading.value = true
  try {
    await ZcBillsApi.create(formData)
    message.success('收款单创建成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    submitLoading.value = false
  }
}
</script>
