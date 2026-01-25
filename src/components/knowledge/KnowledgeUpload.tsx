import { useState } from 'react'
import { toast } from 'react-toastify'

export default function KnowledgeUpload() {
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title || !content) {
      toast.error('标题和内容不能为空')
      return
    }

    setUploading(true)

    try {
      // For static sites, we'll save to localStorage as a workaround
      // In production with a server, this would call the API
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50) || `knowledge-${Date.now()}`

      // Parse tags into array
      const tagsArray = tags.split(',').map((t) => t.trim()).filter(Boolean)

      const frontmatter = {
        title,
        date: new Date().toISOString().split('T')[0],
        summary: content.substring(0, 100),
        ...(category && { category }),
        ...(tagsArray.length > 0 && { tags: tagsArray }),
      }

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

      // Save to localStorage for demo purposes
      const savedKnowledge = JSON.parse(localStorage.getItem('uploaded-knowledge') || '[]')
      savedKnowledge.push({
        slug,
        title,
        content: fileContent,
        timestamp: Date.now(),
      })
      localStorage.setItem('uploaded-knowledge', JSON.stringify(savedKnowledge))

      toast.success('知识已保存到本地存储！请下载文件并手动添加到 src/content/knowledge/ 目录')
      
      // Create download link
      const blob = new Blob([fileContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slug}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setTitle('')
      setContent('')
      setCategory('')
      setTags('')
      setIsOpen(false)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('保存失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity"
      >
        + 上传知识
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-primary rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">上传知识</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-2xl hover:text-accent"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-primary rounded-lg bg-bg-secondary"
                  placeholder="输入知识标题"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-primary rounded-lg bg-bg-secondary min-h-[200px]"
                  placeholder="输入知识内容（支持 Markdown 格式）"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">分类</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-primary rounded-lg bg-bg-secondary"
                  placeholder="输入分类名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  标签（用逗号分隔）
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3 py-2 border border-primary rounded-lg bg-bg-secondary"
                  placeholder="标签1, 标签2, 标签3"
                />
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-primary rounded-lg hover:bg-secondary"
                  disabled={uploading}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                  disabled={uploading}
                >
                  {uploading ? '上传中...' : '上传'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
