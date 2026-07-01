import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左侧：网站 Logo/名称 */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-primary">Dimo小站</span>
            </Link>
          </div>

          {/* 中间：导航链接（桌面端） */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive('/') 
                    ? 'text-primary bg-blue-50' 
                    : 'text-gray-700 hover:text-primary hover:bg-blue-50'
                }`}
              >
                首页
              </Link>
              <Link
                to="/apps"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive('/apps') || location.pathname.startsWith('/apps')
                    ? 'text-primary bg-blue-50' 
                    : 'text-gray-700 hover:text-primary hover:bg-blue-50'
                }`}
              >
                应用中心
              </Link>
            </div>
          </div>

        {/* 右侧：GitHub 外链 */}
        <div className="hidden md:block">
          <a
            href="https://github.com/DFQ-Yang"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-primary transition-colors duration-200 text-sm font-medium"
          >
            GitHub
          </a>
        </div>

          {/* 移动端：汉堡菜单按钮 */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary transition-colors duration-200"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* 移动端：下拉菜单 */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                isActive('/') 
                  ? 'text-primary bg-blue-50' 
                  : 'text-gray-700 hover:text-primary hover:bg-blue-50'
              }`}
            >
              首页
            </Link>
            <Link
              to="/apps"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                isActive('/apps') || location.pathname.startsWith('/apps')
                  ? 'text-primary bg-blue-50' 
                  : 'text-gray-700 hover:text-primary hover:bg-blue-50'
              }`}
            >
              应用中心
            </Link>
            <a
              href="https://github.com/DFQ-Yang"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-blue-50 transition-colors duration-200"
            >
              GitHub
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;