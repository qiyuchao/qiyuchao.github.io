import { useState, useEffect } from 'react';
import { settingsService } from '../services/api';
import { Save, Loader } from 'lucide-react';

function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getAll();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsService.update(settings);
      alert('设置保存成功！');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('保存失败: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <Loader className="animate-spin text-gray-400" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">系统设置</h1>

      <div className="max-w-2xl space-y-6">
        {/* AI Provider Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">AI 配置</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AI 提供商</label>
              <select
                value={settings.ai_provider || 'iflow'}
                onChange={(e) => handleChange('ai_provider', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="iflow">iFlow API</option>
                <option value="openai">OpenAI</option>
                <option value="groq">Groq</option>
                <option value="custom">自定义</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AI 模型</label>
              <input
                type="text"
                value={settings.ai_model || ''}
                onChange={(e) => handleChange('ai_model', e.target.value)}
                placeholder="例如: gpt-3.5-turbo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                系统提示词
              </label>
              <textarea
                value={settings.system_prompt || ''}
                onChange={(e) => handleChange('system_prompt', e.target.value)}
                rows={4}
                placeholder="定义AI助理的行为和特性..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最大上下文消息数
              </label>
              <input
                type="number"
                value={settings.max_context_messages || '10'}
                onChange={(e) => handleChange('max_context_messages', e.target.value)}
                min="1"
                max="50"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                AI在生成回复时会参考的历史消息数量
              </p>
            </div>
          </div>
        </div>

        {/* Telegram Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Telegram 配置</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">启用 Telegram Bot</label>
                <p className="text-sm text-gray-500 mt-1">
                  通过Telegram与AI助理交互
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.telegram_enabled === 'true'}
                  onChange={(e) =>
                    handleChange('telegram_enabled', e.target.checked ? 'true' : 'false')
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.telegram_enabled === 'true' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ⚠️ 请确保在 backend/.env 文件中配置了 TELEGRAM_BOT_TOKEN
                </p>
              </div>
            )}
          </div>
        </div>

        {/* API Keys Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-medium text-yellow-800 mb-2">🔑 API 密钥配置</h3>
          <p className="text-sm text-yellow-700">
            AI API密钥和Telegram Bot Token需要在后端的 .env 文件中配置。
            请参考 backend/.env.example 文件进行配置。
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader className="animate-spin" size={20} />
              <span>保存中...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>保存设置</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Settings;
