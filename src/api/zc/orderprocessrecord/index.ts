import request from '@/config/axios'

/** 组件用料统计 */
export interface MaterialStatItem {
  elementId: number
  elementName: string
  processCount: number
  totalQuantity: number
}

/** 节点用料统计 */
export interface NodeStatItem {
  nodeId: number
  nodeName: string
  materials: MaterialStatItem[]
}

/** 当日员工节点用料统计 VO */
export interface ZcOrderProcessRecordTodayUserMaterialRespVO {
  masterId: number
  masterName: string
  nodeStats: NodeStatItem[]
}

/** 订单工序记录 API */
export const OrderProcessRecordApi = {
  /**
   * 获取当日所有员工对应节点的用料统计
   * GET /zc/order-process-record/today-user-material-stat
   */
  getTodayUserMaterialStat: async (params?: {
    beginCreateTime?: string
    endCreateTime?: string
  }) => {
    return await request.get<ZcOrderProcessRecordTodayUserMaterialRespVO[]>({
      url: `/zc/order-process-record/today-user-material-stat`,
      params
    })
  }
}
