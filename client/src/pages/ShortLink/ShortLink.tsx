/** 短链接生成器 */
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';


const ShortLink = () => {
    const navigate = useNavigate();
    const [shortLink, setShortLink] = useState('');
    const [longLink, setLongLink] = useState('');
    const [copied, setCopied] = useState(false);

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
            setCopied(false);
        } else {
            alert(data.message || '短链接生成失败');
        }
    };

    // 重置
    const handleReset = () => {
        setLongLink('');
        setShortLink('');
        setCopied(false);
    };

    // 复制短链接
    const handleCopy = async () => {
        if (!shortLink) return;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shortLink);
            } else {
                // 降级方案：非安全上下文（如 http://localhost）使用 execCommand
                const ta = document.createElement('textarea');
                ta.value = shortLink;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            alert('复制失败，请手动复制');
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
            <div className="w-full mt-4 flex gap-2">
              <input value={shortLink} type="text" placeholder="短链接" className="flex-1 p-4 border border-gray-300 rounded-md bg-gray-50" readOnly/>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!shortLink}
                className="px-6 py-2 rounded-md bg-primary text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
            <button type="submit" className="mt-4 bg-primary text-white px-8 py-2 rounded-md hover:opacity-90 transition-opacity">
              生成短链接
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="mt-4 bg-gray-200 text-gray-700 px-8 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              重置
            </button>
          </form>
        </div>
      </div>
  );
};
export default ShortLink;