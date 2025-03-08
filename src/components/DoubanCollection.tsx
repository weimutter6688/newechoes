import React, { useState, useEffect } from 'react';
import ReactMasonryCss from 'react-masonry-css';

interface DoubanItem {
  imageUrl: string;
  title: string;
  subtitle: string;
  link: string;
  intro: string;
  rating: number;
  date: string;
}

interface Pagination {
  current: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface DoubanCollectionProps {
  type: 'movie' | 'book';
}

const DoubanCollection: React.FC<DoubanCollectionProps> = ({ type }) => {
  const [items, setItems] = useState<DoubanItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ current: 1, total: 1, hasNext: false, hasPrev: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPageChanging, setIsPageChanging] = useState(false);

  const fetchData = async (start = 0) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('type', type);
    params.append('start', start.toString());
    
    const url = `/api/douban?${params.toString()}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('获取数据失败');
      }
      const data = await response.json();
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  const handlePageChange = (page: number) => {
    const start = (page - 1) * 15;
    
    // 手动更新分页状态，不等待API响应
    setPagination(prev => ({
      ...prev,
      current: page
    }));
    
    // 重置当前状态，显示加载中
    setItems([]);
    setLoading(true);
    
    fetchData(start);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg 
            key={star} 
            className={`w-4 h-4 ${star <= rating ? 'text-accent-400' : 'text-secondary-300'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1
  };

  if (loading && items.length === 0) {
    return <div className="flex justify-center p-8">加载中...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">错误: {error}</div>;
  }

  return (
    <div className="douban-collection">
      <h2 className="text-2xl font-bold mb-6 text-primary-700">{type === 'movie' ? '观影记录' : '读书记录'}</h2>
      
      <ReactMasonryCss
        breakpointCols={breakpointColumnsObj}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        {items.map((item, index) => (
          <div key={index} className="mb-6 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
              <div className="relative pb-[140%] overflow-hidden">
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 line-clamp-1 text-primary-800">{item.title}</h3>
                {item.subtitle && <p className="text-secondary-600 text-sm mb-2 line-clamp-1">{item.subtitle}</p>}
                <div className="flex justify-between items-center mb-2">
                  {renderStars(item.rating)}
                  <span className="text-sm text-secondary-500">{item.date}</span>
                </div>
                <p className="text-secondary-700 text-sm line-clamp-3">{item.intro}</p>
              </div>
            </a>
          </div>
        ))}
      </ReactMasonryCss>

      {/* 分页 */}
      {pagination.total > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              if (isPageChanging) return;
              
              const prevPage = pagination.current - 1;
              
              if (prevPage > 0) {
                setIsPageChanging(true);
                const prevStart = (prevPage - 1) * 15;
                
                // 直接调用fetchData
                fetchData(prevStart);
                
                // 手动更新分页状态
                setPagination(prev => ({
                  ...prev,
                  current: prevPage
                }));
                
                setTimeout(() => setIsPageChanging(false), 2000);
              }
            }}
            disabled={!pagination.hasPrev || pagination.current <= 1 || isPageChanging}
            className={`px-4 py-2 rounded ${!pagination.hasPrev || pagination.current <= 1 || isPageChanging ? 'bg-secondary-200 text-secondary-500 cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
          >
            {isPageChanging ? '加载中...' : '上一页'}
          </button>
          
          <span className="px-4 py-2 bg-secondary-100 rounded">
            {pagination.current} / {pagination.total}
          </span>
          
          <button
            onClick={(e) => {
              e.preventDefault(); // 防止默认行为
              if (isPageChanging) return;
              
              // 明确记录当前操作
              const nextPage = pagination.current + 1;
              
              // 直接使用明确的页码而不是依赖state
              if (pagination.current < pagination.total) {
                setIsPageChanging(true);
                const nextStart = (nextPage - 1) * 15; // 修正计算方式
                
                // 直接调用fetchData而不是通过handlePageChange
                fetchData(nextStart);
                
                // 手动更新分页状态
                setPagination(prev => ({
                  ...prev,
                  current: nextPage
                }));
                
                setTimeout(() => setIsPageChanging(false), 2000);
              }
            }}
            disabled={!pagination.hasNext || pagination.current >= pagination.total || isPageChanging}
            className={`px-4 py-2 rounded ${!pagination.hasNext || pagination.current >= pagination.total || isPageChanging ? 'bg-secondary-200 text-secondary-500 cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
          >
            {isPageChanging ? '加载中...' : '下一页'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DoubanCollection; 