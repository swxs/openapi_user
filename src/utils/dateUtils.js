export function getDateFormat(dateString) {
  const date = new Date(Date.parse(dateString))
  return date.toLocaleString('zh-cn', { dateStyle: 'long' })
}
