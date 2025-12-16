/**
 * AG.NEXUS - RSS 服务
 */

/**
 * 获取 RSS Feed 内容
 */
export async function fetchRssFeed(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const text = await response.text()
    return text
  } catch (error) {
    console.error(`Failed to fetch RSS from ${url}:`, error)
    return ''
  }
}

/**
 * 解析 RSS XML
 */
export function parseRssItems(xml: string): Array<{ title: string; description: string; link: string }> {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const items = Array.from(doc.querySelectorAll('item'))
    
    return items.slice(0, 5).map((item) => ({
      title: item.querySelector('title')?.textContent || '无标题',
      description:
        item
          .querySelector('description')
          ?.textContent?.replace(/<[^>]+>/g, '') // 去除 HTML 标签
          .replace(/\s+/g, ' ') // 压缩空白
          .slice(0, 100) || '', // 截断到100字，避免总字数过长
      link: item.querySelector('link')?.textContent || '',
    }))
  } catch (error) {
    console.error('Failed to parse RSS XML:', error)
    return []
  }
}
