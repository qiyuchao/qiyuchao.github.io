import { useState, useEffect } from 'react';
import { statsService } from '../services/api';
import { MessageSquare, FileText, TrendingUp, Clock } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await statsService.get();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: '对话总数',
      value: stats?.conversations || 0,
      icon: MessageSquare,
      color: 'blue',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-600',
    },
    {
      title: '消息总数',
      value: stats?.messages || 0,
      icon: TrendingUp,
      color: 'green',
      bgClass: 'bg-green-100',
      textClass: 'text-green-600',
    },
    {
      title: '文档总数',
      value: stats?.documents || 0,
      icon: FileText,
      color: 'purple',
      bgClass: 'bg-purple-100',
      textClass: 'text-purple-600',
    },
    {
      title: '今日消息',
      value: stats?.messagesToday || 0,
      icon: Clock,
      color: 'orange',
      bgClass: 'bg-orange-100',
      textClass: 'text-orange-600',
    },
  ];

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">仪表盘</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgClass}`}>
                <card.icon className={card.textClass} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent conversations */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">最近对话</h2>
        </div>
        <div className="p-6">
          {stats?.recentConversations && stats.recentConversations.length > 0 ? (
            <div className="space-y-4">
              {stats.recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <h3 className="font-medium text-gray-800">{conv.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      来源: {conv.source.startsWith('telegram') ? 'Telegram' : 'Web'}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(conv.updated_at * 1000).toLocaleString('zh-CN')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">暂无对话记录</p>
          )}
        </div>
      </div>

      {/* Storage info */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">存储信息</h2>
        <p className="text-gray-600">
          文档总大小: <span className="font-medium">{formatFileSize(stats?.totalDocumentSize)}</span>
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
