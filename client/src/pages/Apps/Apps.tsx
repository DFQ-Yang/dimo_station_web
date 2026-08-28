import { Link } from 'react-router-dom';
import { ArrowRight, FileUp, MoreHorizontal } from 'lucide-react';
import AppCard from './components/AppCard';

const Apps = () => {
  const apps = [
    {
      id: 1,
      title: 'P2P 文件传输',
      description: '基于 WebRTC 的浏览器端对端文件传输工具，无需上传到服务器，保护您的隐私。',
      icon: <FileUp size={32} className="text-primary" />,
      path: '/apps/p2p-transfer',
      status: 'coming-soon',
    },
    {
      id: 2,
      title: '短链接转换',
      description: '放入指定的长链接，即可生成短链接，有效期10天',
      icon: <MoreHorizontal size={32} className="text-primary" />,
      path: '/apps/short-link',
      status: 'available',
    },
    {
      id: 3,
      title: '更多应用开发中',
      description: '更多实用工具正在开发中，敬请期待...',
      icon: <MoreHorizontal size={32} className="text-gray-400" />,
      path: '#',
      status: 'coming-soon',
    },
  ];

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">应用中心</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            探索各种实用的在线工具和应用
          </p>
          <div className="w-20 h-1 bg-primary mx-auto mt-6"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Apps;