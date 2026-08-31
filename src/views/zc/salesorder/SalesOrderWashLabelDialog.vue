<!--
  水洗标打印预览弹窗
  每个结构生成 1 张水洗标，标签尺寸 50mm × 80mm（竖版）
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

    <!-- 预览区：三列网格展示（每标签竖版较窄） -->
    <div style="background: #e8e8e8; padding: 20px 20px; max-height: 78vh; overflow-y: auto;">
      <div v-loading="loading" element-loading-text="正在加载...">
        <template v-if="labelItems.length">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(50mm, 50mm)); gap: 14px; justify-content: center; max-width: 100%; margin: 0 auto;">
            <div
              v-for="(item, idx) in labelItems"
              :key="idx"
              style="
                background: white;
                width: 50mm;
                max-width: 50mm;
                padding: 6px 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.18);
                font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
                color: #1a1a1a;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                border: 1px solid #ddd;
                font-size: 10px;
                overflow: hidden;
                padding-bottom: 20px;
              "
            >
              <div style="display:flex; flex-direction:column; gap:6px; margin-top:20px; margin-bottom:10px;">
                <div style="border-top:1px dashed #9a9a9a;"></div>
                <div style="text-align:center; font-size:18px; font-weight:800; line-height:1.1; color:#111; margin-top:2px;">
                  {{ brandName || '品牌名称' }}
                </div>
              </div>

              <!-- 单号 -->
              <div style="display:flex; gap:4px; line-height:1.8;">
                <span style="color:#888; white-space:nowrap; font-size:13px;">单号：</span>
                <span style="font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px;">{{ item.orderNo }}</span>
              </div>

              <!-- 客户 -->
              <div style="display:flex; gap:4px; line-height:1.8;">
                <span style="color:#888; white-space:nowrap; font-size:13px;">客户：</span>
                <span style="font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px;">{{ item.customerName }}</span>
              </div>

              <!-- 位置 -->
              <div style="display:flex; gap:4px; line-height:1.8;">
                <span style="color:#888; white-space:nowrap; font-size:13px;">位置：</span>
                <span style="font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px;">{{ item.room || '-' }}</span>
              </div>

              <!-- 套数 -->
              <div style="display:flex; gap:4px; line-height:1.8; border-bottom:1px solid #eee; padding-bottom:3px; margin-bottom:3px;">
                <span style="color:#888; white-space:nowrap; font-size:13px;">套数：</span>
                <span style="font-weight:700; white-space:nowrap; font-size:13px;">第{{ item.curtainSeq }}套/共{{ item.totalCurtains }}套</span>
                <!-- <span style="color:#888; margin-left:4px; white-space:nowrap; font-size:11px;">结构：{{ item.structureSeq }}</span> -->
              </div>

              <!-- 结构属性 -->
              <div style="flex-shrink:0; margin-bottom:3px;">
                <div v-for="(attr, aIdx) in item.attrs" :key="aIdx" style="display:flex; gap:4px; line-height:1.6; font-size:12px;">
                  <span style="color:#888; white-space:nowrap;">{{ attr.label }}：</span>
                  <span style="font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ attr.value }}</span>
                </div>
              </div>

              <!-- 用料 -->
              <div style="flex:1; overflow:hidden; border-top:1px solid #eee; padding-top:3px; margin-bottom:3px;">
                <!-- <div style="font-size:10px; color:#888; margin-bottom:2px;">用料</div> -->
                <div v-if="item.materials.length" style="width:100%; font-size:11px; border:1px dashed #bdbdbd; border-collapse:collapse;">
                  <div style="display:grid; grid-template-columns: 1.2fr 1.8fr 0.7fr; background:#f7f7f7; color:#666; font-weight:600; border-bottom:1px dashed #bdbdbd;">
                    <span style="padding:1px 3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:11px;">名称</span>
                    <span style="padding:1px 3px; white-space:normal; overflow:hidden; word-break:break-all; text-align:center; font-size:11px;">产品</span>
                    <span style="padding:1px 3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center; font-size:11px;">数量</span>
                  </div>
                  <div
                    v-for="(m, mIdx) in item.materials"
                    :key="mIdx"
                    style="display:grid; grid-template-columns: 1.2fr 1.8fr 0.7fr; border-bottom:1px dashed #d9d9d9; color:#333; font-size:11px;"
                  >
                    <span style="padding:1px 3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ m.elementName || '-' }}</span>
                    <span style="padding:1px 3px; white-space:normal; overflow:hidden; word-break:break-all; font-weight:600; line-height:1.2; text-align:center;">{{ m.productName || '-' }}</span>
                    <span style="padding:1px 3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center;">{{ m.quantity ?? '-' }}</span>
                  </div>
                </div>
                <div v-else style="font-size:9px; color:#bbb;">（无用料）</div>
              </div>

              <!-- 底部品牌电话和地址 -->
              <div style="border-top: 1px solid #eee; padding-top: 4px; margin-top: auto; display: flex; flex-direction: column; gap: 2px; font-size: 11px; color: #333;">
                <div style="display: flex; gap: 2px; line-height: 1.4;">
                  <span style="color: #888; white-space: nowrap;">电话：</span>
                  <span style="font-weight: 600; word-break: break-all;">{{ brandPhone }}</span>
                </div>
                <div style="display: flex; gap: 2px; line-height: 1.4;">
                  <span style="color: #888; white-space: nowrap;">地址：</span>
                  <span style="font-weight: 600; word-break: break-all;">{{ brandAddress }}</span>
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

/** 水洗标打印预览弹窗（每个结构生成 1 张标签，50mm × 80mm） */
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
/**
 * 在新窗口生成水洗标 HTML，每个结构 1 张（50mm × 80mm），自动触发打印对话框。
 * 布局从上到下：品牌名称、单号、客户、位置、套数、结构属性、用料、品牌电话和地址。
 */
const handlePrint = () => {
  if (!formData.value || !labelItems.value.length) return

  const bName = brandName.value
  const bPhone = brandPhone.value
  const bAddress = brandAddress.value

  const labelHtmlList = labelItems.value.map((item) => {
    const attrsHtml = item.attrs
      .map((a) => `<div class="info-row"><span class="lbl">${a.label}：</span><span class="val">${a.value}</span></div>`)
      .join('')

    const materialsHtml = item.materials.length
      ? `
        <div class="mat-table">
          <div class="mat-head">
            <span>名称</span>
            <span>产品</span>
            <span class="right">数量</span>
          </div>
          ${item.materials
            .map(
              (m) => `
                <div class="mat-row">
                  <span>${m.elementName || '-'}</span>
                  <span class="mat-pn">${m.productName || '-'}</span>
                  <span class="right">${m.quantity ?? '-'}</span>
                </div>
              `
            )
            .join('')}
        </div>`
      : '<div style="font-size:7pt;color:#bbb;">（无用料）</div>'

    return `
      <div class="label">
        <div class="brand">
          <div class="brand-line"></div>
          <div class="brand-name">${bName || '品牌名称'}</div>
          <div class="brand-line"></div>
        </div>
        <div class="info-row"><span class="lbl">单号：</span><span class="val">${item.orderNo}</span></div>
        <div class="info-row"><span class="lbl">客户：</span><span class="val">${item.customerName}</span></div>
        <div class="info-row"><span class="lbl">位置：</span><span class="val">${item.room}</span></div>
        <div class="info-row sep"><span class="lbl">套数：</span><span class="val">第${item.curtainSeq}套/共${item.totalCurtains}套</span></div>
        <div class="attrs">${attrsHtml}</div>
        <div class="mats">
          ${materialsHtml}
        </div>
        <div class="brand-footer">
          <div class="footer-row"><span class="lbl">电话：</span><span class="val-foot">${bPhone}</span></div>
          <div class="footer-row"><span class="lbl">地址：</span><span class="val-foot">${bAddress}</span></div>
        </div>
      </div>`
  })

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${bName ? bName + ' ' : ''}水洗标 - ${formData.value.orderNo || ''}</title>
  <style>
    @page { size: 50mm 80mm; margin: 0; }
    * { box-sizing: border-box; font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif; }
    body { margin: 0; padding: 20px 20px; color: #1a1a1a; font-size: 8.5pt; }
    .label {
      width: 50mm;
      min-height: 80mm;
      height: auto;
      padding: 2mm 2.5mm;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding-bottom: 20px;
    }
    .label:last-child { page-break-after: auto; }
    .brand {
      display: flex;
      flex-direction: column;
      gap: 1.8mm;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    .brand-line {
      border-top: 0.5pt dashed #9a9a9a;
    }
    .brand-name {
      text-align: center;
      font-size: 15pt;
      font-weight: 800;
      line-height: 1.1;
      color: #111;
    }
    .info-row {
      display: flex;
      align-items: baseline;
      gap: 3px;
      line-height: 1.7;
    }
    .info-row.sep {
      border-bottom: 0.5pt solid #ddd;
      padding-bottom: 1mm;
      margin-bottom: 1mm;
    }
    .lbl { color: #777; white-space: nowrap; font-size: 11pt; }
    .val { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11pt; }
    .attrs { flex-shrink: 0; }
    .attrs .info-row { font-size: 11pt; line-height: 1.55; }
    .mats {
      flex: 1;
      overflow: hidden;
      border-top: 0.5pt solid #ddd;
      padding-top: 1mm;
      margin-top: 1mm;
    }
    .sec-title { font-size: 10.5pt; color: #888; margin-bottom: 0.5mm; }
    .mat-table { width: 100%; border: 0.5pt dashed #bdbdbd; font-size: 10.5pt; }
    .mat-head, .mat-row { display: grid; grid-template-columns: 1.2fr 1.8fr 0.7fr; }
    .mat-head { background: #f7f7f7; color: #666; font-weight: 600; border-bottom: 0.5pt dashed #bdbdbd; }
    .mat-row { color: #333; border-bottom: 0.5pt dashed #d9d9d9; }
    .mat-row:last-child { border-bottom: 0; }
    .mat-head span, .mat-row span { padding: 0.4mm 0.7mm; overflow: hidden; text-overflow: ellipsis; }
    .mat-head .mat-pn, .mat-row .mat-pn { white-space: normal; word-break: break-all; }
    .mat-pn { font-weight: 600; }
    .right { text-align: center; justify-self: center; }
    .brand-footer {
      border-top: 0.5pt solid #ddd;
      padding-top: 1.5mm;
      margin-top: auto;
      display: flex;
      flex-direction: column;
      gap: 0.8mm;
    }
    .footer-row {
      display: flex;
      align-items: baseline;
      gap: 2px;
      line-height: 1.3;
      font-size: 9.5pt;
    }
    .val-foot {
      font-weight: 600;
      color: #1a1a1a;
      word-break: break-all;
    }
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
