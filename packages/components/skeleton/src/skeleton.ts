import { buildProps, definePropType } from '@element-plus/utils'

import type Skeleton from './skeleton.vue'
import type { ExtractPropTypes, __ExtractPublicPropTypes } from 'vue'
import type { ThrottleType } from '@element-plus/hooks'

export const skeletonProps = buildProps({
  /**
   * @description whether showing the animation
   */
  animated: Boolean,
  /**
   * @description how many fake items to render to the DOM
   */
  count: {
    type: Number,
    default: 1,
  },
  /**
   * @description whether showing the real DOM
   */
  rows: {
    type: Number,
    default: 3,
  },
  /**
   * @description numbers of the row, only useful when no template slot were given
   */
  loading: {
    type: Boolean,
    default: true,
  },
  /**
   * @description rendering delay in milliseconds
   */
  throttle: {
    type: definePropType<ThrottleType>([Number, Object]),
  },
} as const)
export type SkeletonProps = ExtractPropTypes<typeof skeletonProps>
export type SkeletonPropsPublic = __ExtractPublicPropTypes<typeof skeletonProps>

export type SkeletonInstance = InstanceType<typeof Skeleton> & unknown
