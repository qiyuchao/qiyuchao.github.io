import type { APIRoute } from 'astro'
import fs from 'fs/promises'
import path from 'path'

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json()
    const { title, content, category, tags } = data

    if (!title || !content) {
      return new Response('标题和内容不能为空', { status: 400 })
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) || `knowledge-${Date.now()}`

    // Create frontmatter
    const frontmatter = {
      title,
      date: new Date().toISOString().split('T')[0],
      summary: content.substring(0, 100),
      ...(category && { category }),
      ...(tags && tags.length > 0 && { tags }),
    }

    // Format frontmatter as YAML
    const frontmatterLines = Object.entries(frontmatter).map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map((v) => `"${v}"`).join(', ')}]`
      }
      return `${key}: "${value}"`
    })

    const fileContent = `---
${frontmatterLines.join('\n')}
---

${content}
`

    // Save to knowledge directory
    const knowledgeDir = path.join(process.cwd(), 'src', 'content', 'knowledge')
    await fs.mkdir(knowledgeDir, { recursive: true })

    // Find unique filename
    let filename = `${slug}.md`
    let counter = 1
    while (true) {
      try {
        await fs.access(path.join(knowledgeDir, filename))
        filename = `${slug}-${counter}.md`
        counter++
      } catch {
        break
      }
    }

    await fs.writeFile(path.join(knowledgeDir, filename), fileContent, 'utf-8')

    return new Response(
      JSON.stringify({
        success: true,
        filename,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Upload error:', error)
    return new Response(`上传失败: ${error}`, { status: 500 })
  }
}
