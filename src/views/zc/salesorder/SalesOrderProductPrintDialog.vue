<!--
  面料单打印预览弹窗
  父组件通过 open(formData) 方法打开，支持打印、预览区缩放及截图保存为 PNG
-->
<template>
  <el-dialog v-model="visible" width="860px" top="2vh" :close-on-click-modal="false">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span class="text-base font-semibold">面料单预览</span>
        <div class="flex items-center gap-16px mr-24px">
          <!-- 隐藏价格开关：启用后单价和金额全部显示为 *** -->
          <el-checkbox v-model="hidePrices" border size="small" style="color: #DC2626;">隐藏价格</el-checkbox>
          <el-tooltip content="打印 / 选择打印机 / 另存为PDF" placement="top">
            <el-button type="primary" @click="handlePrint">
              <Icon icon="ep:printer" class="mr-4px" />打印
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </template>

    <!-- 预览区，模拟 A4 纸张效果 -->
    <div style="background: #e8e8e8; padding: 20px; max-height: 78vh; overflow-y: auto;">
      <!-- 预览缩放与截图工具栏 -->
      <div class="flex items-center justify-center gap-8px mb-12px">
        <el-button-group>
          <el-tooltip content="缩小" placement="top">
            <el-button size="small" :disabled="previewScale <= MIN_PREVIEW_SCALE" @click="zoomOut">
              <Icon icon="ep:zoom-out" />
            </el-button>
          </el-tooltip>
          <el-button size="small" disabled style="min-width: 64px;">{{ previewScalePercent }}%</el-button>
          <el-tooltip content="放大" placement="top">
            <el-button size="small" :disabled="previewScale >= MAX_PREVIEW_SCALE" @click="zoomIn">
              <Icon icon="ep:zoom-in" />
            </el-button>
          </el-tooltip>
        </el-button-group>
        <el-tooltip content="截图并复制到剪贴板" placement="top">
          <el-button size="small" :loading="screenshotLoading" @click="handleScreenshot">
            <Icon icon="ep:camera" class="mr-4px" />截图
          </el-button>
        </el-tooltip>
        <el-tooltip content="下载为 PNG 图片" placement="top">
          <el-button size="small" :loading="downloadLoading" @click="handleDownload">
            <Icon icon="ep:download" class="mr-4px" />下载
          </el-button>
        </el-tooltip>
      </div>
      <div class="flex justify-center">
        <div
          ref="previewPaperRef"
          :style="{
            transform: `scale(${previewScale})`,
            transformOrigin: 'top center',
            background: 'white',
            maxWidth: '780px',
            width: '100%',
            padding: '32px 36px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            fontSize: '13px',
            color: '#1a1a1a',
            fontFamily: `'Microsoft YaHei', '微软雅黑', Arial, sans-serif`
          }"
        >
        <!-- 标题区：居中显示 -->
        <div style="text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 6px; line-height: 1.2; margin-bottom: 8px;">
          {{ brandName ? brandName + ' ' : '' }}面料单销售单
        </div>

        <!-- 订单头信息：流式排列，无固定列宽（与成品销售单一致） -->
        <div style="line-height: 1.4; margin-bottom: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span>
              <b>客户：</b>{{ customerName }}
              <b>电话：</b>{{ formData?.mobile || '-' }}
            </span>
            <span style="flex-shrink: 0; margin-left: 12px;"><b>下单日期：</b>{{ formData?.orderDate || '-' }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span><b>地址：</b>{{ formData?.deliveryAddress || '-' }}</span>
            <span style="flex-shrink: 0; margin-left: 12px;"><b>交付日期：</b>{{ formData?.deliveryDate || '-' }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span>
              <b>物流：</b>{{ logisticName }}
            </span>
            <span><b>订单号：</b>{{ formData?.orderNo || '-' }}</span>
          </div>
          <div style="color: #DC2626; font-weight: bold;">
            <b>备注：</b>{{ formData?.note || '-' }}
          </div>
        </div>

        <!-- 分隔线 -->
        <div style="border-top: 1px solid #000; margin: 6px 0 8px;"></div>

        <!-- 面料批次明细表格 -->
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #F3F4F6;">
              <th style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-weight: 600;">货号</th>
              <th style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-weight: 600;">批次</th>
              <th style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-weight: 600;">规格</th>
              <th style="border: 1px solid #000; padding: 4px 6px; text-align: right; font-weight: 600;">用料</th>
              <th style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: 600;">单位</th>
              <th style="border: 1px solid #000; padding: 4px 6px; text-align: right; font-weight: 600;">单价</th>
              <th style="border: 1px solid #000; padding: 4px 6px; text-align: right; font-weight: 600;">金额</th>
              <th style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-weight: 600;">备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(batch, idx) in formData?.batchs" :key="idx">
              <td style="border: 1px solid #000; padding: 4px 6px;">{{ batch.productName || '-' }}</td>
              <td style="border: 1px solid #000; padding: 4px 6px;">{{ batch.batchNo || '-' }}</td>
              <td style="border: 1px solid #000; padding: 4px 6px;">{{ batch.spec || '-' }}</td>
              <td style="border: 1px solid #000; padding: 4px 6px; text-align: right; font-weight: bold;">{{ batch.quantity ?? '-' }}</td>
              <td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">{{ formatUnit(batch.unitValue) }}</td>
              <td style="border: 1px solid #000; padding: 4px 6px; text-align: right;">{{ formatMoney(batch.price) }}</td>
              <td style="border: 1px solid #000; padding: 4px 6px; text-align: right; font-weight: 600;">{{ formatMoney(batch.amount) }}</td>
              <td style="border: 1px solid #000; padding: 4px 6px;">{{ batch.note || '' }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 金额汇总 -->
        <div style="border-top: 1px solid #000; margin-top: 20px; padding-top: 12px;">
          <div style="display: flex; justify-content: flex-end; gap: 32px; font-size: 13px; align-items: center; flex-wrap: wrap;">
            <div v-if="balanceLog && !hidePrices"><b>上期余额：</b>{{ formatBalance(balanceLog.balanceBefore) }}</div>
            <div v-if="formData?.freight">
              <b>运费：</b>{{ formatMoney(formData.freight) }}
            </div>
            <div><b>本单总金额：</b>{{ formatTotalAmount(formData?.totalAmount) }}</div>
            <div v-if="totalClothQuantity.total">
              <b>合计用料：</b>{{ totalClothQuantity.total }}{{ totalClothQuantity.unit }}
            </div>
            <div v-if="formData?.discountAmount">
              <b>优惠金额：</b>
              <span style="color: #16A34A;">{{ hidePrices ? '***' : `-¥${formData.discountAmount}` }}</span>
            </div>
            <div style="font-size: 16px; font-weight: bold;">
              合计：<span style="color: #DC2626;">{{ formatMoney(formData?.amount ?? 0) }}</span>
            </div>
            <div v-if="balanceLog && !hidePrices"><b>账户余额：</b>{{ formatBalance(balanceLog.balanceAfter) }}</div>
          </div>
        </div>

        <!-- 底部：左侧品牌联系信息，右侧签字栏（与成品销售单一致） -->
        <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; font-size: 13px; color: #555;">
          <div style="flex: 1; line-height: 1.8;">
            <div><b>电话：</b>{{ brandDetail?.mobile || '-' }}</div>
            <div><b>地址：</b>{{ brandDetail?.address || '-' }}</div>
          </div>
          <div style="flex-shrink: 0; line-height: 2.2; min-width: 180px;">
            <div>制单人：{{ (formData as any)?.creatorName || '________________' }}</div>
            <div>客户签字：________________</div>
            <div>打印时间：{{ printTime }}</div>
          </div>
        </div>

        <!-- 底部提示语 -->
        <div style="margin-top: 20px; font-size: 12px; color: #555; border-top: 1px solid #000; padding-top: 10px;">
          尊敬的客户：面料单确认后，布料一经裁剪后一概不予退换。
        </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import type { CustomerSimpleVO, ZcCustomerBalanceLogRespVO } from '@/api/zc/customer'
import { CustomerApi } from '@/api/zc/customer'
import type { BrandSimpleVO, Brand } from '@/api/zc/brand'
import { BrandApi } from '@/api/zc/brand'
import type { LogisticsSimpleVO } from '@/api/zc/logistics'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import {
  MAX_PREVIEW_SCALE,
  MIN_PREVIEW_SCALE,
  usePrintPreviewTools
} from '@/hooks/web/usePrintPreviewTools'

/** 面料单打印预览弹窗 */
defineOptions({ name: 'SalesOrderProductPrintDialog' })

// ======================== 类型定义 ========================
interface BatchRow {
  productName?: string
  spec?: string
  batchNo?: string
  unitValue?: string
  quantity?: number
  price?: number
  amount?: number
  note?: string
}

interface FormDataType {
  id?: number
  orderNo?: string
  customerId?: number
  brandId?: number
  logisticId?: number
  mobile?: string
  orderDate?: string
  deliveryDate?: string
  deliveryAddress?: string
  freight?: number
  discountAmount?: number
  totalAmount?: number
  amount?: any
  note?: string
  creatorName?: string
  batchs: BatchRow[]
}

// ======================== Props ========================
const props = defineProps<{
  customersList: CustomerSimpleVO[]
  brandsList: BrandSimpleVO[]
  logisticsList: LogisticsSimpleVO[]
}>()

// ======================== 响应式状态 ========================
const visible = ref(false)
const formData = ref<FormDataType | null>(null)
/** 隐藏价格模式：开启后单价和金额显示为 ***，余额行不展示 */
const hidePrices = ref(false)
/** 品牌详情（底部展示电话、地址） */
const brandDetail = ref<Brand | null>(null)
/** 打印时间（预览展示，实际打印时刷新） */
const printTime = ref('')
/** 订单确认扣减的最新客户余额流水 */
const balanceLog = ref<ZcCustomerBalanceLogRespVO | null>(null)

// ======================== 预览缩放与截图 ========================
const {
  previewPaperRef,
  previewScale,
  previewScalePercent,
  screenshotLoading,
  downloadLoading,
  zoomIn,
  zoomOut,
  resetPreviewScale,
  handleScreenshot,
  handleDownload
} = usePrintPreviewTools(() => `${formData.value?.orderNo || '面料单'}-面料单`)

// ======================== 计算属性 ========================
/** 客户显示名 */
const customerName = computed(() => {
  if (!formData.value?.customerId) return '-'
  const c = props.customersList.find((item) => item.id === formData.value!.customerId)
  return c ? `${c.shortName}/${c.contactName}` : '-'
})

/** 品牌显示名（用于标题） */
const brandName = computed(() => {
  if (!formData.value?.brandId) return ''
  return props.brandsList.find((item) => item.id === formData.value!.brandId)?.name || ''
})

/** 物流显示名 */
/** 物流显示名：优先使用表单中的 logisticName，兼容仅含 logisticId 的旧数据 */
const logisticName = computed(() => {
  if (formData.value?.logisticName) return formData.value.logisticName
  if (!formData.value?.logisticId) return '-'
  return props.logisticsList.find((item) => item.id === formData.value!.logisticId)?.name || '-'
})

/** 合计用料：汇总所有批次的 quantity，取第一条记录的单位展示 */
const totalClothQuantity = computed(() => {
  let total = 0
  let unit = ''
  for (const batch of formData.value?.batchs || []) {
    if (batch.quantity != null) {
      total += Number(batch.quantity) || 0
      if (!unit && batch.unitValue) {
        unit = getDictLabel(DICT_TYPE.ZC_PRODUCT_UNIT, batch.unitValue) || batch.unitValue
      }
    }
  }
  // JS 浮点累加会产生 13.7999... 这类误差，统一保留两位小数
  return { total: Math.round(total * 100) / 100, unit }
})

/** 金额展示：隐藏价格模式下返回 ***，否则前缀 ¥ */
const formatMoney = (val?: number | null) => {
  if (hidePrices.value) return '***'
  if (val == null) return '-'
  return `¥${val}`
}

/** 余额展示：隐藏价格模式下不展示余额行 */
const formatBalance = (val?: number | null) => {
  if (val == null) return '-'
  return `¥${val}`
}

/** 本单总金额展示：对 totalAmount 四舍五入到整数 */
const formatTotalAmount = (val?: number | null) => {
  if (hidePrices.value) return '***'
  if (val == null) return '-'
  return `¥${Math.round(val)}`
}

/** 计量单位展示：字典标签优先，无值时显示 - */
const formatUnit = (unitValue?: string) => {
  if (!unitValue) return '-'
  return getDictLabel(DICT_TYPE.ZC_PRODUCT_UNIT, unitValue) || unitValue
}

// ======================== 对外方法 ========================
/** 根据品牌 ID 加载详情，用于底部联系信息展示 */
const loadBrandDetail = async (brandId?: number) => {
  brandDetail.value = null
  if (!brandId) return
  try {
    brandDetail.value = await BrandApi.getBrand(brandId)
  } catch {
    brandDetail.value = null
  }
}

/** 根据客户 ID、订单 ID 加载订单确认扣减的最新余额流水 */
const loadBalanceLog = async (customerId?: number, refId?: number) => {
  balanceLog.value = null
  if (!customerId || !refId) return
  try {
    balanceLog.value = await CustomerApi.getLatestOrderConfirmBalanceLog({ customerId, refId })
  } catch {
    balanceLog.value = null
  }
}

/** 打开预览弹窗，传入当前表单数据 */
const open = async (data: FormDataType) => {
  formData.value = data
  printTime.value = formatDate(new Date())
  resetPreviewScale()
  visible.value = true
  await Promise.all([
    loadBrandDetail(data.brandId),
    loadBalanceLog(data.customerId, data.id)
  ])
}

defineExpose({ open })

// ======================== 打印 ========================
/**
 * 在新窗口生成干净的面料单 HTML 并自动触发打印对话框。
 * 打印对话框内可选择实体打印机或"另存为 PDF"。
 */
const handlePrint = () => {
  if (!formData.value) return

  printTime.value = formatDate(new Date())
  const fd = formData.value
  const cName = customerName.value
  const bName = brandName.value
  const lName = logisticName.value

  const thS = 'border:1px solid #000;padding:4px 6px;font-weight:600;'
  const tdS = 'border:1px solid #000;padding:4px 6px;'

  const batchRowsHtml = (fd.batchs || []).map((b) => `
    <tr>
      <td style="${tdS}">${b.productName || '-'}</td>
      <td style="${tdS}">${b.batchNo || '-'}</td>
      <td style="${tdS}">${b.spec || '-'}</td>
      <td style="${tdS}text-align:right;font-weight:bold;">${b.quantity ?? '-'}</td>
      <td style="${tdS}text-align:center;">${formatUnit(b.unitValue)}</td>
      <td style="${tdS}text-align:right;">${formatMoney(b.price)}</td>
      <td style="${tdS}text-align:right;font-weight:600;">${formatMoney(b.amount)}</td>
      <td style="${tdS}">${b.note || ''}</td>
    </tr>`).join('')

  const balanceBeforeHtml =
    balanceLog.value && !hidePrices.value
      ? `<div><b>上期余额：</b>${formatBalance(balanceLog.value.balanceBefore)}</div>`
      : ''
  const balanceAfterHtml =
    balanceLog.value && !hidePrices.value
      ? `<div><b>账户余额：</b>${formatBalance(balanceLog.value.balanceAfter)}</div>`
      : ''
  const totalClothHtml = totalClothQuantity.value.total
    ? `<div><b>合计用料：</b>${totalClothQuantity.value.total}${totalClothQuantity.value.unit}</div>`
    : ''
  const summaryHtml = `
    <div style="border-top:1px solid #000;margin-top:20px;padding-top:12px;">
      <div style="display:flex;justify-content:flex-end;gap:32px;font-size:13px;align-items:center;flex-wrap:wrap;">
        ${balanceBeforeHtml}
        ${fd.freight ? `<div><b>运费：</b>${formatMoney(fd.freight)}</div>` : ''}
        <div><b>本单总金额：</b>${formatTotalAmount(fd.totalAmount)}</div>
        ${totalClothHtml}
        ${fd.discountAmount ? `<div><b>优惠金额：</b><span style="color:#16A34A;">${hidePrices.value ? '***' : `-¥${fd.discountAmount}`}</span></div>` : ''}
        <div style="font-size:16px;font-weight:bold;">合计：<span style="color:#DC2626;">${formatMoney(fd.amount ?? 0)}</span></div>
        ${balanceAfterHtml}
      </div>
    </div>`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${bName ? bName + ' ' : ''}面料单 - ${fd.orderNo || ''}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif; }
    body { margin: 0; padding: 20px; color: #1a1a1a; font-size: 13px; }
    b { font-weight: 600; }
  </style>
</head>
<body>
  <div style="text-align:center;font-size:24px;font-weight:bold;letter-spacing:6px;line-height:1.2;margin-bottom:8px;">
    ${bName ? bName + '&nbsp;' : ''}面料单销售单
  </div>
  <div style="line-height:1.4;margin-bottom:2px;">
    <div style="display:flex;justify-content:space-between;align-items:baseline;">
      <span><b>客户：</b>${cName} <b>电话：</b>${fd.mobile || '-'}</span>
      <span style="flex-shrink:0;margin-left:12px;"><b>下单日期：</b>${fd.orderDate || '-'}</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;">
      <span><b>地址：</b>${fd.deliveryAddress || '-'}</span>
      <span style="flex-shrink:0;margin-left:12px;"><b>交付日期：</b>${fd.deliveryDate || '-'}</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;">
      <span><b>物流：</b>${lName}</span>
      <span><b>订单号：</b>${fd.orderNo || '-'}</span>
    </div>
    <div style="color: #DC2626; font-weight: bold;"><b>备注：</b>${fd.note || '-'}</div>
  </div>
  <div style="border-top:1px solid #000;margin:6px 0 8px;"></div>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr style="background:#F3F4F6;">
        <th style="${thS}text-align:left;">货号</th>
        <th style="${thS}text-align:left;">批次</th>
        <th style="${thS}text-align:left;">规格</th>
        <th style="${thS}text-align:right;">用料</th>
        <th style="${thS}text-align:center;">单位</th>
        <th style="${thS}text-align:right;">单价</th>
        <th style="${thS}text-align:right;">金额</th>
        <th style="${thS}text-align:left;">备注</th>
      </tr>
    </thead>
    <tbody>${batchRowsHtml}</tbody>
  </table>
  ${summaryHtml}
  <div style="margin-top:40px;display:flex;justify-content:space-between;align-items:flex-start;gap:24px;font-size:13px;color:#555;">
    <div style="flex:1;line-height:1.8;">
      <div><b>电话：</b>${brandDetail.value?.mobile || '-'}</div>
      <div><b>地址：</b>${brandDetail.value?.address || '-'}</div>
    </div>
    <div style="flex-shrink:0;line-height:2.2;min-width:180px;">
      <div>制单人：${fd.creatorName || '________________'}</div>
      <div>客户签字：________________</div>
      <div>打印时间：${printTime.value}</div>
    </div>
  </div>
  <div style="margin-top:20px;font-size:12px;color:#555;border-top:1px solid #000;padding-top:10px;">
    尊敬的客户：面料单确认后，布料一经裁剪后一概不予退换。
  </div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=800')
  if (!win) {
    ElMessage.warning('浏览器阻止了弹窗，请允许弹窗后重试')
    return
  }
  win.document.write(html)
  win.document.close()
  // 部分浏览器需等文档渲染完成才能调用 print
  setTimeout(() => {
    win.focus()
    win.print()
  }, 300)
}
</script>
