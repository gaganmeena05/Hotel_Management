import * as dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import isBetween from 'dayjs/plugin/isBetween'
dayjs.extend(relativeTime)
dayjs.extend(isBetween)
export {dayjs};