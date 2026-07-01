interface BlogPost {
  id: number;
  title: string;
  summary: string;
  date: string;
  tags: string[];
}

const mockPosts: BlogPost[] = [
  {
    id: 1,
    title: '欢迎来到我的个人网站',
    summary: '这是一个新的开始，我将在这里分享我的技术学习、项目经验和生活感悟。',
    date: '2026-06-23',
    tags: ['博客', '开始'],
  },
  {
    id: 2,
    title: 'P2P 文件传输技术详解',
    summary: '介绍如何使用 WebRTC 实现浏览器间的点对点文件传输，包括连接建立、数据传输和内存优化。',
    date: '2026-06-23',
    tags: ['技术', 'WebRTC', 'P2P'],
  },
  {
    id: 3,
    title: 'React + Vite 开发体验',
    summary: '使用 React 18 和 Vite 5 构建现代 Web 应用的开发体验和最佳实践。',
    date: '2026-06-22',
    tags: ['React', 'Vite', '前端'],
  },
];

const BlogList = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">最新文章</h2>
          <div className="w-20 h-1 bg-primary mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockPosts.map((post) => (
            <div key={post.id} className="card p-6 hover:transform hover:-translate-y-1 transition-all duration-200">
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <span>{post.date}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 hover:text-primary transition-colors duration-200">
                {post.title}
              </h3>
              <p className="text-gray-700 mb-4 line-clamp-3">
                {post.summary}
              </p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-50 text-primary text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogList;