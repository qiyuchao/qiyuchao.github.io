import { useState, useEffect } from 'react';
import { documentService } from '../services/api';
import { Upload, FileText, Trash2, Download, Loader } from 'lucide-react';

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getAll(1, 50);
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('只支持PDF文件');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('文件大小不能超过50MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      await documentService.upload(selectedFile);
      setSelectedFile(null);
      await loadDocuments();
      alert('文档上传成功！');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('上传失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个文档吗？')) return;

    try {
      await documentService.delete(id);
      await loadDocuments();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('删除失败: ' + error.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">文档管理</h1>

      {/* Upload section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">上传PDF文档</h2>
        <p className="text-gray-600 mb-4">
          上传PDF文档后，AI助理可以学习并引用文档内容来回答问题。
        </p>

        <div className="flex items-center gap-4">
          <label className="flex-1">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
              <Upload size={20} className="text-gray-400" />
              <span className="text-gray-600">
                {selectedFile ? selectedFile.name : '选择PDF文件（最大50MB）'}
              </span>
            </div>
          </label>

          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>上传中...</span>
                </>
              ) : (
                <>
                  <Upload size={20} />
                  <span>上传</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Documents list */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">已上传文档</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader className="animate-spin text-gray-400 mx-auto" size={32} />
          </div>
        ) : documents.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <FileText className="text-red-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{doc.original_name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{doc.page_count} 页</span>
                        <span>•</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>{new Date(doc.created_at * 1000).toLocaleString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <FileText className="text-gray-300 mx-auto mb-4" size={48} />
            <p className="text-gray-500">暂无文档</p>
            <p className="text-sm text-gray-400 mt-2">上传PDF文档让AI助理学习</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Documents;
