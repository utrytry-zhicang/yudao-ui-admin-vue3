<!--
  水洗标打印预览弹窗
  每个结构生成 1 张水洗标，标签尺寸 50mm × 120mm（竖版）
  从上到下：品牌名称、单号、客户、位置、套数、结构属性、用料、品牌电话和地址
  父组件通过 open(formData) 方法打开
-->
<template>
  <el-dialog v-model="visible" width="900px" top="2vh" :close-on-click-modal="false">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span class="text-base font-semibold">水洗标预览</span>
        <div class="flex gap-8px mr-24px">
          <el-tooltip content="打印 / 选择打印机 / 另存为PDF" placement="top">
            <el-button type="primary" :loading="loading" @click="handlePrint">
              <Icon icon="ep:printer" class="mr-4px" />打印
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </template>

    <!-- 预览区：三列网格展示（每标签竖版，尺寸 50mm × 120mm） -->
    <div style="background: #e8e8e8; padding: 20px 20px; max-height: 78vh; overflow-y: auto;">
      <div v-loading="loading" element-loading-text="正在加载...">
        <template v-if="labelItems.length">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(50mm, 50mm)); gap: 14px; justify-content: center; max-width: 100%; margin: 0 auto;">
            <div
              v-for="(item, idx) in labelItems"
              :key="idx"
              class="wash-label-card preview-card"
            >
              <div class="wash-label-brand">
                <div class="wash-label-brand-line"></div>
                <div class="wash-label-brand-name">{{ brandName || '品牌名称' }}</div>
              </div>

              <!-- 单号 -->
              <div class="wash-label-info-row">
                <span class="wash-label-lbl">单号：</span>
                <span class="wash-label-val">{{ item.orderNo }}</span>
              </div>

              <!-- 客户 -->
              <div class="wash-label-info-row">
                <span class="wash-label-lbl">客户：</span>
                <span class="wash-label-val">{{ item.customerName }}</span>
              </div>

              <!-- 位置 -->
              <div class="wash-label-info-row">
                <span class="wash-label-lbl">位置：</span>
                <span class="wash-label-val">{{ item.room || '-' }}</span>
              </div>

              <!-- 套数 -->
              <div class="wash-label-info-row sep">
                <span class="wash-label-lbl">套数：</span>
                <span class="wash-label-val">第{{ item.curtainSeq }}套/共{{ item.totalCurtains }}套</span>
              </div>

              <!-- 结构属性 -->
              <div class="wash-label-attrs">
                <div v-for="(attr, aIdx) in item.attrs" :key="aIdx" class="wash-label-info-row">
                  <span class="wash-label-lbl">{{ attr.label }}：</span>
                  <span class="wash-label-val">{{ attr.value }}</span>
                </div>
              </div>

              <!-- 用料 -->
              <div class="wash-label-mats">
                <div v-if="item.materials.length" class="wash-label-mat-table">
                  <div class="wash-label-mat-head">
                    <span>名称</span>
                    <span style="text-align:center;">产品</span>
                    <span class="wash-label-right">数量</span>
                  </div>
                  <div
                    v-for="(m, mIdx) in item.materials"
                    :key="mIdx"
                    class="wash-label-mat-row"
                  >
                    <span>{{ m.elementName || '-' }}</span>
                    <span class="wash-label-mat-pn">{{ m.productName || '-' }}</span>
                    <span class="wash-label-right">{{ m.quantity ?? '-' }}</span>
                  </div>
                </div>
                <div v-else class="wash-label-no-mat">（无用料）</div>
              </div>

              <!-- 底部品牌电话和地址 -->
              <div class="wash-label-footer">
                <div class="wash-label-footer-row">
                  <span class="wash-label-footer-lbl">电话：</span>
                  <span class="wash-label-val-foot">{{ brandPhone }}</span>
                </div>
                <div class="wash-label-footer-row">
                  <span class="wash-label-footer-lbl">地址：</span>
                  <span class="wash-label-val-foot">{{ brandAddress }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-if="!loading && !labelItems.length" style="text-align:center; padding:40px; color:#9CA3AF; background:white; margin:0 auto; width:400px;">
          暂无数据
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { getDictLabel, DICT_TYPE } from '@/utils/dict'
import type { CustomerSimpleVO } from '@/api/zc/customer'
import type { BrandSimpleVO, Brand } from '@/api/zc/brand'
import { BrandApi } from '@/api/zc/brand'
import type { CurtainSimpleVO } from '@/api/zc/curtain'
import type { CurtainStructureSimpleVO } from '@/api/zc/curtainstructure'
import type { SalesOrder, SalesOrderCurtain, SalesOrderStructure, ZCSalesOrderMaterial } from '@/api/zc/salesorder'

/** 水洗标打印预览弹窗（每个结构生成 1 张标签，50mm × 120mm） */
defineOptions({ name: 'SalesOrderWashLabelDialog' })

// ======================== 类型定义 ========================
type StructureWithMaterials = SalesOrderStructure & { materials: ZCSalesOrderMaterial[] }
type CurtainWithStructures = SalesOrderCurtain & { structures: StructureWithMaterials[] }
type FormDataType = SalesOrder & { curtains: CurtainWithStructures[] }

/** 单张水洗标的展示数据 */
interface LabelItem {
  orderNo: string
  customerName: string
  room: string
  curtainSeq: number    // 窗帘序号
  totalCurtains: number // 总窗帘数
  structureSeq: number  // 结构序号
  attrs: { label: string; value: string }[] // 结构属性列表
  materials: { elementName: string; productName: string; quantity?: number }[]
}

// ======================== Props ========================
const props = defineProps<{
  customersList: CustomerSimpleVO[]
  brandsList: BrandSimpleVO[]
  curtainList: CurtainSimpleVO[]
  curtainStructureList: CurtainStructureSimpleVO[]
}>()

// ======================== 响应式状态 ========================
const visible = ref(false)
const loading = ref(false)
const formData = ref<FormDataType | null>(null)
/** 展开后的所有标签项（每个结构 1 张） */
const labelItems = ref<LabelItem[]>([])
/** 品牌详情（底部展示电话、地址） */
const brandDetail = ref<Brand | null>(null)

// ======================== 计算属性 ========================
const brandName = computed(() => {
  if (!formData.value?.brandId) return ''
  return props.brandsList.find((item) => item.id === formData.value!.brandId)?.name || ''
})

const brandPhone = computed(() => brandDetail.value?.mobile || '-')
const brandAddress = computed(() => brandDetail.value?.address || '-')

// ======================== 查找辅助函数 ========================
const getCurtainName = (id?: number): string => {
  if (!id) return ''
  return props.curtainList.find((item) => item.id === id)?.name || ''
}

const getStructureName = (id?: number): string => {
  if (!id) return ''
  return props.curtainStructureList.find((item) => item.id === id)?.name || ''
}

const getCustomerName = (id?: number): string => {
  if (!id) return '-'
  const c = props.customersList.find((item) => item.id === id)
  return c ? c.shortName : '-'
}

/** 将结构的可见属性收集为 label/value 列表 */
const buildAttrs = (structure: any): { label: string; value: string }[] => {
  const attrs: { label: string; value: string }[] = []
  const strName = getStructureName(structure.structureId) || structure.structureName
  if (strName) attrs.push({ label: '结构', value: strName })
  if (structure.height != null && structure.width != null) {
    attrs.push({ label: '宽×高', value: `${structure.width}×${structure.height}` })
  } else {
    if (structure.height != null) attrs.push({ label: '高', value: String(structure.height) })
    if (structure.width != null) attrs.push({ label: '宽', value: String(structure.width) })
  }
  if (structure.processType) attrs.push({ label: '加工类型', value: getDictLabel(DICT_TYPE.ZC_PROCESS_TYPE, structure.processType) || structure.processType })
  if (structure.openMethod) attrs.push({ label: '打开方式', value: getDictLabel(DICT_TYPE.ZC_OPEN_METHOD, structure.openMethod) || structure.openMethod })
  if (structure.pasteDirection) attrs.push({ label: '粘贴方向', value: getDictLabel(DICT_TYPE.ZC_PASTE_DIRECTION, structure.pasteDirection) || structure.pasteDirection })
  if (structure.pleatsNum != null) attrs.push({ label: '总褶数', value: String(structure.pleatsNum) })
  if (structure.pleatsDistance != null) attrs.push({ label: '褶距', value: String(structure.pleatsDistance) })
  if (structure.skirtHeight != null) attrs.push({ label: '裙摆高度', value: String(structure.skirtHeight) })
  if (structure.isShaping) attrs.push({ label: '定型', value: '是' })
  if (structure.leftCorner) attrs.push({ label: '左转角', value: structure.leftCorner })
  if (structure.rightCorner) attrs.push({ label: '右转角', value: structure.rightCorner })
  if (structure.installProcessName) attrs.push({ label: '安装工艺', value: structure.installProcessName })
  if (structure.note) attrs.push({ label: '备注', value: structure.note })
  return attrs
}

// ======================== 对外方法 ========================
/** 打开预览弹窗，传入当前表单数据 */
const open = async (data: FormDataType) => {
  formData.value = data
  labelItems.value = []
  brandDetail.value = null
  visible.value = true
  loading.value = true
  try {
    if (data.brandId) {
      try {
        brandDetail.value = await BrandApi.getBrand(data.brandId)
      } catch (e) {
        console.error('获取品牌详情失败', e)
        brandDetail.value = null
      }
    }

    const customerName = getCustomerName(data.customerId)
    const orderNo = data.orderNo || '-'
    const totalCurtains = (data.curtains || []).length
    const items: LabelItem[] = []

    for (const [cIdx, curtain] of (data.curtains || []).entries()) {
      const room = curtain.room || '-'
      const curtainSeq = cIdx + 1

      for (const [sIdx, structure] of ((curtain as any).structures || []).entries()) {
        const attrs = buildAttrs(structure)
        const materials = ((structure as any).materials || []).map((m: any) => ({
          elementName: m.elementName || '',
          productName: m.productName || '',
          quantity: m.quantity,
        }))

        items.push({
          orderNo,
          customerName,
          room,
          curtainSeq,
          totalCurtains,
          structureSeq: sIdx + 1,
          attrs,
          materials
        })
      }
    }
    labelItems.value = items
  } finally {
    loading.value = false
  }
}

defineExpose({ open })

// ======================== 打印 ========================
const handlePrint = () => {
  if (!formData.value || !labelItems.value.length) return

  const bName = brandName.value
  const bPhone = brandPhone.value
  const bAddress = brandAddress.value

  const labelHtmlList = labelItems.value.map((item) => {
    const attrsHtml = item.attrs
      .map((a) => `<div class="wash-label-info-row"><span class="wash-label-lbl">${a.label}：</span><span class="wash-label-val">${a.value}</span></div>`)
      .join('')

    const materialsHtml = item.materials.length
      ? `
        <div class="wash-label-mat-table">
          <div class="wash-label-mat-head">
            <span>名称</span>
            <span style="text-align:center;">产品</span>
            <span class="wash-label-right">数量</span>
          </div>
          ${item.materials
            .map(
              (m) => `
                <div class="wash-label-mat-row">
                  <span>${m.elementName || '-'}</span>
                  <span class="wash-label-mat-pn">${m.productName || '-'}</span>
                  <span class="wash-label-right">${m.quantity ?? '-'}</span>
                </div>
              `
            )
            .join('')}
        </div>`
      : '<div class="wash-label-no-mat">（无用料）</div>'

    return `
      <div class="wash-label-card">
        <div class="wash-label-brand">
          <div class="wash-label-brand-line"></div>
          <div class="wash-label-brand-name">${bName || '品牌名称'}</div>
        </div>
        <div class="wash-label-info-row"><span class="wash-label-lbl">单号：</span><span class="wash-label-val">${item.orderNo}</span></div>
        <div class="wash-label-info-row"><span class="wash-label-lbl">客户：</span><span class="wash-label-val">${item.customerName}</span></div>
        <div class="wash-label-info-row"><span class="wash-label-lbl">位置：</span><span class="wash-label-val">${item.room || '-'}</span></div>
        <div class="wash-label-info-row sep"><span class="wash-label-lbl">套数：</span><span class="wash-label-val">第${item.curtainSeq}套/共${item.totalCurtains}套</span></div>
        <div class="wash-label-attrs">${attrsHtml}</div>
        <div class="wash-label-mats">${materialsHtml}</div>
        <div class="wash-label-footer">
          <div class="wash-label-footer-row"><span class="wash-label-footer-lbl">电话：</span><span class="wash-label-val-foot">${bPhone}</span></div>
          <div class="wash-label-footer-row"><span class="wash-label-footer-lbl">地址：</span><span class="wash-label-val-foot">${bAddress}</span></div>
        </div>
      </div>`
  })

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${bName ? bName + ' ' : ''}水洗标 - ${formData.value.orderNo || ''}</title>
  <style>
    @page { size: 50mm 120mm; margin: 0; }
    * { box-sizing: border-box; font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif; }
    html, body { margin: 0; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .wash-label-card {
      width: 50mm;
      height: 120mm;
      min-height: 120mm;
      box-sizing: border-box;
      padding: 2mm 2.5mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      page-break-after: always;
      overflow: hidden;
    }
    .wash-label-card:last-child { page-break-after: auto; }
    .wash-label-brand { display: flex; flex-direction: column; gap: 4px; margin-bottom: 2mm; flex-shrink: 0; }
    .wash-label-brand-line { border-top: 1px dashed #9a9a9a; }
    .wash-label-brand-name { text-align: center; font-size: 16px; font-weight: 800; color: #111111; margin-top: 2px; }
    .wash-label-info-row { display: flex; align-items: baseline; gap: 4px; line-height: 1.5; font-size: 12px; }
    .wash-label-info-row.sep { border-bottom: 1px solid #eeeeee; padding-bottom: 2px; margin-bottom: 2px; }
    .wash-label-lbl { color: #777777; white-space: nowrap; }
    .wash-label-val { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .wash-label-attrs { margin-bottom: 2px; }
    .wash-label-attrs .wash-label-info-row { font-size: 11px; line-height: 1.4; }
    .wash-label-attrs .wash-label-val { font-weight: 600; }
    .wash-label-mats { border-top: 1px solid #eeeeee; padding-top: 2px; }
    .wash-label-mat-table { width: 100%; border: 1px dashed #bdbdbd; font-size: 10px; border-collapse: collapse; }
    .wash-label-mat-head, .wash-label-mat-row { display: grid; grid-template-columns: 1.2fr 1.8fr 0.7fr; }
    .wash-label-mat-head { background: #f7f7f7; color: #666666; font-weight: 600; border-bottom: 1px dashed #bdbdbd; }
    .wash-label-mat-row { color: #333333; border-bottom: 1px dashed #d9d9d9; }
    .wash-label-mat-row:last-child { border-bottom: none; }
    .wash-label-mat-head span, .wash-label-mat-row span { padding: 1px 3px; overflow: hidden; text-overflow: ellipsis; }
    .wash-label-mat-pn { white-space: normal; word-break: break-all; font-weight: 600; text-align: center; }
    .wash-label-right { text-align: center; }
    .wash-label-no-mat { font-size: 9px; color: #bbbbbb; }
    .wash-label-footer { border-top: 1px solid #eeeeee; padding-top: 3px; margin-top: 3px; display: flex; flex-direction: column; gap: 1px; font-size: 10.5px; color: #333333; }
    .wash-label-footer-row { display: flex; align-items: baseline; gap: 2px; }
    .wash-label-footer-lbl { color: #777777; white-space: nowrap; }
    .wash-label-val-foot { font-weight: 600; color: #1a1a1a; word-break: break-all; }
  </style>
</head>
<body>
  ${labelHtmlList.join('')}
</body>
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
  }, 400)
}
</script>

<style scoped>
.wash-label-card {
  width: 50mm;
  height: 120mm;
  min-height: 120mm;
  box-sizing: border-box;
  padding: 2mm 2.5mm;
  background: #ffffff;
  color: #1a1a1a;
  font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}
.wash-label-card.preview-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  border: 1px solid #dddddd;
}
.wash-label-brand {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 0;
  margin-bottom: 2mm;
  flex-shrink: 0;
}
.wash-label-brand-line {
  border-top: 1px dashed #9a9a9a;
}
.wash-label-brand-name {
  text-align: center;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.1;
  color: #111111;
  margin-top: 2px;
}
.wash-label-info-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  line-height: 1.5;
  font-size: 12px;
  flex-shrink: 0;
}
.wash-label-info-row.sep {
  border-bottom: 1px solid #eeeeee;
  padding-bottom: 2px;
  margin-bottom: 2px;
}
.wash-label-lbl {
  color: #777777;
  white-space: nowrap;
  font-size: 12px;
}
.wash-label-val {
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}
.wash-label-attrs {
  flex-shrink: 0;
  margin-bottom: 2px;
}
.wash-label-attrs .wash-label-info-row {
  font-size: 11px;
  line-height: 1.45;
}
.wash-label-attrs .wash-label-lbl {
  font-size: 11px;
}
.wash-label-attrs .wash-label-val {
  font-size: 11px;
  font-weight: 600;
}
.wash-label-mats {
  border-top: 1px solid #eeeeee;
  padding-top: 2px;
  margin-bottom: 2px;
}
.wash-label-mat-table {
  width: 100%;
  border: 1px dashed #bdbdbd;
  font-size: 10.5px;
  border-collapse: collapse;
}
.wash-label-mat-head,
.wash-label-mat-row {
  display: grid;
  grid-template-columns: 1.2fr 1.8fr 0.7fr;
}
.wash-label-mat-head {
  background: #f7f7f7;
  color: #666666;
  font-weight: 600;
  border-bottom: 1px dashed #bdbdbd;
}
.wash-label-mat-row {
  color: #333333;
  border-bottom: 1px dashed #d9d9d9;
}
.wash-label-mat-row:last-child {
  border-bottom: none;
}
.wash-label-mat-head span,
.wash-label-mat-row span {
  padding: 1px 3px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wash-label-mat-pn {
  white-space: normal;
  word-break: break-all;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
}

.wash-label-right {
  text-align: center;
}

.wash-label-no-mat {
  font-size: 9px;
  color: #bbbbbb;
}

/* 底部品牌电话和地址 */
.wash-label-footer {
  border-top: 1px solid #eeeeee;
  padding-top: 3px;
  margin-top: 3px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 10.5px;
  color: #333333;
  flex-shrink: 0;
}

.wash-label-footer-row {
  display: flex;
  align-items: baseline;
  gap: 2px;
  line-height: 1.35;
}

.wash-label-footer-lbl {
  color: #777777;
  white-space: nowrap;
}

.wash-label-val-foot {
  font-weight: 600;
  color: #1a1a1a;
  word-break: break-all;
}
</style>


