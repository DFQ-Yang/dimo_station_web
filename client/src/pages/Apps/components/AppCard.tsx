import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface AppCardProps {
  app: {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    path: string;
    status: string;
  };
}

const AppCard = ({ app }: AppCardProps) => {
  const isAvailable = app.status === 'available';

  return (
    <div className={`card p-6 hover:transform hover:-translate-y-1 transition-all duration-200 ${!isAvailable ? 'opacity-70' : ''}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 p-3 bg-blue-50 rounded-lg">
          {app.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{app.title}</h3>
          <p className="text-gray-700 mb-4">{app.description}</p>
          
          {isAvailable ? (
            <Link
              to={app.path}
              className="inline-flex items-center text-primary hover:text-primary-dark font-medium transition-colors duration-200"
            >
              立即使用
              <ArrowRight size={16} className="ml-1" />
            </Link>
          ) : (
            <span className="inline-flex items-center text-gray-400 font-medium">
              即将上线
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppCard;