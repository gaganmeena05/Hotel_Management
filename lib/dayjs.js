import _dayjs from 'dayjs';
const dayjs=_dayjs;
import relativeTime from 'dayjs/plugin/relativeTime'
import isBetween from 'dayjs/plugin/isBetween'
dayjs.extend(relativeTime)
dayjs.extend(isBetween)
export {dayjs};