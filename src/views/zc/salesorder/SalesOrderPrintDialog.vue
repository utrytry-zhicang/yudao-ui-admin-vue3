<!--
  销售单打印预览弹窗
  父组件通过 open(formData) 方法打开，支持打印、预览区缩放及截图保存为 PNG
-->
<template>
  <el-dialog v-model="visible" width="860px" top="2vh" :close-on-click-modal="false">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span class="text-base font-semibold">销售单预览</span>
        <div class="flex items-center gap-16px mr-24px">
          <!-- 隐藏价格开关：启用后单价、金额、余额等敏感信息不展示 -->
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
            fontSize: '14px',
            color: '#1a1a1a',
            fontFamily: `'Microsoft YaHei', '微软雅黑', Arial, sans-serif`
          }"
        >
        <!-- 标题区：居中显示 -->
        <div style="text-align: center; font-size: 25px; font-weight: bold; letter-spacing: 6px; line-height: 1.2; margin-bottom: 8px;">
          {{ brandName ? brandName + ' ' : '' }}成品销售单
        </div>

        <!-- 订单头信息：流式排列，无固定列宽 -->
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

        <!-- 窗帘明细列表 -->
        <div
          v-for="(curtain, idx) in formData?.curtains"
          :key="idx"
          style="margin-bottom: 16px;"
        >
          <!-- 窗帘标题行 -->
          <div
            style="
              background: #EFF6FF;
              border: 1px solid #000;
              padding: 8px 12px;
              font-weight: 600;
              font-size: 14px;
              line-height: 1.6;
            "
          >
            <span style="color: #1D4ED8;">窗帘 #{{ idx + 1 }}</span>
            &nbsp;|&nbsp;
            <span style="font-weight: 400;">款式：</span>{{ getCurtainName(curtain.curtainId) || (curtain as any).curtainName || '-' }}
            &nbsp;|&nbsp;
            <span style="font-weight: 400;">房间：</span>{{ curtain.room || '-' }}
            <template v-if="curtain.pleatRatioValue">
              &nbsp;|&nbsp;<span style="font-weight: 400;">褶倍：</span>{{ curtain.pleatRatioValue }}
            </template>
            <template v-if="curtain.pleatsDistance">
              &nbsp;|&nbsp;<span style="font-weight: 400;">褶距：</span>{{ curtain.pleatsDistance }}
            </template>
            <template v-if="curtain.mountings?.length">
              &nbsp;|&nbsp;<span style="font-weight: 400;">配件：</span>{{ Array.isArray(curtain.mountings) ? curtain.mountings.join('、') : curtain.mountings }}
            </template>
            <span style="float: right; color: #DC2626; font-size: 15px;">
              金额：{{ formatMoney(curtain.amount) }}
            </span>
          </div>

          <!-- 窗帘备注 -->
          <div v-if="curtain.note" style="padding: 4px 12px; font-size: 13px; color: #4B5563; border: 1px solid #000; border-top: none;">
            备注：{{ curtain.note }}
          </div>

          <!-- 结构和用料 -->
          <div
            v-for="(structure, sIdx) in curtain.structures"
            :key="sIdx"
            style="margin-left: 16px; margin-top: 6px;"
          >
            <!-- 结构描述行 -->
            <div style="background: #F9FAFB; border: 1px solid #000; padding: 5px 10px; font-size: 13px; color: #374151;">
              <b>结构 #{{ sIdx + 1 }}：</b>{{ getStructureName(structure.structureId) || (structure as any).structureName || '-' }}
              <template v-if="structure.width != null">　宽：<span style="color: #000; font-weight: bold; font-size: 15px;">{{ structure.width }}</span></template>
              <template v-if="structure.height != null">　高：<span style="color: #000; font-weight: bold; font-size: 15px;">{{ structure.height }}</span></template>
              <template v-if="structure.leftCorner">　左转角：{{ structure.leftCorner }}</template>
              <template v-if="structure.rightCorner">　右转角：{{ structure.rightCorner }}</template>
              <template v-if="structure.pasteDirection">　粘贴方向：{{ getDictLabel(DICT_TYPE.ZC_PASTE_DIRECTION, structure.pasteDirection) }}</template>
              <template v-if="structure.openMethod">　打开方式：{{ getDictLabel(DICT_TYPE.ZC_OPEN_METHOD, structure.openMethod) }}</template>
              <template v-if="structure.processType">　加工类型：{{ getDictLabel(DICT_TYPE.ZC_PROCESS_TYPE, structure.processType) }}</template>
              <template v-if="structure.pleatsNum != null">　总褶数：{{ structure.pleatsNum }}</template>
              <template v-if="structure.pleatsDistance != null">　褶距：{{ structure.pleatsDistance }}</template>
              <template v-if="structure.skirtHeight != null">　裙摆高度：{{ structure.skirtHeight }}</template>
              <template v-if="(structure as any).installProcessName">
                　安装工艺：{{ (structure as any).installProcessName }}
              </template>
              <template v-if="structure.note">　备注：{{ structure.note }}</template>
            </div>

            <!-- 用料表格 -->
            <table
              v-if="(structure as any).materials?.length"
              style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 2px;"
            >
              <thead>
                <tr style="background: #F3F4F6;">
                  <th style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-weight: 600;">组件类型</th>
                  <th style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-weight: 600;">货号</th>
                  <th style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-weight: 600;">批次</th>
                  <th style="border: 1px solid #000; padding: 4px 6px; text-align: right; font-weight: 600;">用料</th>
                  <th style="border: 1px solid #000; padding: 4px 6px; text-align: right; font-weight: 600;">单价</th>
                  <th style="border: 1px solid #000; padding: 4px 6px; text-align: right; font-weight: 600;">小计</th>
                  <th style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-weight: 600;">备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(material, mIdx) in (structure as any).materials" :key="mIdx">
                  <td style="border: 1px solid #000; padding: 4px 6px;">{{ getElementName(material.elementId) || material.elementName || '-' }}</td>
                  <td style="border: 1px solid #000; padding: 4px 6px;">{{ material.productName || '-' }}</td>
                  <td style="border: 1px solid #000; padding: 4px 6px;">{{ material.batchNo || '-' }}</td>
                  <td style="border: 1px solid #000; padding: 4px 6px; text-align: right; font-weight: bold;">{{ formatMaterialQuantity(material) }}</td>
                  <td style="border: 1px solid #000; padding: 4px 6px; text-align: right;">{{ formatMoney(material.price) }}</td>
                  <td style="border: 1px solid #000; padding: 4px 6px; text-align: right; font-weight: 600;">{{ formatMoney(material.amount) }}</td>
                  <td style="border: 1px solid #000; padding: 4px 6px;">{{ material.note || '' }}</td>
                </tr>
              </tbody>
            </table>

            <!-- 无用料时提示 -->
            <div
              v-if="!(structure as any).materials?.length"
              style="padding: 4px 10px; font-size: 12px; color: #9CA3AF; border: 1px solid #000; border-top: none;"
            >
              （无用料）
            </div>
          </div>
        </div>

        <!-- 金额汇总 -->
        <div style="border-top: 1px solid #000; margin-top: 20px; padding-top: 12px;">
          <div style="display: flex; justify-content: flex-end; gap: 32px; font-size: 14px; align-items: center; flex-wrap: wrap;">
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
            <div style="font-size: 17px; font-weight: bold;">
              合计：<span style="color: #DC2626;">{{ formatMoney(formData?.amount ?? 0) }}</span>
            </div>
            <div v-if="balanceLog && !hidePrices"><b>账户余额：</b>{{ formatBalance(balanceLog.balanceAfter) }}</div>
          </div>
        </div>

        <!-- 底部：左侧品牌联系信息，右侧签字栏 -->
        <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; font-size: 14px; color: #555;">
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
        <div style="margin-top: 20px; font-size: 13px; color: #555; border-top: 1px solid #000; padding-top: 10px;">
          尊敬的客户：销售单确认后，布料一经裁剪后一概不予退换。
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
import type { CurtainSimpleVO } from '@/api/zc/curtain'
import type { CurtainStructureSimpleVO } from '@/api/zc/curtainstructure'
import type { CurtainStructureElementSimpleVO } from '@/api/zc/curtainstructureelement'
import type { SalesOrder, SalesOrderCurtain, SalesOrderStructure, ZCSalesOrderMaterial } from '@/api/zc/salesorder'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import {
  MAX_PREVIEW_SCALE,
  MIN_PREVIEW_SCALE,
  usePrintPreviewTools
} from '@/hooks/web/usePrintPreviewTools'

/** 销售单打印预览弹窗 */
defineOptions({ name: 'SalesOrderPrintDialog' })

// ======================== 类型定义 ========================
type StructureWithMaterials = SalesOrderStructure & { materials: ZCSalesOrderMaterial[] }
type CurtainWithStructures = SalesOrderCurtain & { structures: StructureWithMaterials[] }
type FormDataType = SalesOrder & { curtains: CurtainWithStructures[] }

// ======================== Props ========================
const props = defineProps<{
  customersList: CustomerSimpleVO[]
  brandsList: BrandSimpleVO[]
  logisticsList: LogisticsSimpleVO[]
  curtainList: CurtainSimpleVO[]
  curtainStructureList: CurtainStructureSimpleVO[]
  elementList: CurtainStructureElementSimpleVO[]
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
} = usePrintPreviewTools(() => `${formData.value?.orderNo || '销售单'}-销售单`)

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

/** 物流显示名：优先使用表单中的 logisticName，兼容仅含 logisticId 的旧数据 */
const logisticName = computed(() => {
  if (formData.value?.logisticName) return formData.value.logisticName
  if (!formData.value?.logisticId) return '-'
  return props.logisticsList.find((item) => item.id === formData.value!.logisticId)?.name || '-'
})

/** 合计用料：汇总所有 elementIsCalMaterial === true（需计算用料）的用料 quantity，取第一条记录的单位展示 */
const totalClothQuantity = computed(() => {
  let total = 0
  let unit = ''
  for (const curtain of formData.value?.curtains || []) {
    for (const structure of (curtain as any).structures || []) {
      for (const material of (structure as any).materials || []) {
        if (material.elementIsCalMaterial === true && material.quantity != null) {
          total += Number(material.quantity) || 0
          if (!unit && material.unitValue) {
            unit = getDictLabel(DICT_TYPE.ZC_PRODUCT_UNIT, material.unitValue) || material.unitValue
          }
        }
      }
    }
  }
  // JS 浮点累加会产生 13.7999... 这类误差，统一保留两位小数
  return { total: Math.round(total * 100) / 100, unit }
})

// ======================== 查找辅助函数 ========================
const getCurtainName = (id?: number): string => {
  if (!id) return ''
  return props.curtainList.find((item) => item.id === id)?.name || ''
}

const getStructureName = (id?: number): string => {
  if (!id) return ''
  return props.curtainStructureList.find((item) => item.id === id)?.name || ''
}

const getElementName = (id?: number): string => {
  if (!id) return ''
  return props.elementList.find((item) => item.id === id)?.name || ''
}

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

/** 用料数量展示：数值后接计量单位 */
const formatMaterialQuantity = (material: { quantity?: number; unitValue?: string }) => {
  if (material.quantity == null) return '-'
  const unit = material.unitValue
    ? getDictLabel(DICT_TYPE.ZC_PRODUCT_UNIT, material.unitValue) || material.unitValue
    : ''
  return `${material.quantity}${unit}`
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
 * 在新窗口生成干净的销售单 HTML 并自动触发打印对话框。
 * 打印对话框内可选择实体打印机或"另存为 PDF"（等同截图）。
 */
const handlePrint = () => {
  if (!formData.value) return

  printTime.value = formatDate(new Date())
  const fd = formData.value
  const cName = customerName.value
  const bName = brandName.value
  const lName = logisticName.value

  const thS = 'border:1px solid #000;padding:4px 6px;font-weight:600;'
  const dimValS = 'color:#000;font-weight:bold;font-size:15px;'
  const tdS = 'border:1px solid #000;padding:4px 6px;'
  /** 价格掩码辅助：隐藏价格模式下返回 *** */
  const mp = (val: any) => formatMoney(val)

  // ---- 构建窗帘明细 HTML ----
  const curtainsHtml = (fd.curtains || []).map((curtain, idx) => {
    const ctnName = getCurtainName(curtain.curtainId) || (curtain as any).curtainName || '-'
    const mountingsStr = Array.isArray(curtain.mountings)
      ? curtain.mountings.join('、')
      : curtain.mountings || ''

    const structuresHtml = ((curtain as any).structures || []).map((structure: any, sIdx: number) => {
      const strName = getStructureName(structure.structureId) || structure.structureName || '-'
      const attrs = [
        structure.width != null ? `宽：<span style="${dimValS}">${structure.width}</span>` : '',
        structure.height != null ? `高：<span style="${dimValS}">${structure.height}</span>` : '',
        structure.leftCorner ? `左转角：${structure.leftCorner}` : '',
        structure.rightCorner ? `右转角：${structure.rightCorner}` : '',
        structure.pasteDirection ? `粘贴方向：${getDictLabel(DICT_TYPE.ZC_PASTE_DIRECTION, structure.pasteDirection)}` : '',
        structure.openMethod ? `打开方式：${getDictLabel(DICT_TYPE.ZC_OPEN_METHOD, structure.openMethod)}` : '',
        structure.processType ? `加工类型：${getDictLabel(DICT_TYPE.ZC_PROCESS_TYPE, structure.processType)}` : '',
        structure.pleatsNum != null ? `总褶数：${structure.pleatsNum}` : '',
        structure.pleatsDistance != null ? `褶距：${structure.pleatsDistance}` : '',
        structure.skirtHeight != null ? `裙摆高度：${structure.skirtHeight}` : '',
        structure.installProcessName ? `安装工艺：${structure.installProcessName}` : '',
        structure.note ? `备注：${structure.note}` : ''
      ].filter(Boolean).join('　')

      const mats: any[] = structure.materials || []
      const materialsHtml = mats.length
        ? `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:2px;">
            <thead>
              <tr style="background:#F3F4F6;">
                <th style="${thS}text-align:left;">组件类型</th>
                <th style="${thS}text-align:left;">货号</th>
                <th style="${thS}text-align:left;">批次</th>
                <th style="${thS}text-align:right;">用料</th>
                <th style="${thS}text-align:right;">单价</th>
                <th style="${thS}text-align:right;">小计</th>
                <th style="${thS}text-align:left;">备注</th>
              </tr>
            </thead>
            <tbody>
              ${mats.map((m) => `
                <tr>
                  <td style="${tdS}">${getElementName(m.elementId) || m.elementName || '-'}</td>
                  <td style="${tdS}">${m.productName || '-'}</td>
                  <td style="${tdS}">${m.batchNo || '-'}</td>
                  <td style="${tdS}text-align:right;font-weight:bold;">${formatMaterialQuantity(m)}</td>
                  <td style="${tdS}text-align:right;">${mp(m.price)}</td>
                  <td style="${tdS}text-align:right;font-weight:600;">${mp(m.amount)}</td>
                  <td style="${tdS}">${m.note || ''}</td>
                </tr>`).join('')}
            </tbody>
          </table>`
        : `<div style="padding:4px 10px;font-size:12px;color:#9CA3AF;border:1px solid #000;border-top:none;">（无用料）</div>`

      return `
        <div style="margin-left:16px;margin-top:6px;">
          <div style="background:#F9FAFB;border:1px solid #000;padding:5px 10px;font-size:13px;color:#374151;">
            <b>结构 #${sIdx + 1}：</b>${strName}${attrs ? '　' + attrs : ''}
          </div>
          ${materialsHtml}
        </div>`
    }).join('')

    const noteRow = curtain.note
      ? `<div style="padding:4px 12px;font-size:13px;color:#4B5563;border:1px solid #000;border-top:none;">备注：${curtain.note}</div>`
      : ''

    return `
      <div style="margin-bottom:16px;">
        <div style="background:#EFF6FF;border:1px solid #000;padding:8px 12px;font-weight:600;font-size:14px;line-height:1.6;">
          <span style="color:#1D4ED8;">窗帘 #${idx + 1}</span>
          &nbsp;|&nbsp;<span style="font-weight:400;">款式：</span>${ctnName}
          &nbsp;|&nbsp;<span style="font-weight:400;">房间：</span>${curtain.room || '-'}
          ${curtain.pleatRatioValue != null ? `&nbsp;|&nbsp;<span style="font-weight:400;">褶倍：</span>${curtain.pleatRatioValue}` : ''}
          ${mountingsStr ? `&nbsp;|&nbsp;<span style="font-weight:400;">配件：</span>${mountingsStr}` : ''}
          <span style="float:right;color:#DC2626;font-size:15px;">金额：${formatMoney(curtain.amount)}</span>
        </div>
        ${noteRow}
        ${structuresHtml}
      </div>`
  }).join('')

  // ---- 金额汇总 ----
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
      <div style="display:flex;justify-content:flex-end;gap:32px;font-size:14px;align-items:center;flex-wrap:wrap;">
        ${balanceBeforeHtml}
        ${fd.freight ? `<div><b>运费：</b>${formatMoney(fd.freight)}</div>` : ''}
        <div><b>本单总金额：</b>${formatTotalAmount(fd.totalAmount)}</div>
        ${totalClothHtml}
        ${fd.discountAmount ? `<div><b>优惠金额：</b><span style="color:#16A34A;">${hidePrices.value ? '***' : `-¥${fd.discountAmount}`}</span></div>` : ''}
        <div style="font-size:17px;font-weight:bold;">合计：<span style="color:#DC2626;">${formatMoney(fd.amount ?? 0)}</span></div>
        ${balanceAfterHtml}
      </div>
    </div>`

  // ---- 组装完整 HTML ----
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${bName ? bName + ' ' : ''}销售单 - ${fd.orderNo || ''}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif; }
    body { margin: 0; padding: 20px; color: #1a1a1a; font-size: 14px; }
    b { font-weight: 600; }
  </style>
</head>
<body>
  <!-- 标题居中 -->
  <div style="text-align:center;font-size:25px;font-weight:bold;letter-spacing:6px;line-height:1.2;margin-bottom:8px;">
    ${bName ? bName + '&nbsp;' : ''}销售单
  </div>

  <!-- 订单头信息：流式排列，无固定列宽 -->
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

  ${curtainsHtml}
  ${summaryHtml}

  <div style="margin-top:40px;display:flex;justify-content:space-between;align-items:flex-start;gap:24px;font-size:14px;color:#555;">
    <div style="flex:1;line-height:1.8;">
      <div><b>电话：</b>${brandDetail.value?.mobile || '-'}</div>
      <div><b>地址：</b>${brandDetail.value?.address || '-'}</div>
    </div>
    <div style="flex-shrink:0;line-height:2.2;min-width:180px;">
      <div>制单人：${(fd as any).creatorName || '________________'}</div>
      <div>客户签字：________________</div>
      <div>打印时间：${printTime.value}</div>
    </div>
  </div>

  <div style="margin-top:20px;font-size:13px;color:#555;border-top:1px solid #000;padding-top:10px;">
    尊敬的客户：销售单确认后，布料一经裁剪后一概不予退换。
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
