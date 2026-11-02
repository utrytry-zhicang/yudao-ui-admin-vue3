<!--
  销售订单发货联打印预览弹窗
  功能：复用加工单的页面布局与打印尺寸，展示订单发货信息并支持打印
  使用方：views/zc/salesorder/SalesOrderForm.vue、views/zc/salesorder/SalesOrderProductForm.vue
-->
<template>
  <el-dialog v-model="visible" width="860px" top="2vh" :close-on-click-modal="false">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span class="text-base font-semibold">发货联预览</span>
        <div class="flex items-center gap-8px mr-24px">
          <el-radio-group v-model="shippingType" size="small">
            <el-radio-button label="curtain">合并结构发货</el-radio-button>
            <el-radio-button label="order">合并发货</el-radio-button>
          </el-radio-group>
          <el-tooltip content="打印 / 选择打印机 / 另存为PDF" placement="top">
            <el-button type="primary" @click="handlePrint">
              <Icon icon="ep:printer" class="mr-4px" />打印
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </template>

    <!-- 预览区：与打印完全同尺寸（100mm × 120mm） -->
    <div style="background: #e8e8e8; padding: 20px; max-height: 78vh; overflow-y: auto;">
      <template v-if="shippingPages.length">
          <div
            v-for="page in shippingPages"
            :key="page.pageKey"
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
          <!-- 抬头：标题单独一行，信息与二维码并排 -->
          <div style="margin-bottom: 3px;">
            <div style="font-size: 20px; letter-spacing: 2px; text-align: center; margin-bottom: 3px; line-height: 1.2; font-weight: 700;">
              {{ brandName ? brandName + ' ' : '' }}发货联
            </div>
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <div style="flex: 1; min-width: 0;">
                <div style="padding: 2px 0; font-size: 15px;">订单号：{{ formData?.orderNo || '-' }}</div>
                <div v-if="shippingType !== 'order'" style="padding: 2px 0; font-size: 15px;">{{ page.setNoText }}</div>
                <div v-if="shippingType !== 'order'" style="padding: 2px 0; font-size: 15px;">房间：{{ page.room }}</div>
                <div v-else style="padding: 2px 0; font-size: 15px;">合并发货/共{{ page.totalCurtains }}套</div>
              </div>
              <div style="width: 123px; flex-shrink: 0; text-align: center;">
              <template v-if="structureQrCodes[page.pageKey]">
                <img :src="structureQrCodes[page.pageKey].url" width="108" height="108" style="display: block; margin: 0 auto;" />
              </template>
              <div
                v-else
                style="width: 108px; height: 108px; border: 1px dashed #bbb; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 13px;"
              >二维码</div>
              </div>
            </div>
          </div>

          <!-- 分隔线 -->
          <div style="border-top: 1px solid #ccc; margin: 3px 0 5px;"></div>

          <table style="width: 100%; border-collapse: collapse; border: 2px solid #111827; background: #F9FAFB; color: #374151; margin-bottom: 8px; font-size: 14px;">
            <tbody>
              <tr>
                <td style="border: 1px solid #4B5563; padding: 6px 8px; width: 28%; color: #111; font-size: 16px; font-weight: 700;">客户名称</td>
                <td style="border: 1px solid #4B5563; padding: 6px 8px; font-weight: bold;">{{ customerName }}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #4B5563; padding: 6px 8px; width: 32%; color: #111; font-size: 16px; font-weight: 700;">收货人/电话</td>
                <td style="border: 1px solid #4B5563; padding: 6px 8px; font-weight: bold;">{{ formData?.receiver || '-' }}：{{ formData?.mobile || '-' }}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #4B5563; padding: 6px 8px; color: #111; font-size: 16px; font-weight: 700;">物流方式</td>
                <td style="border: 1px solid #4B5563; padding: 6px 8px; font-weight: bold;">{{ logisticsName }}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #4B5563; padding: 6px 8px; color: #111; font-size: 16px; font-weight: 700; vertical-align: top;">收货地址</td>
                <td style="border: 1px solid #4B5563; padding: 6px 8px; font-weight: bold; word-break: break-all;">{{ formData?.deliveryAddress || '-' }}</td>
              </tr>
              <tr v-if="shippingType !== 'order'">
                <td style="border: 1px solid #4B5563; padding: 6px 8px; color: #111; font-size: 16px; font-weight: 700; vertical-align: top;">结构信息</td>
                <td style="border: 1px solid #4B5563; padding: 6px 8px; font-weight: bold; word-break: break-all;">
                  <div
                    v-for="(structureInfo, structureIdx) in page.structureInfos"
                    :key="`${page.pageKey}-${structureIdx}`"
                    style="line-height: 1.5;"
                  >
                    {{ structureInfo.structureName }} | 备注：{{ structureInfo.structureNote }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div
            v-if="formData?.note"
            style="margin-top: 4px; padding: 6px 8px; font-size: 14px; border: 1px solid #D1D5DB; background: #FFFBEB;"
          >
            <span style="color: #111; font-weight: 700; font-size: 15px;">订单备注：</span>{{ formData.note }}
          </div>

          <!-- 发货信息确认联：放在页面最后 -->
          <div style="border: 3px solid #1D4ED8; background: #EFF6FF; padding: 4px 8px; margin-top: 8px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
            <span style="font-size: 14px; color: #111; font-weight: 700; white-space: nowrap;">发货信息确认联</span>
            <span style="font-size: 14px; white-space: nowrap; color: #111; font-weight: 700;"><span style="font-size: 12px; color: #111; font-weight: 700;">打印日期：</span>{{ printDate }}</span>
          </div>
          <div style="margin-top: 6px; font-size: 13px; line-height: 1.5; color: #555;">
            品牌电话：{{ brandDetail?.mobile || '-' }}<br />
            品牌地址：{{ brandDetail?.address || '-' }}
          </div>
        </div>
      </template>

      <div v-else style="text-align: center; padding: 40px; color: #9CA3AF; background: white; margin: 0 auto; width: 500px;">
        暂无结构数据
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
// ======================== 导入与声明 ========================
import QRCode from 'qrcode'
import { BarcodeRegistryApi } from '@/api/zc/barcodeRegistry'
import type { CustomerSimpleVO } from '@/api/zc/customer'
import type { Brand, BrandSimpleVO } from '@/api/zc/brand'
import { BrandApi } from '@/api/zc/brand'
import type { LogisticsSimpleVO } from '@/api/zc/logistics'
import type { SalesOrder } from '@/api/zc/salesorder'

/** 销售订单发货联打印预览弹窗 */
defineOptions({ name: 'SalesOrderShippingDialog' })

// ======================== Props ========================
const props = defineProps<{
  customersList: CustomerSimpleVO[]
  brandsList: BrandSimpleVO[]
  logisticsList: LogisticsSimpleVO[]
}>()

// ======================== 响应式状态 ========================
const visible = ref(false)
const formData = ref<SalesOrder | null>(null)
/** 发货模式：'curtain' = 合并结构发货, 'order' = 合并发货 */
/** 当前订单关联品牌的详细信息，用于展示品牌电话和地址 */
const brandDetail = ref<Brand | null>(null)
const shippingType = ref<'curtain' | 'order'>('order')
/** 每个结构页的二维码信息，key 为 `${curtainIdx}-${structureIdx}` 或 `order-merged` */
const structureQrCodes = ref<Record<string, { url: string; code: string }>>({})

// ======================== 计算属性 ========================
const brandName = computed(() => {
  if (!formData.value?.brandId) return ''
  return props.brandsList.find((item) => item.id === formData.value!.brandId)?.name || ''
})

const logisticsName = computed(() => {
  if (formData.value?.logisticName) return formData.value.logisticName
  if (!formData.value?.logisticId) return '-'
  return props.logisticsList.find((item) => item.id === formData.value!.logisticId)?.name || '-'
})

const customerName = computed(() => {
  if (!formData.value?.customerId) return '-'
  const customer = props.customersList.find((item) => item.id === formData.value!.customerId)
  return customer?.shortName || customer?.name || '-'
})

const printDate = computed(() => formatDate(new Date()))

type StructureInfoItem = {
  structureId: number | null
  structureName: string
  structureNote: string
}

type ShippingPageItem = {
  pageKey: string
  curtainIdx: number
  totalCurtains: number
  curtainId: number | null
  structureId: number | null
  structureIds: number[]
  setNoText: string
  room: string
  structureInfos: StructureInfoItem[]
}

/** 结构发货页：支持按窗帘合并结构或整单合并发货 */
const shippingPages = computed<ShippingPageItem[]>(() => {
  const curtains = (formData.value as (SalesOrder & { curtains?: any[] }) | null)?.curtains || []
  const pages: ShippingPageItem[] = []

  if (shippingType.value === 'order') {
    pages.push({
      pageKey: 'order-merged',
      curtainIdx: 0,
      totalCurtains: curtains.length,
      curtainId: null,
      structureId: null,
      structureIds: [],
      setNoText: '',
      room: '',
      structureInfos: []
    })
    return pages
  }

  curtains.forEach((curtain, curtainIdx) => {
    const structures = curtain?.structures || []
    const structureInfos: StructureInfoItem[] = structures.map((structure: any) => ({
      structureId: typeof structure?.id === 'number' ? structure.id : null,
      structureName: structure?.structureName || '-',
      structureNote: structure?.note || '-'
    }))
    if (!structureInfos.length) return
    pages.push({
      pageKey: `curtain-${curtainIdx}`,
      curtainIdx,
      totalCurtains: curtains.length,
      curtainId: typeof curtain?.id === 'number' ? curtain.id : null,
      structureId: null,
      structureIds: structureInfos.filter((item) => item.structureId !== null).map((item) => item.structureId as number),
      setNoText: `第${curtainIdx + 1}套/共${curtains.length}套`,
      room: curtain?.room || '-',
      structureInfos
    })
  })
  return pages
})

// ======================== 工具函数 ========================
/** 统一输出 yyyy-MM-dd，避免不同浏览器本地化差异 */
const formatDate = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** 根据当前发货模式重新生成二维码 */
const generateStructureQrCodes = async (data: SalesOrder) => {
  structureQrCodes.value = {}
  for (const page of shippingPages.value) {
    const codeContent = JSON.stringify(
      shippingType.value === 'order'
        ? {
            orderId: data.id ?? null,
            customerId: data.customerId ?? null
          }
        : {
            orderId: data.id ?? null,
            customerId: data.customerId ?? null,
            curtainId: page.curtainId,
            structureId: page.structureId,
            structureIds: page.structureIds
          }
    )
    const codeId = await BarcodeRegistryApi.create({
      codeType: 'ORDER_CURTAIN_SHIP_QR',
      targetRoute: '/pages-curtain/ship/index',
      codeContent
    })
    const url = await QRCode.toDataURL(codeId, { width: 150, margin: 1 })
    structureQrCodes.value[page.pageKey] = { url, code: codeId }
  }
}

// ======================== 对外方法 ========================
/**
 * 打开预览弹窗，注册并生成发货二维码
 * 二维码内容保留订单维度信息，便于后续按单追溯发货记录
 */
  const open = async (data: SalesOrder) => {
  shippingType.value = 'order'
  formData.value = data
  // 发货联需要展示订单当前关联品牌的最新联系方式
  brandDetail.value = data.brandId ? await BrandApi.getBrand(data.brandId) : null
  visible.value = true
  await generateStructureQrCodes(data)
}

defineExpose({ open })

watch(shippingType, async () => {
  if (!visible.value || !formData.value) return
  await generateStructureQrCodes(formData.value)
})

// ======================== 打印 ========================
/** 在新窗口生成发货联 HTML，尺寸与加工单保持一致（100mm × 120mm） */
const handlePrint = () => {
  if (!formData.value) return
  const data = formData.value
  const pagesHtml = shippingPages.value
    .map(
      (page) => {
        const qrEntry = structureQrCodes.value[page.pageKey]
        const structureInfoHtml = page.structureInfos
          .map((item) => `${item.structureName} | 备注：${item.structureNote}`)
          .join('<br/>')
        const qrHtml = qrEntry
          ? `<img src="${qrEntry.url}" width="108" height="108" style="display:block;margin:0 auto;" />`
          : `<div style="width:108px;height:108px;border:1px dashed #bbb;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:13px;">二维码</div>`
        const setNoHtml = shippingType.value !== 'order' ? `<div style="padding:2px 0;font-size:15px;">${page.setNoText}</div>` : ''
        const roomHtml = shippingType.value !== 'order' ? `<div style="padding:2px 0;font-size:15px;">房间：${page.room}</div>` : ''
        const statusHtml = shippingType.value === 'order' ? `<div style="padding:2px 0;font-size:15px;">合并发货/共${page.totalCurtains}套</div>` : ''
        const structureRowHtml = shippingType.value !== 'order'
          ? `<tr><td style="border:1px solid #4B5563;padding:5px 7px;color:#111;font-size:12pt;font-weight:700;vertical-align:top;">结构信息</td><td style="border:1px solid #4B5563;padding:5px 7px;font-weight:bold;word-break:break-all;line-height:1.5;">${structureInfoHtml}</td></tr>`
          : ''
        return `
  <div class="page">
    <div style="margin-bottom:3px;">
      <div style="font-size:20px;letter-spacing:2px;text-align:center;margin-bottom:3px;line-height:1.2;font-weight:700;">${brandName.value ? brandName.value + ' ' : ''}发货联</div>
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <div style="flex:1;min-width:0;">
          <div style="padding:2px 0;font-size:15px;">订单号：${data.orderNo || '-'}</div>
          ${setNoHtml}
          ${roomHtml}
          ${statusHtml}
        </div>
        <div style="width:123px;flex-shrink:0;text-align:center;">${qrHtml}</div>
      </div>
    </div>
    <div style="border-top:1px solid #ccc;margin:3px 0 4px;"></div>
    <table style="width:100%;border-collapse:collapse;border:2px solid #111827;background:#F9FAFB;color:#374151;font-size:11pt;">
      <tbody>
        <tr><td style="border:1px solid #4B5563;padding:5px 7px;width:30%;color:#111;font-size:12pt;font-weight:700;">客户名称</td><td style="border:1px solid #4B5563;padding:5px 7px;font-weight:bold;">${customerName.value}</td></tr>
        <tr><td style="border:1px solid #4B5563;padding:5px 7px;width:34%;color:#111;font-size:12pt;font-weight:700;">收货人/电话</td><td style="border:1px solid #4B5563;padding:5px 7px;font-weight:bold;">${data.receiver || '-'}：${data.mobile || '-'}</td></tr>
        <tr><td style="border:1px solid #4B5563;padding:5px 7px;color:#111;font-size:12pt;font-weight:700;">物流方式</td><td style="border:1px solid #4B5563;padding:5px 7px;font-weight:bold;">${logisticsName.value}</td></tr>
        <tr><td style="border:1px solid #4B5563;padding:5px 7px;color:#111;font-size:12pt;font-weight:700;vertical-align:top;">收货地址</td><td style="border:1px solid #4B5563;padding:5px 7px;font-weight:bold;word-break:break-all;">${data.deliveryAddress || '-'}</td></tr>
        ${structureRowHtml}
      </tbody>
    </table>
    ${data.note ? `<div style="margin-top:4px;padding:4px 8px;font-size:11pt;border:1px solid #D1D5DB;background:#FFFBEB;"><span style="color:#111;font-weight:700;font-size:12pt;">订单备注：</span>${data.note}</div>` : ''}
    <div style="border:3px solid #1D4ED8;background:#EFF6FF;padding:4px 8px;margin-top:4px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
      <span style="font-size:12pt;color:#111;font-weight:700;white-space:nowrap;">发货信息确认联</span>
      <span style="font-size:12pt;white-space:nowrap;color:#111;font-weight:700;"><span style="font-size:10pt;color:#111;font-weight:700;">打印日期：</span>${printDate.value}</span>
    </div>
    <div style="margin-top:6px;font-size:10pt;line-height:1.5;color:#555;">品牌电话：${brandDetail.value?.mobile || '-'}<br>品牌地址：${brandDetail.value?.address || '-'}</div>
  </div>`
      }
    )
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${brandName.value ? brandName.value + ' ' : ''}发货联 - ${data.orderNo || ''}</title>
  <style>
    @page { size: 100mm 120mm; margin: 0mm; }
    html, body { margin: 0; padding: 0; }
    * { box-sizing: border-box; font-family: 'SimHei', '黑体', 'Microsoft YaHei', '微软雅黑', sans-serif; font-weight: normal; }
    body { color: #1a1a1a; font-size: 13pt; line-height: 1.6; }
    b, strong { font-weight: normal; }
    .page { page-break-after: always; page-break-inside: avoid; overflow: hidden; padding: 3px 14px 12px; width: 100mm; height: 120mm; box-sizing: border-box; font-size: 17px; box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 4px #f00; }
    .page:last-child { page-break-after: auto; }
  </style>
</head>
<body>
  ${pagesHtml || '<div class="page"><div style="padding:8mm;text-align:center;color:#9CA3AF;">暂无结构数据</div></div>'}
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
  }, 300)
}
</script>
