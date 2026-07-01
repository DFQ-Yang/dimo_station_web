const Hero = () => {
  return (
    <section className="bg-gradient-to-r from-primary to-primary-light text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">欢迎来到我的个人网站</h1>
        <p className="text-xl md:text-2xl mb-8 text-blue-100">
          一个集博客和应用于一体的个人空间
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="#about"
            className="btn-secondary bg-white text-primary hover:bg-blue-50"
          >
            了解更多
          </a>
          <a
            href="/apps"
            className="btn-primary bg-white text-primary hover:bg-blue-50"
          >
            查看应用
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;