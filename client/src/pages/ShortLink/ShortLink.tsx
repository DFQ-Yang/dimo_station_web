/** 短链接生成器 */
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';


const ShortLink = () => {
    const navigate = useNavigate();
    const [shortLink, setShortLink] = useState('');
    const [longLink, setLongLink] = useState('');

    // 处理表单提交
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const res = await fetch('/api/short-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                longLink,
            }),
        });
        const data = await res.json();
        if (res.ok) {
            setShortLink(data.shortLink);
        } else {
            alert(data.message || '短链接生成失败');
        }
    };

  return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 顶部：返回按钮 + 页面标题 */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => {
                navigate('/apps');
              }}
              className="mr-4 text-gray-700 hover:text-primary transition-colors duration-200"
            >
              ← 返回
            </button>
            <h1 className="text-3xl font-bold text-gray-900">短链接生成器</h1>
          </div>
          <form className="flex flex-col items-center" onSubmit={handleSubmit}>
            <input value={longLink} type="text" onChange={e => setLongLink(e.target.value)} placeholder="请输入长链接" className="w-full p-4 border border-gray-300 rounded-md" />
            <div className="w-full mt-4">
              <input value={shortLink} type="text" placeholder="短链接" className="w-full p-4 border border-gray-300 rounded-md" />
            </div>
            <button type="submit" className="mt-4 bg-primary text-white px-8 py-2 rounded-md">
              生成短链接
            </button>
          </form>
        </div>
      </div>
  );
};
export default ShortLink;