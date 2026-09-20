import request from '@/config/axios'
import type { Dayjs } from 'dayjs';

/** 销售订单类型枚举 */
export enum SalesOrderType {
  /** 面料单：直接购买产品批次，无工艺配置 */
  FABRIC = 'FABRIC',
  /** 成品单：包含窗帘工艺配置的完整订单 */
  CURTAIN = 'CURTAIN'
}

/** 窗帘用料（结构下的组件用料） */
export interface ZCSalesOrderMaterial {
  id?: number               // 主键
  orderId?: number          // 所属订单 ID
  orderStructureId?: number // 所属订单结构 ID
  elementId?: number        // 组件类型 ID
  productId?: number        // 货号（产品 ID）
  batchId?: number          // 批次 ID
  spec?: string             // 规格（创建/更新/详情统一字段）
  price?: number            // 单价
  quantity?: number         // 用料数量
  unitValue?: string        // 计量单位（展示值）
  discountRate?: number     // 折扣率
  amount?: number           // 小计金额
  note?: string             // 备注
  // —— 仅展示用（后端返回，前端不回传）
  status?: string           // 配料状态：NOT_PEILIAO=未配料，HAVE_PEILIAO=已裁剪
  elementName?: string      // 组件类型名称
  productName?: string      // 货号名称
  batchNo?: string          // 批次号
  elementIsCalMaterial?: boolean // 组件是否计算用料（用于统计窗帘布用料合计）
}

/** 窗帘行信息 */
export interface SalesOrderCurtain {
  id?: number
  orderId?: number
  curtainId?: number
  room?: string
  pleatRatioValue?: string | number
  pleatsDistance?: number
  discountRate?: number
  amount?: number
  image1?: string
  image2?: string
  /** 配件，前端用数组；后端可能返回 JSON 字符串，需手动 parse */
  mountings?: string[]
  note?: string
  quantity?: number         // 窗帘数量
  /** 仅展示用 */
  curtainName?: string
}
/** 窗帘结构信息 */
export interface SalesOrderStructure {
  id?: number
  orderId?: number
  orderCurtainId?: number
  structureId?: number
  height?: number
  width?: number
  leftCorner?: string
  rightCorner?: string
  pasteDirection?: string
  installProcessId?: number
  openMethod?: string
  processType?: string
  /** 对应库字段 is_shaping，与后端保持驼峰命名 */
  isShaping?: boolean
  pleatsNum?: number
  pleatsDistance?: number
  skirtHeight?: number
  note?: string
  /** 仅展示用 */
  structureName?: string
  installProcessName?: string
}

/** 销售订单信息 */
export interface SalesOrder {
  id?: number                          // 主键
  orderNo?: string                     // 订单号
  customerId?: number                  // 客户 ID
  mobile?: string                      // 手机
  brandId?: number                     // 品牌
  orderDate?: string | Dayjs           // 下单日期
  logisticId?: number                  // 物流 ID（匹配列表时有值，自定义名称时为 null）
  logisticName?: string                // 物流名称（可手输；logisticId 为空时后端按名称查找或创建）
  receiver?: string                    // 收货人
  deliveryAddress?: string             // 送货地址
  freight?: number                     // 运费
  types?: string                       // 订单类型
  discountAmount?: number              // 优惠金额
  totalAmount?: number                 // 总金额
  amount?: number                      // 实际应收金额（四舍五入后的订单金额）
  rounding?: number                    // 四舍五入差额（舍去为负，入位为正）
  amountReceived?: number              // 已收金额
  deliveryDate?: string | Dayjs        // 交付日期
  payStatus?: string                   // 结算状态
  status?: string                      // 状态
  confirmTime?: string | Dayjs | number// 确认时间
  isExpedited?: boolean                // 是否加急
  note?: string                        // 备注
  // —— 仅展示用
  customerName?: string
  creatorName?: string
  createTime?: number
  currentNodeName?: string              // 当前工序名称快照（订单推进工序时更新）
}

/** 销售订单详情：窗帘 → 结构 → 用料 三层嵌套 */
export interface SalesOrderDetailCurtain extends SalesOrderCurtain {
  structures?: (SalesOrderStructure & { materials?: ZCSalesOrderMaterial[] })[]
}

/** 销售订单完整详情响应 VO（主表信息 + 窗帘→结构→用料 三层嵌套） */
export interface ZcSalesOrderDetailRespVO extends SalesOrder {
  curtains: SalesOrderDetailCurtain[]
}

/** 整单创建/更新 - 用料明细提交 VO */
export interface ZcSalesOrderMaterialSubmitVO {
  id?: number
  elementId?: number
  productId?: number
  batchId?: number
  spec?: string
  price?: number
  quantity?: number
  unitValue?: string
  discountRate?: number
  amount?: number
  note?: string
}

/** 整单创建/更新 - 结构行提交 VO */
export interface ZcSalesOrderStructureSubmitVO {
  id?: number
  structureId?: number
  height?: number
  width?: number
  leftCorner?: string
  rightCorner?: string
  pasteDirection?: string
  installProcessId?: number
  openMethod?: string
  processType?: string
  isShaping?: boolean
  pleatsNum?: number
  pleatsDistance?: number
  skirtHeight?: number
  note?: string
  materials?: ZcSalesOrderMaterialSubmitVO[]
}

/** 整单创建/更新 - 窗帘行提交 VO */
export interface ZcSalesOrderCurtainSubmitVO {
  id?: number
  curtainId?: number
  room?: string
  pleatRatioValue?: string | number
  pleatsDistance?: number
  discountRate?: number
  amount?: number
  image1?: string
  image2?: string
  mountings?: string[]
  note?: string
  quantity?: number         // 窗帘数量
  structures?: ZcSalesOrderStructureSubmitVO[]
}

/** 整单创建/更新 Request VO（对应 POST /create、PUT /update） */
export interface ZcSalesOrderSubmitReqVO {
  id?: number
  customerId?: number
  mobile?: string
  brandId?: number
  orderDate?: string | Dayjs
  logisticId?: number
  logisticName?: string                // 物流名称；logisticId 为空时后端按名称查找或自动创建
  receiver?: string
  deliveryAddress?: string
  freight?: number
  types?: string
  discountAmount?: number
  totalAmount?: number
  amount?: number
  rounding?: number                    // 四舍五入差额（舍去为负，入位为正）
  deliveryDate?: string | Dayjs
  note?: string
  curtains?: ZcSalesOrderCurtainSubmitVO[]
}

/** 按客户统计已确认订单响应 VO */
export interface ZcSalesOrderCustomerStatisticsRespVO {
  customerId: number // 客户编号
  customerName: string // 客户名称
  orderCount: number // 订单数
  totalAmount: number // 订单金额合计（amount 字段求和）
  totalAmountReceived: number // 已收金额合计（amount_received 字段求和）
  unpaidAmount: number // 未收金额合计（各订单 amount - amount_received 求和）
}

/** 按产品规格统计已确认订单用料响应 VO */
export interface ZcSalesOrderMaterialProductStatisticsRespVO {
  productId: number // 产品编号（货号）
  productName: string // 产品名称
  spec: string // 规格
  quantity: number // 用料数量合计
  unitValue: string // 单位
}

// 销售订单 API
export const SalesOrderApi = {
  // 查询销售订单分页
  getSalesOrderPage: async (params: any) => {
    return await request.get({ url: `/zc/sales-order/page`, params })
  },

  // 查询销售订单详情
  getSalesOrder: async (id: number) => {
    return await request.get({ url: `/zc/sales-order/get?id=` + id })
  },

  /**
   * 获取销售订单完整详情（主表信息 + 窗帘→结构→用料 三层嵌套）
   * 对应后端：GET /zc/sales-order/detail?id=xxx
   *
   * @param id 销售订单 ID
   * @returns 完整订单详情（含 curtains 三层嵌套）
   */
  getSalesOrderDetail: async (id: number): Promise<ZcSalesOrderDetailRespVO> => {
    return await request.get({ url: `/zc/sales-order/detail`, params: { id } })
  },

  /**
   * 获得销售订单工序记录详情（完整窗帘结构 + 各层工序记录）
   * 对应后端：GET /zc/sales-order/process-record
   */
  getSalesOrderProcessRecordDetail: async (
    params: ZcSalesOrderProcessRecordDetailReqVO
  ): Promise<ZcSalesOrderProcessRecordDetailRespVO> => {
    const { groups = '1', ...rest } = params
    return await request.get({
      url: `/zc/sales-order/process-record`,
      params: { ...rest, groups }
    })
  },

  // 整单新增销售订单（含窗帘行→结构行→用料明细）
  createSalesOrder: async (data: ZcSalesOrderSubmitReqVO) => {
    return await request.post({ url: `/zc/sales-order/create`, data })
  },

  // 新增面单（类型固定 FABRIC，curtainId/structureId 可为空）
  // 对应后端：POST /zc/sales-order/fabric/create
  createSalesOrderFabric: async (data: any) => {
    return await request.post({ url: `/zc/sales-order/fabric/create`, data })
  },

  // 更新面单（已确认订单禁止修改）
  // 对应后端：PUT /zc/sales-order/fabric/update
  updateSalesOrderFabric: async (data: any) => {
    return await request.put({ url: `/zc/sales-order/fabric/update`, data })
  },

  // 整单更新销售订单（含窗帘行→结构行→用料明细，已确认订单禁止修改）
  updateSalesOrder: async (data: ZcSalesOrderSubmitReqVO) => {
    return await request.put({ url: `/zc/sales-order/update`, data })
  },

  // 删除销售订单
  deleteSalesOrder: async (id: number) => {
    return await request.delete({ url: `/zc/sales-order/delete?id=` + id })
  },

  /**
   * 确认销售订单（状态 unconfirmed → confirmed，扣减客户余额）
   * 对应后端：PUT /zc/sales-order/confirm?id=xxx
   *
   * @param id 销售订单 ID
   * @returns 是否成功
   */
  confirmSalesOrder: async (id: number) => {
    return await request.put({ url: `/zc/sales-order/confirm`, params: { id } })
  },

  /**
   * 取消确认销售订单（状态 confirmed → unconfirmed，退回客户余额）
   * 对应后端：PUT /zc/sales-order/cancel-confirm?id=xxx
   *
   * @param id 销售订单 ID
   * @returns 是否成功
   */
  cancelConfirmSalesOrder: async (id: number) => {
    return await request.put({ url: `/zc/sales-order/cancel-confirm`, params: { id } })
  },

  /**
   * 废弃销售订单
   * 对应后端：PUT /zc/sales-order/discard?id=xxx
   *
   * @param id 销售订单 ID
   * @returns 是否成功
   */
  discardSalesOrder: async (id: number) => {
    return await request.put({ url: `/zc/sales-order/discard`, params: { id } })
  },

  /**
   * 标记销售订单为加急
   * 对应后端：PUT /zc/sales-order/expedited?orderId=xxx
   *
   * @param orderId 销售订单 ID
   * @returns 是否成功
   */
  expeditedSalesOrder: async (orderId: number) => {
    return await request.put({ url: `/zc/sales-order/expedited`, params: { orderId } })
  },

  /**
   * 取消销售订单加急
   * 对应后端：PUT /zc/sales-order/cancel-expedited?orderId=xxx
   *
   * @param orderId 销售订单 ID
   * @returns 是否成功
   */
  cancelExpeditedSalesOrder: async (orderId: number) => {
    return await request.put({ url: `/zc/sales-order/cancel-expedited`, params: { orderId } })
  },

  // 导出销售订单 Excel
  exportSalesOrder: async (params) => {
    return await request.download({ url: `/zc/sales-order/export-excel`, params })
  },

  /**
   * 导出销售订单 PDF（含全量明细：窗帘行→结构行→用料明细）
   * 对应后端：GET /zc/sales-order/export-pdf
   *
   * @param id 销售订单 ID
   * @returns PDF 文件 Blob
   */
  exportSalesOrderPdf: async (id: number): Promise<Blob> => {
    return await request.download({ url: `/zc/sales-order/export-pdf`, params: { id } })
  },

  /**
   * 按客户统计已确认订单（指定确认时间范围内，汇总各客户订单数与订单金额）
   * 对应后端：GET /zc/sales-order/statistics/customer
   *
   * @param confirmTime 确认时间范围 [开始, 结束]，含边界
   */
  getCustomerStatistics: async (
    confirmTime: [string, string]
  ): Promise<ZcSalesOrderCustomerStatisticsRespVO[]> => {
    return await request.get({
      url: `/zc/sales-order/statistics/customer`,
      params: { confirmTime }
    })
  },

  /**
   * 按产品规格统计已确认订单用料（product_id 不为空，按 product_id + spec 汇总 quantity）
   * 对应后端：GET /zc/sales-order/statistics/material-product
   *
   * @param confirmTime 确认时间范围 [开始, 结束]，含边界
   */
  getMaterialProductStatistics: async (
    confirmTime: [string, string]
  ): Promise<ZcSalesOrderMaterialProductStatisticsRespVO[]> => {
    return await request.get({
      url: `/zc/sales-order/statistics/material-product`,
      params: { confirmTime }
    })
  },

  /**
   * 获得今日需要发货的客户数
   * 对应后端：GET /zc/sales-order/today-delivery-customer-count
   */
  getTodayDeliveryCustomerCount: async (): Promise<number> => {
    return await request.get({ url: `/zc/sales-order/today-delivery-customer-count` })
  }
}

// ======================== 面料单 ========================

/** 面料单 - 批次行提交/响应结构 */
export interface SalesOrderProductBatch {
  id?: number           // 产品行 ID（编辑时回传，用于后端区分新增/更新）
  productId?: number    // 产品 ID
  productName?: string  // 产品名称（仅展示用，后端返回）
  batchId?: number      // 批次 ID
  batchNo?: string      // 批次号（仅展示用，后端返回）
  quantity?: number     // 数量
  price?: number        // 单价
  amount?: number       // 金额
  note?: string         // 备注
}

/** 面料单提交/响应数据结构 */
export interface SalesOrderProductVO {
  id?: number
  orderNo?: string
  customerId?: number
  customerName?: string  // 客户名称（仅展示用）
  mobile?: string
  brandId?: number
  orderDate?: string
  logisticId?: number
  logisticName?: string  // 物流名称（仅展示用）
  receiver?: string
  deliveryAddress?: string
  freight?: number
  types?: string
  discountAmount?: number
  totalAmount?: number   // 总金额
  amount?: number        // 订单金额（总金额 - 优惠）
  amountReceived?: number // 已收金额
  deliveryDate?: string
  payStatus?: string
  status?: string
  confirmTime?: string | number
  isExpedited?: boolean
  note?: string
  createTime?: string    // 创建时间
  batchs: SalesOrderProductBatch[]
}

// ======================== 工序记录 ========================

/** 订单工序记录响应 VO */
export interface ZcOrderProcessRecordRespVO {
  id: number               // 主键
  orderId: number          // 销售订单 ID
  orderNo: string          // 订单号
  curtainName: string      // 窗帘款式名称
  room: string             // 房间
  structureName: string    // 结构名称
  elementName: string      // 用料元素名称
  curtainId: number        // 窗帘行 ID
  structureId: number      // 结构行 ID
  materialId: number       // 用料明细 ID
  nodeId: number           // 工序节点 ID
  nodeName: string         // 工序名称（快照）
  nodeGroup: number        // 工序节点分组：0=系统配置，1=手工配置
  status: number           // 状态：1=完成，2=撤销
  masterId: number         // 主操作人员 ID
  masterName: string       // 主操作人员名称
  assistantId: number      // 副操作人员 ID
  assistantName: string    // 副操作人员名称
  note: string             // 备注
  imageUrls: string[]      // 现场照片 URL 列表
  createTime: string       // 记录创建时间
  updateTime: string       // 最后更新时间（撤销时更新）
}

/** 用料明细（含工序记录） */
export interface ZcSalesOrderMaterialProcessRecordRespVO extends ZCSalesOrderMaterial {
  cutQuantity?: number       // 裁剪数量
  barcode?: string           // 批次条码
  elementIsPrint?: boolean   // 组件是否打印
  createTime?: string        // 创建时间
  processRecords?: ZcOrderProcessRecordRespVO[] // 用料级工序记录，按创建时间升序
}

/** 结构行（含工序记录） */
export interface ZcSalesOrderStructureProcessRecordRespVO extends SalesOrderStructure {
  createTime?: string        // 创建时间
  processRecords?: ZcOrderProcessRecordRespVO[] // 结构级工序记录，按创建时间升序
  materials?: ZcSalesOrderMaterialProcessRecordRespVO[] // 用料明细列表
}

/** 窗帘行（含工序记录） */
export interface ZcSalesOrderCurtainProcessRecordRespVO extends SalesOrderCurtain {
  status?: string            // 窗帘行状态
  index?: number             // 序号
  packTime?: string          // 打包时间
  shipTime?: string          // 发货时间
  createTime?: string        // 创建时间
  processRecords?: ZcOrderProcessRecordRespVO[] // 窗帘级工序记录，按创建时间升序
  structures?: ZcSalesOrderStructureProcessRecordRespVO[] // 结构行列表
}

/** 销售订单工序记录详情响应 VO */
export interface ZcSalesOrderProcessRecordDetailRespVO extends SalesOrder {
  orderRecords?: ZcOrderProcessRecordRespVO[] // 订单级工序记录（未关联窗帘行）
  curtains?: ZcSalesOrderCurtainProcessRecordRespVO[] // 窗帘行列表（完整结构 + 工序记录）
}

/** 工序记录详情查询参数 */
export interface ZcSalesOrderProcessRecordDetailReqVO {
  id?: number                // 销售订单 ID，与 orderNo 二选一
  orderNo?: string           // 销售订单编号，优先级高于 id
  groups?: string            // 工序节点分组：0=系统配置，1=手工配置，逗号分隔，默认 "1"
}

export const SalesOrderProductApi = {
  /**
   * 查询面料单详情（含批次列表）
   * 对应后端：GET /zc/sales-order-product/detail?id=xxx
   */
  getSalesOrderProductDetail: async (id: number) => {
    return await request.get({ url: `/zc/sales-order-product/detail?id=` + id })
  },

  /**
   * 新增面料单
   * 对应后端：POST /zc/sales-order-product/create
   */
  createSalesOrderProduct: async (data: SalesOrderProductVO) => {
    return await request.post({ url: `/zc/sales-order-product/create`, data })
  },

  /**
   * 修改面料单
   * 对应后端：PUT /zc/sales-order-product/update
   */
  updateSalesOrderProduct: async (data: SalesOrderProductVO) => {
    return await request.put({ url: `/zc/sales-order-product/update`, data })
  },

  /**
   * 删除面料单
   * 对应后端：DELETE /zc/sales-order-product/delete?id=xxx
   *
   * @param id 面料单 ID
   */
  deleteSalesOrderProduct: async (id: number) => {
    return await request.delete({ url: `/zc/sales-order-product/delete`, params: { id } })
  }
}
