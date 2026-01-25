import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import fs from 'fs/promises'
import path from 'path'

export const POST: APIRoute = async ({ request }) => {
  try {
    const { question, history = [] } = await request.json()

    if (!question) {
      return new Response('问题不能为空', { status: 400 })
    }

    // Get all knowledge items
    const knowledgeItems = await getCollection('knowledge')

    // Simple keyword matching search
    const keywords = question
      .toLowerCase()
      .split(/\s+/)
      .filter((k: string) => k.length > 1)

    // Search through knowledge items
    const relevantItems = knowledgeItems
      .map((item) => {
        const titleMatch = keywords.filter((k: string) =>
          item.data.title.toLowerCase().includes(k),
        ).length
        const summaryMatch = keywords.filter(
          (k: string) => item.data.summary?.toLowerCase().includes(k) || false,
        ).length

        // Calculate relevance score
        const score = titleMatch * 2 + summaryMatch

        return { item, score }
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3) // Get top 3 results

    // Build answer based on relevant items
    let answer = ''

    if (relevantItems.length === 0) {
      answer =
        '抱歉，我在知识库中没有找到相关的信息。您可以尝试：\n\n' +
        '1. 使用不同的关键词重新提问\n' +
        '2. 上传更多相关的知识内容\n' +
        '3. 查看知识库中的所有条目'
    } else {
      answer = '根据您的问题，我找到了以下相关信息：\n\n'

      for (const { item } of relevantItems) {
        answer += `**${item.data.title}**\n`
        if (item.data.summary) {
          answer += `${item.data.summary}\n`
        }
        answer += `\n详细信息请查看：[${item.data.title}](/knowledge/${item.slug})\n\n`
      }

      answer += '如果这些信息不能完全回答您的问题，请尝试更具体的提问或查看详细内容。'
    }

    // Save conversation for learning (in production, this could be saved to a database)
    const conversationDir = path.join(process.cwd(), '.knowledge-conversations')
    try {
      await fs.mkdir(conversationDir, { recursive: true })

      const conversationFile = path.join(
        conversationDir,
        `${new Date().toISOString().split('T')[0]}.jsonl`,
      )

      const conversationEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        question,
        answer,
        relevantItems: relevantItems.map((r) => r.item.slug),
        history: history.slice(-3), // Keep last 3 for context
      })

      await fs.appendFile(conversationFile, conversationEntry + '\n', 'utf-8')
    } catch (e) {
      console.error('Failed to save conversation:', e)
      // Don't fail the request if we can't save conversation
    }

    return new Response(
      JSON.stringify({
        answer,
        sources: relevantItems.map((r) => ({
          title: r.item.data.title,
          slug: r.item.slug,
          summary: r.item.data.summary,
        })),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Query error:', error)
    return new Response(`查询失败: ${error}`, { status: 500 })
  }
}
