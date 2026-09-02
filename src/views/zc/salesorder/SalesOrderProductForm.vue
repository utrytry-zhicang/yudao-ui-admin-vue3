<!--
  面料单 新增/修改弹窗
  表单顶部（操作栏 + 基础信息三行）与成品单（SalesOrderForm.vue）保持一致
  底部为面料批次列表（货号 / 批次 / 规格 / 用料 / 单位 / 单价 / 金额 / 备注）
  通过 open(type, id?) 方法打开，成功后 emit('success') 通知父组件刷新列表
-->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="90%" top="3vh" :close-on-click-modal="false">
    <!-- 顶部操作栏（与成品单一致） -->
    <div class="mb-12px flex items-center gap-8px border-b border-gray-200 pb-12px">
      <el-button type="primary" @click="handleSave" :loading="formLoading">
        <Icon icon="ep:finished" class="mr-4px" />保存
      </el-button>
      <!-- 确认订单按钮：订单已保存且无 confirmTime 时显示 -->
      <el-button
        v-if="formData.id && !hasConfirmTime"
        type="success"
        @click="handleConfirm"
        :loading="formLoading"
      >
        <Icon icon="ep:circle-check" class="mr-4px" />确认订单
      </el-button>
      <!-- 取消确认按钮：存在 confirmTime 时显示 -->
      <el-button
        v-if="formData.id && hasConfirmTime"
        type="danger"
        @click="handleCancelConfirm"
        :loading="formLoading"
      >
        <Icon icon="ep:circle-close" class="mr-4px" />取消确认
      </el-button>
      <!-- 新增收款：已保存且已关联客户时显示；未确认（无 confirmTime）时置灰 -->
      <el-tooltip content="请先确认订单" :disabled="hasConfirmTime" placement="top">
        <span class="inline-flex">
          <el-button
            v-if="formData.id && formData.customerId"
            type="warning"
            plain
            :disabled="!hasConfirmTime"
            @click="handleOpenCollection"
          >
            <Icon icon="ep:wallet" class="mr-4px" />新增收款
          </el-button>
        </span>
      </el-tooltip>
      <!-- 加急按钮：订单已保存且未加急时显示；未确认（无 confirmTime）时置灰 -->
      <el-tooltip content="请先确认订单" :disabled="hasConfirmTime" placement="top">
        <span class="inline-flex">
          <el-button
            v-if="formData.id && !formData.isExpedited"
            type="warning"
            :disabled="!hasConfirmTime"
            @click="handleExpedite"
            :loading="formLoading"
          >
            <Icon icon="ep:timer" class="mr-4px" />加急
          </el-button>
        </span>
      </el-tooltip>
      <!-- 取消加急按钮：订单已保存且已加急时显示；未确认（无 confirmTime）时置灰 -->
      <el-tooltip content="请先确认订单" :disabled="hasConfirmTime" placement="top">
        <span class="inline-flex">
          <el-button
            v-if="formData.id && formData.isExpedited"
            type="info"
            plain
            :disabled="!hasConfirmTime"
            @click="handleCancelExpedite"
            :loading="formLoading"
          >
            <Icon icon="ep:timer" class="mr-4px" />取消加急
          </el-button>
        </span>
      </el-tooltip>
      <!-- 销售单预览打印：订单已保存时显示；未确认（无 confirmTime）时置灰 -->
      <el-tooltip content="请先确认订单" :disabled="hasConfirmTime" placement="top">
        <span class="inline-flex">
          <el-button
            v-if="formData.id"
            type="info"
            :disabled="!hasConfirmTime"
            @click="handlePrint"
          >
            <Icon icon="ep:printer" class="mr-4px" />销售单
          </el-button>
        </span>
      </el-tooltip>
      <!-- 面料加工单预览打印：订单已保存时显示；未确认（无 confirmTime）时置灰 -->
      <el-tooltip content="请先确认订单" :disabled="hasConfirmTime" placement="top">
        <span class="inline-flex">
          <el-button
            v-if="formData.id"
            type="info"
            plain
            :disabled="!hasConfirmTime"
            @click="handlePrintProcessing"
          >
            <Icon icon="ep:document" class="mr-4px" />加工单
          </el-button>
        </span>
      </el-tooltip>
      <!-- 发货联按钮：订单已保存时显示；未确认（无 confirmTime）时置灰 -->
      <el-tooltip content="请先确认订单" :disabled="hasConfirmTime" placement="top">
        <span class="inline-flex">
          <el-button
            v-if="formData.id"
            type="success"
            plain
            :disabled="!hasConfirmTime"
            @click="handlePrintShipping"
          >
            <Icon icon="ep:van" class="mr-4px" />发货联
          </el-button>
        </span>
      </el-tooltip>
    </div>

    <div ref="enterNavRootRef" @keydown.enter="handleEnterFocusNext">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="68px" v-loading="formLoading">
      <!-- 第一行：flex 流式布局，数字为各字段宽度比例 -->
      <div class="flex gap-x-8px">
        <!-- 订单号 2：较窄，后端自动生成 -->
        <el-form-item label="订单号" prop="orderNo" style="flex: 2.5; min-width: 0">
          <el-input v-model="formData.orderNo" disabled placeholder="" class="w-full" />
        </el-form-item>
        <!-- 客户 3：需展示姓名/联系人，稍宽；订单保存后禁止切换客户 -->
        <el-form-item label="客户" prop="customerId" style="flex: 2.5; min-width: 0">
          <div class="flex items-center w-full gap-4px">
            <el-input
              v-model="customerInput"
              placeholder="输入客户名称后回车搜索"
              :clearable="!isCustomerLocked"
              class="flex-1"
              :disabled="isCustomerLocked"
              data-enter-skip
              @keyup.enter="handleOpenCustomerSearch"
              @clear="handleClearCustomer"
            />
            <el-button
              :icon="SearchIcon"
              circle
              size="small"
              :disabled="isCustomerLocked"
              @click="handleOpenCustomerSearch"
              title="搜索客户"
            />
          </div>
        </el-form-item>
        <!-- 手机 2 -->
        <el-form-item label="手机" prop="mobile" style="flex: 2.5; min-width: 0">
          <el-input v-model="formData.mobile" placeholder="请输入手机" class="w-full" />
        </el-form-item>
        <!-- 下单日期 2 -->
        <el-form-item label="下单日期" prop="orderDate" style="flex: 2.5; min-width: 0">
          <el-date-picker v-model="formData.orderDate" type="date" value-format="YYYY-MM-DD" placeholder="选择下单日期" class="!w-full" :clearable="false" />
        </el-form-item>
        <!-- 品牌 2 -->
        <el-form-item label="品牌" prop="brandId" style="flex: 2.5; min-width: 0">
          <el-select v-model="formData.brandId" clearable filterable placeholder="请选择品牌" class="w-full">
            <el-option v-for="item in props.brandsList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <!-- 物流 2：支持从列表选择或手输；未匹配到列表项时 logisticId 为空，仅传 logisticName -->
        <el-form-item label="物流" prop="logisticName" style="flex: 2.5; min-width: 0">
          <el-autocomplete
            v-model="formData.logisticName"
            :fetch-suggestions="fetchLogisticSuggestions"
            clearable
            placeholder="请输入或选择物流"
            class="w-full"
            value-key="name"
            @select="handleLogisticSelect"
            @blur="syncLogisticIdByName"
          />
        </el-form-item>
        <!-- 收货人 2 -->
        <el-form-item label="收货人" prop="receiver" style="flex: 2.2; min-width: 0">
          <el-input v-model="formData.receiver" placeholder="请输入收货人" class="w-full" />
        </el-form-item>
        <!-- 交付日期 2 -->
        <el-form-item label="交付日期" prop="deliveryDate" style="flex: 2.5; min-width: 0">
          <el-date-picker v-model="formData.deliveryDate" type="date" value-format="YYYY-MM-DD" placeholder="选择交付日期" class="!w-full" />
        </el-form-item>

      </div>

      <!-- 第二行 -->
      <div class="flex gap-x-8px">
        <!-- 送货地址 3：地址文字较长，适当加宽 -->
        <el-form-item label="送货地址" prop="deliveryAddress" style="flex: 4; min-width: 0">
          <el-input v-model="formData.deliveryAddress" placeholder="请输入送货地址" class="w-full" />
        </el-form-item>
        <!-- 运费 2；确认后不可修改 -->
        <el-form-item label="运费" prop="freight" style="flex: 2; min-width: 0">
          <el-input-number v-model="formData.freight" placeholder="请输入运费" :controls="false" :disabled="hasConfirmTime" class="!w-full" />
        </el-form-item>
        <!-- 优惠金额 2；确认后不可修改 -->
        <el-form-item label="优惠金额" prop="discountAmount" style="flex: 2; min-width: 0">
          <el-input-number
            v-model="formData.discountAmount"
            placeholder="请输入优惠金额"
            :min="0"
            :max="orderTotalBeforeDiscount"
            :controls="false"
            :disabled="hasConfirmTime"
            class="!w-full"
          />
        </el-form-item>
        <!-- 金额 2 -->
        <el-form-item label="金额" prop="amount" style="flex: 2; min-width: 0">
          <el-input v-model="formData.amount" disabled class="w-full" />
        </el-form-item>
        <!-- 账户余额 2 -->
        <el-form-item label="账户余额" style="flex: 2; min-width: 0">
          <span
            class="text-sm font-medium"
            :class="
              selectedCustomerBalance == null
                ? 'text-gray-700'
                : selectedCustomerBalance < 0
                  ? 'text-red-500'
                  : selectedCustomerBalance > 0
                    ? 'text-green-500'
                    : 'text-gray-700'
            "
          >
            {{ selectedCustomerBalance != null ? selectedCustomerBalance : '-' }}
          </span>
        </el-form-item>
        <!-- 备注 6：剩余空间较多，撑满 -->
        <el-form-item label="备注" prop="note" style="flex: 6; min-width: 0">
          <el-input v-model="formData.note" placeholder="请输入备注" class="w-full" :input-style="{ color: '#DC2626' }" />
        </el-form-item>
      </div>
    </el-form>

    <!-- 面料批次列表 -->
    <el-divider content-position="left">面料列表</el-divider>
    <div style="height: 200px; overflow-y: auto; padding-right: 4px">
      <template v-if="formData.batchs.length > 0">
        <!-- 列表标题行 -->
        <el-row :gutter="12" class="text-xs text-gray-700 font-semibold mb-4px px-4px">
          <el-col :span="1" />
          <el-col :span="5">货号</el-col>
          <el-col :span="4">批次</el-col>
          <el-col :span="3">规格</el-col>
          <el-col :span="2">用料</el-col>
          <el-col :span="2">单位</el-col>
          <el-col :span="2">单价</el-col>
          <el-col :span="2">金额</el-col>
          <el-col :span="3">备注</el-col>
        </el-row>
        <!-- 批次数据行 -->
        <el-row
          v-for="(batch, idx) in formData.batchs"
          :key="idx"
          :gutter="12"
          class="mb-4px items-center rounded bg-blue-50 px-2px py-4px"
        >
          <el-col :span="1" class="flex justify-center">
            <el-button v-if="!hasConfirmTime" link type="danger" size="small" @click="removeBatch(idx)">
              <Icon icon="ep:delete" />
            </el-button>
          </el-col>
          <!-- 货号（由面板回填，只读展示） -->
          <el-col :span="5">
            <el-input
              v-model="batch.productName"
              placeholder="货号"
              size="small"
              class="!w-full"
              readonly
            />
          </el-col>
          <!-- 批次号（由面板回填，只读展示） -->
          <el-col :span="4">
            <el-input
              v-model="batch.batchNo"
              placeholder="批次"
              size="small"
              class="!w-full"
              readonly
            />
          </el-col>
          <!-- 规格：有批次时只读展示；仅选产品时可从版本规格列表中下拉选择 -->
          <el-col :span="3">
            <el-select
              v-if="!batch.batchId && batch.specConfs && batch.specConfs.length > 0"
              v-model="batch.spec"
              placeholder="规格"
              size="small"
              class="!w-full"
              clearable
              :disabled="hasConfirmTime"
              @change="(spec: string) => handleBatchSpecChange(batch, spec)"
            >
              <el-option
                v-for="sc in batch.specConfs"
                :key="sc.spec"
                :label="sc.spec"
                :value="sc.spec"
              />
            </el-select>
            <el-input
              v-else
              v-model="batch.spec"
              placeholder="规格"
              size="small"
              class="!w-full"
              :readonly="!!batch.batchId || hasConfirmTime"
            />
          </el-col>
          <el-col :span="2">
            <el-input-number
              v-model="batch.quantity"
              placeholder="用料"
              size="small"
              :controls="false"
              class="!w-full"
              :disabled="hasConfirmTime"
            />
          </el-col>
          <!-- 单位由批次回填，只读展示 -->
          <el-col :span="2" class="flex items-center justify-center">
            <dict-tag v-if="batch.unitValue" :type="DICT_TYPE.ZC_PRODUCT_UNIT" :value="batch.unitValue" />
            <span v-else class="text-xs text-gray-400">-</span>
          </el-col>
          <el-col :span="2">
            <el-input-number
              v-model="batch.price"
              placeholder="单价"
              size="small"
              :controls="false"
              class="!w-full"
              :disabled="hasConfirmTime"
            />
          </el-col>
          <!-- 金额由数量 × 单价自动计算，禁止手动编辑 -->
          <el-col :span="2">
            <el-input-number
              v-model="batch.amount"
              placeholder="金额"
              size="small"
              :controls="false"
              class="!w-full"
              disabled
            />
          </el-col>
          <el-col :span="3">
            <el-input v-model="batch.note" placeholder="备注" size="small" :disabled="hasConfirmTime" />
          </el-col>
        </el-row>
      </template>
      <el-empty
        v-else
        description="暂无面料数据，请在下方选择面料"
        :image-size="60"
        class="py-16px"
      />
    </div>
    </div>

    <!-- 面料选择面板（内嵌，确认后直接追加到上方列表）；订单已确认后隐藏 -->
    <template v-if="!hasConfirmTime">
      <el-divider content-position="left">选择面料</el-divider>
      <ProductBatchSelectPanel @confirm="handleBatchConfirm" />
    </template>

    <!-- 面料单打印预览弹窗 -->
    <SalesOrderProductPrintDialog
      ref="printDialogRef"
      :customers-list="customersListForPrint"
      :brands-list="props.brandsList"
      :logistics-list="props.logisticsList"
    />
    <!-- 面料加工单打印预览弹窗 -->
    <SalesOrderProductProcessingPrintDialog
      ref="processingPrintDialogRef"
      :customers-list="customersListForPrint"
      :brands-list="props.brandsList"
      :logistics-list="props.logisticsList"
    />
    <!-- 发货联打印预览弹窗 -->
    <SalesOrderProductShippingDialog
      ref="shippingDialogRef"
      :customers-list="customersListForPrint"
      :brands-list="props.brandsList"
      :logistics-list="props.logisticsList"
    />
    <!-- 新增收款弹窗：锁定当前订单客户 -->
    <CollectionDialog ref="collectionDialogRef" @success="handleCollectionSuccess" />
    <!-- 客户搜索弹窗 -->
    <CustomerSearchDialog ref="customerSearchDialogRef" @select="handleSelectCustomerFromSearch" />
  </Dialog>
</template>

<script setup lang="ts">
import { Search as SearchIcon } from '@element-plus/icons-vue'
import { SalesOrderApi, SalesOrderType, SalesOrderDetailCurtain } from '@/api/zc/salesorder'
import { CustomerApi, type Customer, type CustomerSimpleVO } from '@/api/zc/customer'
import { ProductVersionSpecSimpleVO } from '@/api/zc/productversion'
import CustomerSearchDialog from './CustomerSearchDialog.vue'
import { BrandSimpleVO } from '@/api/zc/brand'
import { LogisticsSimpleVO } from '@/api/zc/logistics'
import { CustomerVersionSpcPriceApi } from '@/api/zc/customerversionspcprice'
import { DICT_TYPE } from '@/utils/dict'
import ProductBatchSelectPanel, { type BatchConfirmItem } from './ProductBatchSelectPanel.vue'
import SalesOrderProductPrintDialog from './SalesOrderProductPrintDialog.vue'
import SalesOrderProductProcessingPrintDialog from './SalesOrderProductProcessingPrintDialog.vue'
import SalesOrderProductShippingDialog from './SalesOrderProductShippingDialog.vue'
import CollectionDialog from './CollectionDialog.vue'

/** 面料单 表单 */
defineOptions({ name: 'SalesOrderProductForm' })

const props = defineProps<{
  brandsList: BrandSimpleVO[]
  logisticsList: LogisticsSimpleVO[]
}>()

const emit = defineEmits(['success', 'open-sales-order-form'])

const { t } = useI18n()
const message = useMessage()

// ======================== 弹窗状态 ========================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
/** 当前选中客户的账户余额，选择客户时自动同步 */
const selectedCustomerBalance = ref<number | null>(null)
/** 客户输入框展示文本：搜索前为用户输入，选中后为「简称/联系人」 */
const customerInput = ref('')
/** 当前选中客户信息，供打印弹窗展示客户名称 */
const selectedCustomerInfo = ref<CustomerSimpleVO | null>(null)
const customersListForPrint = computed(() => (selectedCustomerInfo.value ? [selectedCustomerInfo.value] : []))

// ======================== 批次行内部类型 ========================
/**
 * 与 ZCSalesOrderMaterial 兼容字段（productId/batchId/productName/batchNo/unitValue/price），
 * 以便直接传给 ProductBatchSelectDialog 回填；提交时映射为 product_id / batch_id（后端约定）
 */
interface BatchRow {
  id?: number              // 用料明细行 ID（更新时回传，新增行为 undefined）
  curtainRowId?: number    // 窗帘行 ID（更新时回传，新增行为 undefined）
  structureRowId?: number  // 结构行 ID（更新时回传，新增行为 undefined）
  productId?: number       // 产品 ID
  productName?: string     // 货号名称（展示用）
  spec?: string       // 产品规格
  specConfs?: ProductVersionSpecSimpleVO[]  // 当前版本的可选规格列表，仅选产品时用于渲染下拉
  batchId?: number         // 批次 ID
  batchNo?: string         // 批次号（展示用）
  unitValue?: string       // 计量单位（由批次回填，只读展示）
  price?: number           // 单价
  quantity?: number        // 数量
  amount?: number          // 金额（数量 × 单价，自动计算）
  note?: string            // 备注
  classify?: string        // 产品版本分类（用于统计窗帘布用料合计，chuanglianbu=窗帘布）
}

// ======================== 表单数据 ========================
/** 从品牌列表中取默认品牌 ID：优先 isDefault=true 的，否则取第一个 */
const getDefaultBrandId = () => {
  const list = props.brandsList
  if (!list?.length) return undefined
  return (list.find((b) => b.isDefault) ?? list[0]).id
}

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const getInitFormData = () => ({
  id: undefined as number | undefined,
  orderNo: undefined as string | undefined,
  customerId: undefined as number | undefined,
  mobile: undefined as string | undefined,
  brandId: undefined as number | undefined,
  orderDate: todayStr() as any,
  logisticId: undefined as number | undefined,
  logisticName: undefined as string | undefined,
  receiver: undefined as string | undefined,
  deliveryAddress: undefined as string | undefined,
  freight: undefined as number | undefined,
  types: SalesOrderType.FABRIC,
  discountAmount: undefined as number | undefined,
  amount: undefined as any,
  rounding: undefined as number | undefined,
  deliveryDate: (() => { const d = new Date(); d.setDate(d.getDate() + 6); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })() as string | undefined,
  payStatus: undefined as string | undefined,
  status: undefined as string | undefined,
  confirmTime: undefined as string | undefined,
  isExpedited: undefined as boolean | undefined,
  note: undefined as string | undefined,
  batchs: [] as BatchRow[],
})

const formData = ref(getInitFormData())

/** 优惠前订单金额 = 面料明细合计 + 运费（与 totalAmount 一致） */
const getOrderTotalBeforeDiscount = (form = formData.value) => {
  const lineSum = form.batchs.reduce((sum, b) => sum + (b.amount ?? 0), 0)
  return Math.round((lineSum + (form.freight ?? 0)) * 100) / 100
}

/** 供优惠金额输入框 max 限制及校验使用 */
const orderTotalBeforeDiscount = computed(() => getOrderTotalBeforeDiscount(formData.value))

/** 订单是否已确认：以 confirmTime 是否存在为准，不依赖 status 字段 */
const hasConfirmTime = computed(() => {
  const confirmTime = formData.value.confirmTime
  return confirmTime != null && confirmTime !== ''
})

const formRules = {
  customerId: [{ required: true, message: '客户不能为空', trigger: 'blur' }],
  mobile: [{ required: true, message: '手机不能为空', trigger: 'blur' }],
  receiver: [{ required: true, message: '收货人不能为空', trigger: 'blur' }],
  discountAmount: [{
    validator: (_rule: unknown, value: number | undefined, callback: (err?: Error) => void) => {
      if (value == null || value === '') {
        callback()
        return
      }
      if (value > getOrderTotalBeforeDiscount()) {
        callback(new Error('优惠金额不能大于订单金额'))
        return
      }
      callback()
    },
    trigger: ['blur', 'change']
  }],
}

const formRef = ref()
/** 回车跳转：覆盖基础信息表单与面料批次列表内的可编辑输入框 */
const enterNavRootRef = ref<HTMLElement>()

/** 收集容器内按 DOM 顺序排列、可聚焦的输入框（跳过禁用、只读、隐藏及客户搜索框） */
const getEnterNavigableInputs = (): HTMLInputElement[] => {
  const root = enterNavRootRef.value
  if (!root) return []
  return Array.from(root.querySelectorAll<HTMLInputElement>('input:not([disabled]):not([type="hidden"])')).filter(
    (input) => {
      if (input.closest('[data-enter-skip]')) return false
      // el-select / 日期 / 自动完成内部 input 常带 readonly，但仍需参与回车跳转
      const inElFormControl = input.closest('.el-select, .el-date-picker, .el-autocomplete')
      if (!inElFormControl && input.readOnly) return false
      // 过滤不可见输入（如日期选择器等附属隐藏 input）
      if (input.offsetParent === null) {
        const { width, height } = input.getBoundingClientRect()
        if (width === 0 && height === 0) return false
      }
      return true
    }
  )
}

/** Element Plus 下拉/日期面板展开时，回车应留给组件自身（选中选项、确认日期等） */
const hasOpenElPopper = () =>
  Array.from(document.querySelectorAll('.el-popper')).some(
    (el) => el.getAttribute('aria-hidden') !== 'true' && window.getComputedStyle(el).visibility !== 'hidden'
  )

/** 回车跳转到下一个可编辑输入框 */
const handleEnterFocusNext = (event: KeyboardEvent) => {
  if (event.isComposing) return
  const target = event.target as HTMLElement
  if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return
  if (target.closest('[data-enter-skip]')) return
  if (hasOpenElPopper()) return

  const input = target as HTMLInputElement
  if (input.disabled) return
  const inElFormControl = input.closest('.el-select, .el-date-picker, .el-autocomplete')
  if (!inElFormControl && input.readOnly) return

  const inputs = getEnterNavigableInputs()
  const currentIndex = inputs.indexOf(input)
  if (currentIndex < 0 || currentIndex >= inputs.length - 1) return

  event.preventDefault()
  const next = inputs[currentIndex + 1]
  next.focus()
  // 数字类输入框聚焦后全选，便于直接覆盖录入
  try {
    next.select?.()
  } catch {
    // select() 对部分 input 无效，忽略
  }
}

const printDialogRef = ref<InstanceType<typeof SalesOrderProductPrintDialog>>()
const processingPrintDialogRef = ref<InstanceType<typeof SalesOrderProductProcessingPrintDialog>>()
const shippingDialogRef = ref<InstanceType<typeof SalesOrderProductShippingDialog>>()
/** 新增收款弹窗 */
const collectionDialogRef = ref<InstanceType<typeof CollectionDialog>>()

/** 订单已保存后禁止切换客户（避免授权价、收款等关联数据错乱） */
const isCustomerLocked = computed(() => !!formData.value.id)


// ======================== 客户搜索弹窗 ========================
const customerSearchDialogRef = ref<InstanceType<typeof CustomerSearchDialog>>()

/** 将客户详情转为打印弹窗所需的简要结构 */
const toCustomerSimpleVO = (customer: Customer): CustomerSimpleVO => ({
  id: customer.id,
  shortName: customer.shortName ?? '',
  name: customer.name ?? '',
  mobile: customer.mobile,
  brandId: customer.brandId,
  logisticId: customer.logisticId,
  contactName: customer.contactName ?? '',
  deliveryAddress: customer.deliveryAddress,
  balance: customer.balance
})

/** 回车或点击搜索图标：打开客户搜索弹窗 */
const handleOpenCustomerSearch = () => {
  if (isCustomerLocked.value) return
  customerSearchDialogRef.value?.open(customerInput.value)
}

/** 清空客户输入时同步清除已选客户 */
const handleClearCustomer = () => {
  if (isCustomerLocked.value) return
  formData.value.customerId = undefined
  selectedCustomerInfo.value = null
  selectedCustomerBalance.value = null
}

/** 编辑时根据 customerId 回填输入框与余额（不再依赖 simple-list） */
const syncCustomerDisplay = async (customerId: number) => {
  try {
    const customer = await CustomerApi.getCustomer(customerId)
    customerInput.value = customer.name ?? ''
    selectedCustomerInfo.value = toCustomerSimpleVO(customer)
    selectedCustomerBalance.value = customer.balance
  } catch {
    customerInput.value = ''
    selectedCustomerInfo.value = null
    selectedCustomerBalance.value = null
  }
}

/** 查询单条面料行的客户版本规格授权价，成功时覆盖单价 */
const fetchBatchAuthorizedPrice = async (
  batch: BatchRow,
  customerId: number,
  spec?: string
): Promise<void> => {
  const targetSpec = spec ?? batch.spec
  if (!batch.productId || !targetSpec) return
  try {
    const priceInfo = await CustomerVersionSpcPriceApi.getByProductAndCustomerAndSpec({
      productId: batch.productId,
      customerId,
      spec: targetSpec
    })
    if (priceInfo?.authorizedPrice != null) batch.price = priceInfo.authorizedPrice
  } catch {
    // 无授权价配置时保持原单价
  }
}

/** 批量刷新面料列表授权价（选择客户后调用） */
const updateBatchAuthorizedPrices = async (customerId: number) => {
  const batchs = formData.value.batchs
  if (!batchs.length) return
  await Promise.all(batchs.map((batch) => fetchBatchAuthorizedPrice(batch, customerId)))
}

/** 将客户信息回填到表单，并更新已选面料授权价 */
const applyCustomerToForm = async (customer: Customer) => {
  formData.value.customerId = customer.id
  formData.value.mobile = customer.mobile
  formData.value.brandId = customer.brandId ?? getDefaultBrandId()
  formData.value.logisticId = customer.logisticId
  formData.value.logisticName = props.logisticsList.find((item) => item.id === customer.logisticId)?.name ?? ''
  formData.value.receiver = customer.contactName
  formData.value.deliveryAddress = customer.deliveryAddress
  selectedCustomerBalance.value = customer.balance
  await updateBatchAuthorizedPrices(customer.id)
}

/** 客户搜索弹窗选中回调：直接使用接口返回的完整数据填充表单 */
const handleSelectCustomerFromSearch = async (customer: Customer) => {
  customerInput.value = customer.name ?? ''
  selectedCustomerInfo.value = toCustomerSimpleVO(customer)
  await applyCustomerToForm(customer)
}

/** 物流自动完成：按名称过滤已有物流公司 */
const fetchLogisticSuggestions = (queryString: string, cb: (results: LogisticsSimpleVO[]) => void) => {
  const keyword = queryString.trim().toLowerCase()
  const list = keyword
    ? props.logisticsList.filter((item) => item.name.toLowerCase().includes(keyword))
    : props.logisticsList
  cb(list)
}

/** 从下拉选中物流：同时回填 ID 与名称 */
const handleLogisticSelect = (item: LogisticsSimpleVO) => {
  formData.value.logisticName = item.name
  formData.value.logisticId = item.id
}

/** 失焦时按名称精确匹配物流 ID；未匹配则清空 logisticId，仅保留手输名称 */
const syncLogisticIdByName = () => {
  const name = formData.value.logisticName?.trim()
  if (!name) {
    formData.value.logisticName = undefined
    formData.value.logisticId = undefined
    return
  }
  formData.value.logisticName = name
  formData.value.logisticId = props.logisticsList.find((item) => item.name === name)?.id
}

/** 提交前解析物流：名称精确匹配列表则带 ID，否则仅传 logisticName */
const resolveLogisticForSubmit = (logisticName?: string) => {
  const name = logisticName?.trim()
  if (!name) {
    return { logisticId: undefined, logisticName: undefined }
  }
  const matched = props.logisticsList.find((item) => item.name === name)
  return {
    logisticId: matched?.id,
    logisticName: name
  }
}

// ======================== 批次列表操作 ========================
const removeBatch = (index: number) => {
  if (hasConfirmTime.value) {
    message.warning('订单已确认，不允许删除面料')
    return
  }
  formData.value.batchs.splice(index, 1)
}

/**
 * 批次弹窗确认回调：将选中项批量追加到面料列表
 * 支持两种情形：有批次（batchId 有值）/ 仅选产品（batchId 为 undefined）
 * 若当前有客户，并发查询各产品的授权价并覆盖单价
 */
const handleBatchConfirm = async (rows: BatchConfirmItem[]) => {
  if (hasConfirmTime.value) {
    message.warning('订单已确认，不允许新增面料')
    return
  }
  const customerId = formData.value.customerId
  const newBatchs = await Promise.all(
    rows.map(async (row) => {
      // 仅选产品（无批次）时携带规格列表；若只有一个规格则自动选中
      const specConfs = row.batchId ? undefined : (row.specConfs ?? undefined)
      const spec = !row.batchId && specConfs?.length === 1 ? specConfs[0].spec : row.spec
      const batch: BatchRow = {
        productId: row.productId,
        productName: row.productName,
        spec,
        specConfs,
        batchId: row.batchId,   // 仅选产品时为 undefined
        batchNo: row.batchNo,
        unitValue: row.unitValue,
        price: row.onePrice ?? undefined,
        quantity: undefined,
        amount: undefined,
        note: undefined,
      }
      // 有客户且规格已确定时，查询授权价覆盖默认单价
      if (customerId) await fetchBatchAuthorizedPrice(batch, customerId, spec)
      return batch
    })
  )
  formData.value.batchs.push(...newBatchs)
}

/** 仅选产品时手动切换规格：重新查询授权价 */
const handleBatchSpecChange = async (batch: BatchRow, spec: string) => {
  if (hasConfirmTime.value) return
  const customerId = formData.value.customerId
  if (!customerId) return
  await fetchBatchAuthorizedPrice(batch, customerId, spec)
}

// ======================== 金额自动计算 ========================
const round2 = (val: number) => Math.round(val * 100) / 100

/**
 * 重新计算批次行金额、订单金额及舍入差额：
 * 1. 批次行金额 = 数量 × 单价，保留两位小数
 * 2. 订单金额 = 所有批次行金额之和 + 运费 - 优惠金额，再四舍五入到整数
 * 3. rounding = 四舍五入差额（舍去为负，入位为正）
 */
const recalculateOrderAmounts = (form: typeof formData.value = formData.value) => {
  let batchTotal = 0
  form.batchs.forEach((batch) => {
    batch.amount =
      batch.quantity != null || batch.price != null
        ? round2((batch.quantity ?? 0) * (batch.price ?? 0))
        : undefined
    batchTotal += batch.amount ?? 0
  })
  const rawAmount = round2(batchTotal + (form.freight ?? 0) - (form.discountAmount ?? 0))
  const roundedAmount = Math.round(rawAmount)
  // rounding：舍去小数记负，进位记正；无差额时为 0
  form.rounding = round2(roundedAmount - rawAmount)
  form.amount = roundedAmount as any
  // 明细或运费变化后，重新校验优惠金额是否仍合法
  nextTick(() => formRef.value?.validateField('discountAmount').catch(() => {}))
}

watch(
  () => formData.value,
  (form) => recalculateOrderAmounts(form),
  { deep: true }
)

// ======================== 弹窗控制 ========================

/**
 * 将后端返回的 curtains 三层结构映射为面料批次行列表。
 * 面料单每个 curtain 固定对应 structures[0].materials[0]，需同时保存三层 id
 * 以便整单更新时后端能做 UPDATE/INSERT/DELETE 三路 merge。
 */
const mapCurtainsToBatchRows = (curtains: SalesOrderDetailCurtain[]): BatchRow[] =>
  curtains.map((c) => {
    const s = c.structures?.[0]
    const m = s?.materials?.[0] ?? {}
    return {
      curtainRowId: c.id,      // 窗帘行 ID，更新时必须回传
      structureRowId: s?.id,   // 结构行 ID，更新时必须回传
      id: m.id,                // 用料明细行 ID，更新时必须回传
      productId: m.productId,
      productName: m.productName,
      spec: m.spec,
      batchId: m.batchId,
      batchNo: m.batchNo,
      unitValue: m.unitValue,
      price: m.price,
      quantity: m.quantity,
      amount: m.amount,
      note: m.note,
      classify: (m as any).classify,
    }
  })

/** 打开弹窗；编辑模式下从接口加载数据并回填批次列表 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增面料单' : '编辑面料单'
  formType.value = type
  resetForm()
  // 新建时自动选中默认品牌
  if (type === 'create') {
    formData.value.brandId = getDefaultBrandId()
  }
  if (id) {
    formLoading.value = true
    try {
      const data = await SalesOrderApi.getSalesOrderDetail(id)
      formData.value = {
        ...data,
        batchs: mapCurtainsToBatchRows(data.curtains ?? []),
      } as any
      // 详情仅有 logisticId 时，从物流列表回填展示名称
      if (!formData.value.logisticName && formData.value.logisticId) {
        formData.value.logisticName =
          props.logisticsList.find((item) => item.id === formData.value.logisticId)?.name ?? ''
      }
      if (data?.customerId) {
        await syncCustomerDisplay(data.customerId)
      }
    } finally {
      formLoading.value = false
    }
  }
  await nextTick()
  syncSavedSnapshot()
}
defineExpose({ open })

const resetForm = () => {
  formData.value = getInitFormData()
  customerInput.value = ''
  selectedCustomerInfo.value = null
  selectedCustomerBalance.value = null
  formRef.value?.resetFields()
}

/** 组装面料单提交/脏检查用的 payload（与 fabric 接口字段对齐） */
const buildSubmitPayload = () => {
  const form = formData.value
  const batchTotal = form.batchs.reduce((sum, b) => sum + (b.amount ?? 0), 0)
  const { logisticId, logisticName } = resolveLogisticForSubmit(form.logisticName)
  return {
    id: form.id,
    customerId: form.customerId,
    mobile: form.mobile,
    brandId: form.brandId,
    orderDate: form.orderDate,
    deliveryDate: form.deliveryDate,
    logisticId,
    logisticName,
    receiver: form.receiver,
    deliveryAddress: form.deliveryAddress,
    freight: form.freight,
    discountAmount: form.discountAmount,
    totalAmount: round2(batchTotal + (form.freight ?? 0)),
    amount: form.amount,
    rounding: form.rounding,
    note: form.note,
    curtains: form.batchs.map((b) => ({
      id: b.curtainRowId,
      amount: b.amount,
      note: b.note,
      structures: [{
        id: b.structureRowId,
        materials: [{
          id: b.id,
          productId: b.productId,
          batchId: b.batchId,
          spec: b.spec,
          unitValue: b.unitValue,
          price: b.price,
          quantity: b.quantity,
          amount: b.amount,
          note: b.note
        }]
      }]
    }))
  }
}

/** 上次保存/加载时的表单快照，用于检测是否有未保存修改 */
const savedFormSnapshot = ref('')

const syncSavedSnapshot = () => {
  savedFormSnapshot.value = JSON.stringify(buildSubmitPayload())
}

const isFormDirty = () => savedFormSnapshot.value !== JSON.stringify(buildSubmitPayload())

/** 非保存类操作前校验：有未保存修改则提醒用户先保存 */
const ensureSavedBeforeAction = (): boolean => {
  if (isFormDirty()) {
    message.warning('订单信息已修改，请先保存')
    return false
  }
  return true
}

/** 收款/打印/加急类操作前校验：订单须已确认（存在 confirmTime） */
const ensureOrderConfirmedBeforeAction = (): boolean => {
  if (!hasConfirmTime.value) {
    message.warning('请先确认订单')
    return false
  }
  return true
}

// ======================== 提交 ========================
const handleSave = () => {
  submitForm()
}

const submitForm = async () => {
  syncLogisticIdByName()
  await formRef.value.validate()
  if (!formData.value.batchs || formData.value.batchs.length === 0) {
    message.warning('请至少添加一条面料数据')
    return
  }
  // 新增时校验规格必填；更新时允许规格为空（历史数据兼容）
  if (formType.value === 'create') {
    const emptySpecIndex = formData.value.batchs.findIndex((b) => !b.spec?.trim())
    if (emptySpecIndex !== -1) {
      message.warning(`第 ${emptySpecIndex + 1} 行面料规格不能为空`)
      return
    }
  }
  formLoading.value = true
  try {
    const fabricPayload = buildSubmitPayload()
    if (formType.value === 'create') {
      const { id: _omit, ...createPayload } = fabricPayload
      const newId = await SalesOrderApi.createSalesOrderFabric(createPayload)
      message.success(t('common.createSuccess'))
      // 创建成功后立即拉取详情，回填后端生成的字段（订单号、三层 ID 等），并切换为编辑模式
      const detail = await SalesOrderApi.getSalesOrderDetail(newId)
      formData.value = {
        ...detail,
        batchs: mapCurtainsToBatchRows(detail.curtains ?? []),
      } as any
      formType.value = 'update'
      dialogTitle.value = '编辑面料单'
    } else {
      await SalesOrderApi.updateSalesOrderFabric(fabricPayload)
      message.success(t('common.updateSuccess'))
    }
    emit('success')
    await nextTick()
    syncSavedSnapshot()
  } finally {
    formLoading.value = false
  }
}

// ======================== 确认 / 取消确认 / 加急 ========================
const handleConfirm = async () => {
  if (!ensureSavedBeforeAction()) return
  formLoading.value = true
  try {
    await SalesOrderApi.confirmSalesOrder(formData.value.id!)
    message.success('确认订单成功')
    emit('success')
    await reloadForm(formData.value.id!)
  } finally {
    formLoading.value = false
  }
}

const handleCancelConfirm = async () => {
  if (!ensureSavedBeforeAction()) return
  formLoading.value = true
  try {
    await SalesOrderApi.cancelConfirmSalesOrder(formData.value.id!)
    message.success('取消确认成功')
    emit('success')
    await reloadForm(formData.value.id!)
  } finally {
    formLoading.value = false
  }
}

const handleExpedite = async () => {
  if (!ensureOrderConfirmedBeforeAction()) return
  if (!ensureSavedBeforeAction()) return
  formLoading.value = true
  try {
    await SalesOrderApi.expeditedSalesOrder(formData.value.id!)
    message.success('设置加急成功')
    emit('success')
    await reloadForm(formData.value.id!)
  } finally {
    formLoading.value = false
  }
}

/** 取消订单加急 */
const handleCancelExpedite = async () => {
  if (!ensureOrderConfirmedBeforeAction()) return
  if (!ensureSavedBeforeAction()) return
  formLoading.value = true
  try {
    await SalesOrderApi.cancelExpeditedSalesOrder(formData.value.id!)
    message.success('取消加急成功')
    emit('success')
    await reloadForm(formData.value.id!)
  } finally {
    formLoading.value = false
  }
}

// ======================== 收款 ========================
/** 打开新增收款弹窗，使用当前订单客户（禁用客户搜索） */
const handleOpenCollection = () => {
  if (!formData.value.customerId) {
    message.warning('请先选择客户')
    return
  }
  if (!ensureOrderConfirmedBeforeAction()) return
  if (!ensureSavedBeforeAction()) return
  collectionDialogRef.value?.open(formData.value.customerId)
}

/**
 * 操作成功后重新从后端加载完整表单数据，保持弹窗打开并同步最新状态
 * @param id 面料单 ID
 */
const reloadForm = async (id: number) => {
  formLoading.value = true
  try {
    const detail = await SalesOrderApi.getSalesOrderDetail(id)
    formData.value = {
      ...detail,
      batchs: mapCurtainsToBatchRows(detail.curtains ?? []),
    } as any
    if (detail.customerId) {
      await syncCustomerDisplay(detail.customerId)
    }
  } finally {
    formLoading.value = false
  }
  await nextTick()
  syncSavedSnapshot()
}

/** 收款成功后刷新订单数据并通知列表页 */
const handleCollectionSuccess = async () => {
  if (formData.value.id) {
    await reloadForm(formData.value.id)
  }
  emit('success')
}

// ======================== 打印 ========================
/** 打开面料单销售单打印预览弹窗 */
const handlePrint = () => {
  if (!ensureOrderConfirmedBeforeAction()) return
  if (!ensureSavedBeforeAction()) return
  printDialogRef.value?.open(formData.value as any)
}

/** 打开面料加工单打印预览弹窗 */
const handlePrintProcessing = () => {
  if (!ensureOrderConfirmedBeforeAction()) return
  if (!ensureSavedBeforeAction()) return
  processingPrintDialogRef.value?.open(formData.value as any)
}

/** 打开发货联打印预览弹窗 */
const handlePrintShipping = () => {
  if (!ensureOrderConfirmedBeforeAction()) return
  if (!ensureSavedBeforeAction()) return
  shippingDialogRef.value?.open(formData.value as any)
}
</script>

<style scoped>
/* flex 流式布局中防止 label 因列宽过窄换行；:deep() 穿透 Element Plus 内部 DOM */
:deep(.el-form-item__label) { white-space: nowrap; }
</style>
