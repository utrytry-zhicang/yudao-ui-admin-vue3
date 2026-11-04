<!--
  客户发货联打印预览弹窗
  功能：按客户信息生成发货联，右上角显示发货二维码（不包含订单号、订单ID）
  页面尺寸：宽100mm × 高120mm，预览与打印尺寸一致
  使用方：views/zc/customer/index.vue、CustomerSearchDialog.vue
-->
<template>
  <el-dialog
    v-model="visible"
    width="660px"
    top="6vh"
    append-to-body
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span class="text-base font-semibold">发货联预览</span>
        <div class="flex gap-8px mr-24px">
          <el-button type="primary" @click="handlePrint">
            <Icon icon="ep:printer" class="mr-4px" />打印
          </el-button>
        </div>
      </div>
    </template>

    <!-- 预览区：宽100mm × 高120mm，与打印页面尺寸一致 -->
    <div style="background: #e8e8e8; padding: 20px; display: flex; justify-content: center;">
      <div
        style="
          background: white;
          width: 100mm;
          height: 120mm;
          padding: 24px 28px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.18);
          font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
          color: #1a1a1a;
          box-sizing: border-box;
          border: 1px solid #ddd;
          overflow: hidden;
        "
      >
        <!-- 抬头：品牌 + 发货联 + 右上角二维码 -->
        <div style="display: flex; align-items: flex-start; margin-bottom: 9px; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px;">
          <div style="flex: 1; min-width: 0;">
            <div style="text-align: center;">
              <div style="font-size: 21px; font-weight: 700; letter-spacing: 2px; margin-top: 4px; line-height: 1.1;">
                发货联
              </div>
              <div style="font-size: 16px; font-weight: 800; letter-spacing: 3px; line-height: 1.1; margin-top: 4px;">
                {{ slipData.brandName || '-' }}
              </div>
            </div>
          </div>
          <div style="width: 108px; flex-shrink: 0; padding-left: 8px; text-align: center;">
            <template v-if="shippingQrCode">
              <img :src="shippingQrCode.url" width="96" height="96" style="display: block; margin: 0 auto;" />
            </template>
            <div
              v-else
              style="width: 96px; height: 96px; border: 1px dashed #bbb; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 10px;"
            >二维码</div>
          </div>
        </div>

        <!-- 信息列表 -->
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.6;">
          <tbody>
            <tr>
              <td style="color: #666; white-space: nowrap; padding-right: 4px; width: 80px;">客户名称</td>
              <td style="font-weight: 600;">{{ slipData.customerName || '-' }}</td>
            </tr>
            <tr>
              <td style="color: #666; white-space: nowrap; padding-right: 4px; width: 80px;">物流</td>
              <td style="font-weight: 600;">{{ slipData.logisticsName || '-' }}</td>
            </tr>
            <tr>
              <td style="color: #666; white-space: nowrap; padding-right: 4px; width: 80px;">收货人</td>
              <td style="font-weight: 600;">{{ slipData.receiver || '-' }}</td>
            </tr>
            <tr>
              <td style="color: #666; white-space: nowrap; padding-right: 4px; width: 80px;">电话</td>
              <td style="font-weight: 600;">{{ slipData.mobile || '-' }}</td>
            </tr>
            <tr>
              <td style="color: #666; white-space: nowrap; padding-right: 4px; width: 80px; vertical-align: top; padding-top: 3px;">收货地址</td>
              <td style="font-weight: 600; word-break: break-all;">{{ slipData.deliveryAddress || '-' }}</td>
            </tr>
            <tr>
              <td style="color: #666; white-space: nowrap; padding-right: 4px; width: 80px;">打印日期</td>
              <td style="font-weight: 600;">{{ slipData.printDate }}</td>
            </tr>
            <tr>
              <td style="color: #666; white-space: nowrap; padding-right: 4px; width: 80px;">品牌电话</td>
              <td style="font-weight: 600;">{{ slipData.brandMobile || '-' }}</td>
            </tr>
            <tr>
              <td style="color: #666; white-space: nowrap; padding-right: 4px; width: 80px; vertical-align: top;">品牌地址</td>
              <td style="font-weight: 600; word-break: break-all;">{{ slipData.brandAddress || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
// ======================== 导入与声明 ========================
import QRCode from 'qrcode'
import { BarcodeRegistryApi } from '@/api/zc/barcodeRegistry'
import { BrandApi } from '@/api/zc/brand'
import type { Customer } from '@/api/zc/customer'

/** 客户发货联打印预览弹窗 */
defineOptions({ name: 'CustomerShippingPrintDialog' })

// ======================== 类型定义 ========================
interface SlipData {
  customerId: number | null
  customerName: string
  brandName: string
  brandMobile: string
  brandAddress: string
  logisticsName: string
  receiver: string
  mobile: string
  deliveryAddress: string
  printDate: string
}

// ======================== 响应式状态 ========================
const visible = ref(false)
/** 发货联二维码（右上角展示） */
const shippingQrCode = ref<{ url: string; code: string } | null>(null)
const slipData = ref<SlipData>({
  customerId: null,
  customerName: '',
  brandName: '',
  brandMobile: '',
  brandAddress: '',
  logisticsName: '',
  receiver: '',
  mobile: '',
  deliveryAddress: '',
  printDate: ''
})

// ======================== 辅助函数 ========================
const todayStr = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ======================== 对外方法 ========================
/** 打开预览弹窗，传入客户行数据 */
const open = async (data: Customer) => {
  const brand = data.brandId ? await BrandApi.getBrand(data.brandId) : null
  slipData.value = {
    customerId: data.id ?? null,
    customerName: data.shortName || data.name || '-',
    brandName: data.brandName || '-',
    brandMobile: brand?.mobile || '-',
    brandAddress: brand?.address || '-',
    logisticsName: data.logisticName || '-',
    receiver: data.contactName || '-',
    mobile: data.mobile || '-',
    deliveryAddress: data.deliveryAddress || '-',
    printDate: todayStr()
  }

  // 客户发货码仅包含客户维度信息，不传订单号、订单ID
  shippingQrCode.value = null
  const codeContent = JSON.stringify({
    customerId: data.id ?? null,
    customerName: data.shortName || data.name || ''
  })
  const codeId = await BarcodeRegistryApi.create({
    codeType: 'SHIP_QR',
    targetRoute: '/pages-curtain/ship/index',
    codeContent
  })
  const url = await QRCode.toDataURL(codeId, { width: 160, margin: 1 })
  shippingQrCode.value = { url, code: codeId }
  visible.value = true
}
defineExpose({ open })

// ======================== 打印 ========================
/** 在新窗口生成发货联 HTML 并触发打印对话框（页面尺寸 100mm × 120mm） */
const handlePrint = () => {
  const d = slipData.value
  const qrImg = shippingQrCode.value
    ? `<img src="${shippingQrCode.value.url}" width="96" height="96" style="display:block;margin:0 auto;" />`
    : `<div style="width:96px;height:96px;border:1px dashed #bbb;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:8pt;">二维码</div>`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${d.brandName || ''} 发货联</title>
  <style>
    @page { size: 100mm 120mm; margin: 0mm; }
    html, body { margin: 0; padding: 0; }
    * { box-sizing: border-box; font-family: 'Microsoft YaHei', '微软雅黑', Arial, sans-serif; }
    body { color: #1a1a1a; font-size: 13pt; }
    .page {
      page-break-after: always;
      page-break-inside: avoid;
      overflow: hidden;
      padding: 24px 28px;
      width: 100mm;
      height: 120mm;
      box-sizing: border-box;
    }
    .page:last-child { page-break-after: auto; }
    .header {
      display: flex;
      align-items: flex-start;
      border-bottom: 2pt solid #1a1a1a;
      padding-bottom: 10pt;
      margin-bottom: 6pt;
    }
    .header-main { flex: 1; min-width: 0; }
    .header-title-wrap { text-align: center; }
    .header-brand {
      font-size: 17pt;
      font-weight: 800;
      letter-spacing: 4pt;
      line-height: 1.1;
    }
    .header-title {
      font-size: 22pt;
      font-weight: 700;
      letter-spacing: 3pt;
      line-height: 1.1;
      margin-top: 4pt;
    }
    .header-qr { width: 104pt; flex-shrink: 0; padding-left: 8pt; text-align: center; }
    table { width: 100%; border-collapse: collapse; font-size: 13pt; line-height: 1.65; }
    td.lbl { color: #555; white-space: nowrap; padding-right: 5pt; width: 75pt; }
    td.val { font-weight: 600; word-break: break-all; }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-main">
      <div class="header-title-wrap">
        <div class="header-title">发货联</div>
        <div class="header-brand">${d.brandName || '-'}</div>
      </div>
    </div>
    <div class="header-qr">${qrImg}</div>
  </div>
  <table>
    <tbody>
      <tr><td class="lbl">客户名称</td><td class="val">${d.customerName || '-'}</td></tr>
      <tr><td class="lbl">物流</td><td class="val">${d.logisticsName || '-'}</td></tr>
      <tr><td class="lbl">收货人</td><td class="val">${d.receiver || '-'}</td></tr>
      <tr><td class="lbl">电话</td><td class="val">${d.mobile || '-'}</td></tr>
      <tr><td class="lbl" style="vertical-align:top;padding-top:3pt;">收货地址</td><td class="val">${d.deliveryAddress || '-'}</td></tr>
      <tr><td class="lbl">打印日期</td><td class="val">${d.printDate}</td></tr>
      <tr><td class="lbl">品牌电话</td><td class="val">${d.brandMobile || '-'}</td></tr>
      <tr><td class="lbl" style="vertical-align:top;">品牌地址</td><td class="val">${d.brandAddress || '-'}</td></tr>
    </tbody>
  </table>
</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=480,height=640')
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
