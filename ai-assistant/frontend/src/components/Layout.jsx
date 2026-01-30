import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings as SettingsIcon,
  Github,
} from 'lucide-react';

function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
    { path: '/chat', icon: MessageSquare, label: '对话' },
    { path: '/documents', icon: FileText, label: '文档' },
    { path: '/settings', icon: SettingsIcon, label: '设置' },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">🤖 AI Assistant</h1>
          <p className="text-sm text-gray-500 mt-1">个人智能助理</p>
        </div>

        <nav className="px-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <Github size={16} />
            <span>GitHub</span>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
