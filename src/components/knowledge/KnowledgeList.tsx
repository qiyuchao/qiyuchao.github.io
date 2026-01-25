import type { CollectionEntry } from 'astro:content'
import { motion } from 'framer-motion'

interface Props {
  items: CollectionEntry<'knowledge'>[]
}

export default function KnowledgeList({ items }: Props) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <motion.a
          key={item.slug}
          href={`/knowledge/${item.slug}`}
          className="block p-4 rounded-lg border border-primary hover:bg-secondary transition-colors"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <h3 className="text-xl font-semibold mb-2">{item.data.title}</h3>
          {item.data.summary && (
            <p className="text-secondary mb-2">{item.data.summary}</p>
          )}
          <div className="flex flex-wrap gap-2 items-center text-sm text-secondary">
            <time>{item.data.date.toLocaleDateString('zh-CN')}</time>
            {item.data.category && (
              <>
                <span>•</span>
                <span>{item.data.category}</span>
              </>
            )}
            {item.data.tags && item.data.tags.length > 0 && (
              <>
                <span>•</span>
                <div className="flex gap-1">
                  {item.data.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-primary/10 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.a>
      ))}
      {items.length === 0 && (
        <div className="text-center py-12 text-secondary">
          <p>暂无知识条目，请上传文件创建新的知识</p>
        </div>
      )}
    </div>
  )
}
