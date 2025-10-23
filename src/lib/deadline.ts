/**
 * 截止时间检查工具
 */

const SUBMISSION_DEADLINE = process.env.SUBMISSION_DEADLINE

/**
 * 检查当前是否已超过截止时间
 * @returns true 表示已截止，false 表示未截止
 */
export function isAfterDeadline(): boolean {
  if (!SUBMISSION_DEADLINE) {
    // 如果没有设置截止时间，则不限制
    return false
  }

  try {
    const deadline = new Date(SUBMISSION_DEADLINE)
    const now = new Date()
    return now > deadline
  } catch (error) {
    console.error('Invalid deadline format:', SUBMISSION_DEADLINE, error)
    return false
  }
}

/**
 * 获取截止时间
 * @returns 截止时间的Date对象，如果未设置则返回null
 */
export function getDeadline(): Date | null {
  if (!SUBMISSION_DEADLINE) {
    return null
  }

  try {
    return new Date(SUBMISSION_DEADLINE)
  } catch (error) {
    console.error('Invalid deadline format:', SUBMISSION_DEADLINE, error)
    return null
  }
}

/**
 * 获取截止时间的字符串表示
 * @returns 格式化的截止时间字符串
 */
export function getDeadlineString(): string | null {
  const deadline = getDeadline()
  if (!deadline) {
    return null
  }

  return deadline.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai'
  })
}
