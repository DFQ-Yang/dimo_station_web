const About = () => {
  return (
    <section id="about" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">关于本站</h2>
          <div className="w-20 h-1 bg-primary mx-auto"></div>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="card p-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              这是一个个人网站，用于分享我的想法、项目和创作。网站包含博客和应用两个主要部分。
              博客部分用于记录技术学习、生活感悟等内容；应用部分则提供一些实用的在线工具，
              第一个应用是 P2P 文件传输工具，可以实现浏览器间的直接文件传输，无需上传到服务器。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;