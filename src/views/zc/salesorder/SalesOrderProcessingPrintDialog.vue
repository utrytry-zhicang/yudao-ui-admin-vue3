<!--
  加工单打印预览弹窗
  每个窗帘下的每个结构单独生成一页，页面尺寸 宽100mm × 高120mm
  所有页面共用相同的订单抬头，用于生产加工单打印
  父组件通过 open(formData) 方法打开
-->
<template>
  <el-dialog v-model="visible" width="860px" top="2vh" :close-on-click-modal="false">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span class="text-base font-semibold">加工单预览</span>
        <div class="flex gap-8px mr-24px">
          <el-tooltip content="打印 / 选择打印机 / 另存为PDF" placement="top">
            <el-button type="primary" :loading="qrLoading" :disabled="qrLoading" @click="handlePrint">
              <Icon icon="ep:printer" class="mr-4px" />打印
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </template>

    <!-- 预览区：每个结构一页，宽100mm × 高120mm（比例 100:120） -->
    <div
      v-loading="qrLoading"
      element-loading-text="正在加载二维码..."
      style="background: #e8e8e8; padding: 20px; max-height: 78vh; overflow-y: auto;"
    >
      <template v-if="formData?.curtains?.length">
        <template v-for="(curtain, cIdx) in formData.curtains" :key="cIdx">
          <div
            v-for="(structure, sIdx) in curtain.structures"
            :key="sIdx"
            style="
              background: white;
              width: 100mm;
              height: 120mm;
              margin: 0 auto 20px;
              padding: 3px 14px 12px;
              box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 4px #f00, 0 2px 12px rgba(0,0,0,0.2);
              font-size: 17px;
              color: #1a1a1a;
              font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
              overflow: hidden;
              box-sizing: border-box;
            "
          >
            <!-- 抬头：标题单独占第一行，二维码和信息在下方 -->
            <div style="margin-bottom: 3px;">
              <div style="font-size: 18px; letter-spacing: 2px; text-align: center; margin-bottom: 3px; line-height: 1.2;">
                {{ brandName ? brandName + ' ' : '' }}加工单
              </div>
              <div style="display: flex; align-items: flex-start; gap: 10px;">
                <div style="flex: 1; min-width: 0;">
                  <div style="padding: 2px 0; font-size: 13px;">订单号：{{ formData?.orderNo || '-' }}</div>
                  <div style="padding: 2px 0; font-size: 13px;">客户：{{ customerName }}</div>
                  <div style="padding: 2px 0; font-size: 13px;">房间：</div>
                  <div v-if="formData?.note" style="padding: 2px 0; font-size: 13px;">备注：{{ formData.note }}</div>
                </div>
                <div style="width: 123px; flex-shrink: 0; text-align: center;">
                  <template v-if="structureQrCodes[`${cIdx}-${sIdx}`]">
                    <img :src="structureQrCodes[`${cIdx}-${sIdx}`].url" width="108" height="108" style="display: block; margin: 0 auto;" />
                  </template>
                  <div
                    v-else
                    style="width: 108px; height: 108px; border: 1px dashed #bbb; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 13px;"
                  >{{ qrLoading ? '正在加载...' : '二维码' }}</div>
                </div>
              </div>
            </div>

            <!-- 分隔线 -->
            <div style="border-top: 1px solid #ccc; margin: 3px 0 5px;"></div>

            <!-- 结构信息横条：左结构名，中房间，右套数 -->
            <div style="border: 3px solid #1D4ED8; background: #EFF6FF; padding: 4px 8px; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="font-size: 12px; color: #1D4ED8; white-space: nowrap; font-weight: 600;">
                {{ getStructureName(structure.structureId) || (structure as any).structureName || '-' }}
              </span>
              <span style="font-size: 12px; white-space: nowrap; flex: 1; text-align: center;">
                <span style="font-size: 10px; color: #6B7280;">房间：</span>{{ curtain.room || '-' }}
              </span>
              <span style="font-size: 12px; color: #1D4ED8; white-space: nowrap;">
                第{{ cIdx + 1 }}-{{ sIdx + 1 }}套 / 共{{ formData?.curtains?.length || 0 }}套
              </span>
            </div>

            <!-- 结构信息 - 3列表格 -->
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #111827; background: #F9FAFB; color: #374151; margin-bottom: 4px; font-size: 14px;">
              <tbody>
                <tr v-for="(row, rowIdx) in chunkAttrs(structure, 3)" :key="rowIdx">
                  <td v-for="(cell, cellIdx) in row" :key="cellIdx" :colspan="cell.colspan || 1" style="border: 1px solid #4B5563; padding: 4px 6px; width: 33.33%; vertical-align: middle;">
                    <template v-if="cell.labeledValues?.length">
                      <template v-for="(part, pi) in cell.labeledValues" :key="pi">
                        <span v-if="pi > 0"> | </span>
                        <span style="font-size: 10px; color: #6B7280; white-space: nowrap;">{{ part.label }}：</span>
                        <span style="font-size: 14px; font-weight: 500">{{ part.value }}</span>
                      </template>
                    </template>
                    <template v-else>
                      <span
                        v-if="!cell.noLabel"
                        :style="cell.isDim ? 'font-size: 13px; color: #000; white-space: nowrap;' : 'font-size: 10px; color: #6B7280; white-space: nowrap;'"
                      >{{ cell.label }}：</span>
                      <span
                        :style="cell.isDim ? 'font-size: 18px; font-weight: 500; color: #000;' : (cell.smallValue ? 'font-size: 14px; font-weight: 500' : 'font-size: 16px; font-weight: 500')"
                      >{{ cell.value }}</span>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 用料表：仅展示 elementIsPrint !== false 的行 -->
            <table
              v-if="(structure as any).materials?.filter((m: any) => m.elementIsPrint !== false).length"
              style="width: 100%; border-collapse: collapse; font-size: 14px;"
            >
              <thead>
                <tr style="background: #F3F4F6;">
                  <th style="border: 1px solid #4B5563; padding: 3px 5px; text-align: left;">组件类型</th>
                  <th style="border: 1px solid #4B5563; padding: 3px 5px; text-align: left;">货号</th>
                  <th style="border: 1px solid #4B5563; padding: 3px 5px; text-align: left;">规格</th>
                  <th style="border: 1px solid #4B5563; padding: 3px 5px; text-align: right;">用料</th>
                  <th style="border: 1px solid #4B5563; padding: 3px 5px; text-align: left;">备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(material, mIdx) in (structure as any).materials?.filter((m: any) => m.elementIsPrint !== false)" :key="mIdx">
                  <td style="border: 1px solid #4B5563; padding: 3px 5px;">{{ getElementName(material.elementId) || material.elementName || '-' }}</td>
                  <td style="border: 1px solid #4B5563; padding: 3px 5px;">{{ material.productName || '-' }}</td>
                  <td style="border: 1px solid #4B5563; padding: 3px 5px;">{{ material.spec || '-' }}</td>
                  <td style="border: 1px solid #4B5563; padding: 3px 5px; text-align: right; font-weight: 500; font-size: 16px; color: #000;">{{ material.quantity ?? '-' }}</td>
                  <td style="border: 1px solid #4B5563; padding: 3px 5px;">{{ material.note || '' }}</td>
                </tr>
              </tbody>
            </table>
            <div
              v-if="!(structure as any).materials?.filter((m: any) => m.elementIsPrint !== false).length"
              style="padding: 3px 8px; color: #9CA3AF; border: 1px solid #D1D5DB;"
            >
              （无用料）
            </div>
            <!-- 款式备注 + 结构备注放最下方，用 | 分隔 -->
            <div
              v-if="formatCurtainStructureNote(curtain.note, structure.note)"
              style="margin-top: 4px; padding: 3px 8px; font-size: 14px; border: 1px solid #D1D5DB; background: #FFFBEB;"
            >
              <span style="color: #6B7280;">款式备注：</span>{{ formatCurtainStructureNote(curtain.note, structure.note) }}
            </div>
          </div>
        </template>
      </template>

      <!-- 空状态 -->
      <div v-else style="text-align: center; padding: 40px; color: #9CA3AF; background: white; margin: 0 auto; width: 500px;">
        暂无数据
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'
import { BarcodeRegistryApi } from '@/api/zc/barcodeRegistry'
import { getDictLabel, DICT_TYPE } from '@/utils/dict'
import type { CustomerSimpleVO } from '@/api/zc/customer'
import type { BrandSimpleVO } from '@/api/zc/brand'
import type { LogisticsSimpleVO } from '@/api/zc/logistics'
import type { CurtainSimpleVO } from '@/api/zc/curtain'
import type { CurtainStructureSimpleVO } from '@/api/zc/curtainstructure'
import type { CurtainStructureElementSimpleVO } from '@/api/zc/curtainstructureelement'
import type { SalesOrder, SalesOrderCurtain, SalesOrderStructure, ZCSalesOrderMaterial } from '@/api/zc/salesorder'

/** 加工单打印预览弹窗（每个结构单独一页，宽100mm × 高120mm） */
defineOptions({ name: 'SalesOrderProcessingPrintDialog' })

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
const qrLoading = ref(false)
const formData = ref<FormDataType | null>(null)
/** 每个结构的二维码信息，key 为 `${curtainIdx}-${structureIdx}` */
const structureQrCodes = ref<Record<string, { url: string; code: string }>>({})

// ======================== 计算属性 ========================
const customerName = computed(() => {
  if (!formData.value?.customerId) return '-'
  const c = props.customersList.find((item) => item.id === formData.value!.customerId)
  return c ? `${c.shortName}/${c.contactName}` : '-'
})

const brandName = computed(() => {
  if (!formData.value?.brandId) return ''
  return props.brandsList.find((item) => item.id === formData.value!.brandId)?.name || ''
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

/** 合并款式备注与结构备注，用 | 分隔，均无值时返回空字符串 */
const formatCurtainStructureNote = (curtainNote?: string, structureNote?: string): string => {
  return [curtainNote, structureNote].filter(Boolean).join(' | ')
}

type StructureAttr = {
  label: string
  value: string
  colspan?: number
  smallValue?: boolean
  noLabel?: boolean
  /** 同一单元格内多组 label/value，label 小号灰色、value 加粗 */
  labeledValues?: { label: string; value: string }[]
  /** 宽高字段：label 黑色、value 加大加粗 */
  isDim?: boolean
}

/** 将结构的属性字段按固定顺序收集，无值的字段跳过 */
const getStructureAttrs = (structure: any): StructureAttr[] => {
  const attrs: StructureAttr[] = []
  // 宽、高分开展示，使用 isDim 样式（label 黑色、value 加大）
  if (structure.width != null) {
    attrs.push({ label: '宽', value: `${structure.width}m`, isDim: true })
  }
  if (structure.height != null) {
    attrs.push({ label: '高', value: `${structure.height}m`, isDim: true })
  }
  const shapingPart = structure.isShaping === true ? '定型' : ''
  const openMethodPart = structure.openMethod ? (getDictLabel(DICT_TYPE.ZC_OPEN_METHOD, structure.openMethod) || structure.openMethod) : ''
  const shapingOpenValue = [shapingPart, openMethodPart].filter(Boolean).join(' ')
  if (shapingOpenValue) attrs.push({ label: '', value: shapingOpenValue, noLabel: true, smallValue: true })
  if (structure.pasteDirection) {
    attrs.push({
      label: '粘贴方向',
      value: getDictLabel(DICT_TYPE.ZC_PASTE_DIRECTION, structure.pasteDirection) || structure.pasteDirection,
      smallValue: true
    })
  }
  const pleatsSkirtLabeledValues: { label: string; value: string }[] = []
  if (structure.pleatsNum != null) pleatsSkirtLabeledValues.push({ label: '褶数', value: String(structure.pleatsNum) })
  if (structure.pleatsDistance != null) pleatsSkirtLabeledValues.push({ label: '褶距', value: String(structure.pleatsDistance) })
  if (structure.skirtHeight != null) pleatsSkirtLabeledValues.push({ label: '裙摆', value: String(structure.skirtHeight) })
  if (pleatsSkirtLabeledValues.length) {
    attrs.push({ label: '', value: '', labeledValues: pleatsSkirtLabeledValues, colspan: 2 })
  }
  if (structure.processType) {
    attrs.push({
      label: '加工方式',
      value: String(getDictLabel(DICT_TYPE.ZC_PROCESS_TYPE, structure.processType) || structure.processType).slice(0, 2),
      smallValue: true
    })
  }
  if (structure.installProcessName) {
    attrs.push({ label: '安装工艺', value: structure.installProcessName, colspan: 2, smallValue: true })
  }
  return attrs
}

/** 按顺序将 attrs 从左到右、从上到下填入 cols 列网格，自动换行，不补空单元格 */
const chunkAttrs = (structure: any, cols: number) => {
  const attrs = getStructureAttrs(structure)
  const rows: StructureAttr[][] = []
  let currentRow: StructureAttr[] = []
  let used = 0
  for (const attr of attrs) {
    const span = attr.colspan || 1
    if (used > 0 && used + span > cols) {
      rows.push(currentRow)
      currentRow = []
      used = 0
    }
    currentRow.push(attr)
    used += span
    if (used >= cols) {
      rows.push(currentRow)
      currentRow = []
      used = 0
    }
  }
  if (currentRow.length > 0) rows.push(currentRow)
  return rows
}

// ======================== 对外方法 ========================
/** 打开预览弹窗，传入当前表单数据，并为每个结构生成独立二维码 */
const open = async (data: FormDataType) => {
  formData.value = data
  visible.value = true
  structureQrCodes.value = {}
  qrLoading.value = true

  try {
    const tasks: Promise<void>[] = []
    for (const [cIdx, curtain] of (data.curtains || []).entries()) {
      for (const [sIdx, structure] of ((curtain as any).structures || []).entries()) {
        tasks.push(
          (async () => {
            const codeContent = JSON.stringify({
              orderId: data.id,
              orderNo: data.orderNo,
              curtainId: curtain.id ?? cIdx + 1,
              structureId: structure.id ?? sIdx + 1
            })
            const codeId = await BarcodeRegistryApi.create({
              codeType: 'ORDER_QR',
              targetRoute: '/pages-curtain/order/curtain-order-detail/curtain-item/index',
              codeContent
            })
            const url = await QRCode.toDataURL(codeId, { width: 180, margin: 1 })
            structureQrCodes.value[`${cIdx}-${sIdx}`] = { url, code: codeId }
          })()
        )
      }
    }
    await Promise.all(tasks)
  } catch (error) {
    console.error('生成二维码失败', error)
    ElMessage.error('二维码加载失败')
  } finally {
    qrLoading.value = false
  }
}

defineExpose({ open })

// ======================== 打印 ========================
/**
 * 在新窗口生成加工单 HTML，每个结构单独一页（100mm × 70mm），自动触发打印对话框。
 * 抬头含品牌、客户、订单号、交付日期；结构属性以 3 列表格展示。
 */
const handlePrint = async () => {
  if (!formData.value) return
  if (qrLoading.value) {
    ElMessage.warning('正在加载二维码，请稍候...')
    return
  }

  const fd = formData.value
  const cName = customerName.value
  const bName = brandName.value

  const thS = 'border:1px solid #4B5563;padding:3px 5px;'
  const tdS = 'border:1px solid #4B5563;padding:3px 5px;'

  /** 根据结构索引生成抬头 HTML（含各自二维码） */
  const buildHeaderHtml = (cIdx: number, sIdx: number) => {
    const qrEntry = structureQrCodes.value[`${cIdx}-${sIdx}`]
    const qrImg = qrEntry
      ? `<img src="${qrEntry.url}" width="108" height="108" style="display:block;margin:0 auto;" />`
      : `<div style="width:108px;height:108px;border:1px dashed #bbb;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:11px;">二维码</div>`
    return `
      <div style="margin-bottom:2px;">
        <div style="font-size:16pt;letter-spacing:2px;text-align:center;margin-bottom:3px;line-height:1.2;">${bName ? bName + '&nbsp;' : ''}加工单</div>
        <div style="display:flex;align-items:flex-start;gap:9px;">
          <div style="flex:1;min-width:0;">
            <div style="padding:1px 0;font-size:11pt;">订单号：${fd.orderNo || '-'}</div>
            <div style="padding:1px 0;font-size:11pt;">客户：${cName}</div>
            <div style="padding:1px 0;font-size:11pt;">房间：</div>
            ${fd.note ? `<div style="padding:1px 0;font-size:11pt;">备注：${fd.note}</div>` : ''}
          </div>
          <div style="width:117px;flex-shrink:0;text-align:center;">${qrImg}</div>
        </div>
      </div>
      <div style="border-top:1px solid #ccc;margin:3px 0 4px;"></div>
    `
  }

  // 遍历每个窗帘下的每个结构，生成独立页面
  const pages: string[] = []
  for (const [cIdx, curtain] of (fd.curtains || []).entries()) {
    const ctnName = getCurtainName(curtain.curtainId) || (curtain as any).curtainName || '-'
    for (const [sIdx, structure] of ((curtain as any).structures || []).entries()) {
      // 窗帘标题行（依赖 sIdx，必须在内层循环里构建）
      const lC = 'font-size:8pt;color:#6B7280;white-space:nowrap;'
      const strName = getStructureName(structure.structureId) || structure.structureName || '-'
      const curtainHeaderHtml = `
        <div style="border:3px solid #1D4ED8;background:#EFF6FF;padding:4px 8px;margin-bottom:3px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span style="font-size:10pt;color:#1D4ED8;white-space:nowrap;font-weight:600;">${strName}</span>
          <span style="font-size:10pt;white-space:nowrap;flex:1;text-align:center;"><span style="${lC}">房间：</span>${curtain.room || '-'}</span>
          <span style="font-size:10pt;color:#1D4ED8;white-space:nowrap;">第${cIdx + 1}-${sIdx + 1}套 / 共${fd.curtains?.length || 0}套</span>
        </div>
      `

      // 结构属性按顺序填入 3 列表格
      const attrRows = chunkAttrs(structure, 3)
      const sC = 'border:1px solid #4B5563;padding:4px 5px;width:33.33%;vertical-align:middle;'
      const lS = 'font-size:8pt;color:#6B7280;white-space:nowrap;'
      const dimLabelS = 'font-size:10pt;color:#000;white-space:nowrap;'
      const dimValS = 'font-size:16pt;font-weight:500;color:#000;'
      const vS = 'font-size:14pt;'

      const renderAttrCell = (cell: StructureAttr) => {
        if (cell.labeledValues?.length) {
          const parts = cell.labeledValues
            .map(
              (part, pi) =>
                `${pi > 0 ? '|' : ''}<span style="${lS}">${part.label}：</span><span style="font-size:11pt;font-weight:500;">${part.value}</span>`
            )
            .join('')
          return parts
        }
        if (cell.isDim) {
          return `<span style="${dimLabelS}">${cell.label}：</span><span style="${dimValS}">${cell.value}</span>`
        }
        return `${cell.noLabel ? '' : `<span style="${lS}">${cell.label}：</span>`}<span style="${cell.smallValue ? 'font-size:11pt;font-weight:500;' : vS + 'font-weight:500;'}">${cell.value}</span>`
      }

      const structureHtml = `
        <table style="width:100%;border-collapse:collapse;border:2px solid #111827;background:#F9FAFB;color:#374151;margin-bottom:3px;font-size:12pt;">
          ${attrRows.map((row) => `<tr>${row.map((cell) => `<td colspan="${cell.colspan || 1}" style="${sC}">${renderAttrCell(cell)}</td>`).join('')}</tr>`).join('')}
        </table>
      `

      // 仅打印 elementIsPrint !== false 的用料行
      const mats: any[] = (structure.materials || []).filter((m: any) => m.elementIsPrint !== false)
      const materialsHtml = mats.length
        ? `<table style="width:100%;border-collapse:collapse;font-size:11pt;margin-top:2px;">
            <thead>
              <tr style="background:#F3F4F6;">
                <th style="${thS}text-align:left;">组件类型</th>
                <th style="${thS}text-align:left;">货号</th>
                <th style="${thS}text-align:left;">规格</th>
                <th style="${thS}text-align:right;">用料</th>
                <th style="${thS}text-align:left;">备注</th>
              </tr>
            </thead>
            <tbody>
              ${mats
                .map(
                  (m) => `
                <tr>
                  <td style="${tdS}">${getElementName(m.elementId) || m.elementName || '-'}</td>
                  <td style="${tdS}">${m.productName || '-'}</td>
                  <td style="${tdS}">${m.spec || '-'}</td>
                  <td style="${tdS}text-align:right;font-weight:500;font-size:14pt;color:#000;">${m.quantity ?? '-'}</td>
                  <td style="${tdS}">${m.note || ''}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>`
        : `<div style="padding:2px 8px;font-size:11pt;color:#9CA3AF;border:1px solid #D1D5DB;">（无用料）</div>`

      const noteText = formatCurtainStructureNote((curtain as any).note, structure.note)
      const noteHtml = noteText ? `<div style="margin-top:3px;padding:2px 8px;font-size:12pt;border:1px solid #D1D5DB;background:#FFFBEB;"><span style="color:#6B7280;">款式备注：</span>${noteText}</div>` : ''
      pages.push(`<div class="page">${buildHeaderHtml(cIdx, sIdx)}${curtainHeaderHtml}${structureHtml}${materialsHtml}${noteHtml}</div>`)
    }
  }

  // 组装完整 HTML，页面尺寸 宽100mm × 高120mm
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${bName ? bName + ' ' : ''}加工单 - ${fd.orderNo || ''}</title>
  <style>
    @page { size: 100mm 120mm; margin: 0mm; }
    html, body { margin: 0; padding: 0; }
    * { box-sizing: border-box; font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', Arial, sans-serif; font-weight: 400; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: geometricPrecision; }
    body { color: #1a1a1a; font-size: 12pt; line-height: 1.45; }
    b, strong { font-weight: 500; }
    .page { page-break-after: always; page-break-inside: avoid; overflow: hidden; padding: 0.2mm 3mm 3mm; width: 100mm; height: 120mm; box-sizing: border-box; background: #fff; box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 4px #f00; }
    .page:last-child { page-break-after: auto; }
  </style>
</head>
<body>${pages.join('')}</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    ElMessage.warning('浏览器阻止了弹窗，请允许弹窗后重试')
    return
  }
  win.document.write(html)
  win.document.close()
  setTimeout(() => {
    win.focus()
    win.print()
  }, 300)
}
</script>
