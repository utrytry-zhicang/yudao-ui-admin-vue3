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

/** 指定时间范围内的员工节点用料统计 VO */
export interface ZcOrderProcessRecordUserMaterialRespVO {
  masterId: number
  masterName: string
  nodeStats: NodeStatItem[]
}

/** 订单工序记录 API */
export const OrderProcessRecordApi = {
  /**
   * 获取指定时间范围内所有员工对应节点的用料统计
   * GET /zc/order-process-record/today-user-material-stat
   */
  getUserMaterialStat: async (params: {
    beginCreateTime: string // 统计开始时间，格式：YYYY-MM-DD HH:mm:ss
    endCreateTime: string // 统计结束时间，格式：YYYY-MM-DD HH:mm:ss
  }) => {
    return await request.get<ZcOrderProcessRecordUserMaterialRespVO[]>({
      url: `/zc/order-process-record/today-user-material-stat`,
      params
    })
  }
}
