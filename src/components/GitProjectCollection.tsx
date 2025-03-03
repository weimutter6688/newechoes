import React, { useState, useEffect } from 'react';
import ReactMasonryCss from 'react-masonry-css';
import { GIT_CONFIG } from '@/consts';

// Git 平台类型枚举
export enum GitPlatform {
  GITHUB = 'github',
  GITEA = 'gitea',
  GITEE = 'gitee'
}

// 内部使用的平台配置 - 用户不需要修改
export const GIT_PLATFORM_CONFIG = {
  platforms: {
      [GitPlatform.GITHUB]: {
          ...GIT_CONFIG.github,
          apiUrl: 'https://api.github.com'
      },
      [GitPlatform.GITEA]: {
          ...GIT_CONFIG.gitea
      },
      [GitPlatform.GITEE]: {
          ...GIT_CONFIG.gitee,
          apiUrl: 'https://gitee.com/api/v5'
      }
  },
  enabledPlatforms: [GitPlatform.GITHUB, GitPlatform.GITEA, GitPlatform.GITEE],
  platformNames: {
      [GitPlatform.GITHUB]: 'GitHub',
      [GitPlatform.GITEA]: 'Gitea',
      [GitPlatform.GITEE]: 'Gitee'
  }
};



interface GitProject {
  name: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
  updatedAt: string;
  owner: string;
  avatarUrl: string;
  platform: GitPlatform;
}

interface Pagination {
  current: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface GitProjectCollectionProps {
  platform: GitPlatform;
  username?: string;
  organization?: string;
  title?: string;
}

const GitProjectCollection: React.FC<GitProjectCollectionProps> = ({ 
  platform, 
  username, 
  organization,
  title
}) => {
  const [projects, setProjects] = useState<GitProject[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ current: 1, total: 1, hasNext: false, hasPrev: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPageChanging, setIsPageChanging] = useState(false);

  // 获取默认用户名
  const defaultUsername = GIT_PLATFORM_CONFIG.platforms[platform].username;
  // 使用提供的用户名或默认用户名
  const effectiveUsername = username || defaultUsername;

  const fetchData = async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('platform', platform);
    params.append('page', page.toString());
    
    if (effectiveUsername) {
      params.append('username', effectiveUsername);
    }
    
    if (organization) {
      params.append('organization', organization);
    }
    
    const url = `/api/git-projects?${params.toString()}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`获取数据失败: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setProjects(data.projects);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData(1);
  }, [platform, effectiveUsername, organization]);

  const handlePageChange = (page: number) => {
    if (isPageChanging) return;
    
    setIsPageChanging(true);
    
    // 重置当前状态，显示加载中
    setProjects([]);
    setLoading(true);
    
    // 手动更新分页状态
    setPagination(prev => ({
      ...prev,
      current: page
    }));
    
    fetchData(page);
    setTimeout(() => setIsPageChanging(false), 2000);
  };

  const getPlatformIcon = (platform: GitPlatform) => {
    switch (platform) {
      case GitPlatform.GITHUB:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        );
      case GitPlatform.GITEA:
        return (
          <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.948.291c-1.412.274-2.223 1.793-2.223 1.793S4.22 3.326 2.4 5.469c-1.82 2.142-1.415 5.481-1.415 5.481s1.094 3.61 5.061 3.61c3.967 0 5.681-1.853 5.681-1.853s1.225-1.087 1.225-3.718c0-2.632-1.946-3.598-1.946-3.598s.324-1.335-1.061-3.118C8.59.49 8.948.291 8.948.291zM8.13 2.577c.386 0 .699.313.699.699 0 .386-.313.699-.699.699-.386 0-.699-.313-.699-.699 0-.386.313-.699.699-.699zm-3.366.699c.386 0 .699.313.699.699 0 .386-.313.699-.699.699-.386 0-.699-.313-.699-.699 0-.386.313-.699.699-.699zm6.033 0c.386 0 .699.313.699.699 0 .386-.313.699-.699.699-.386 0-.699-.313-.699-.699 0-.386.313-.699.699-.699zm-4.764 2.1c.386 0 .699.313.699.699 0 .386-.313.699-.699.699-.386 0-.699-.313-.699-.699 0-.386.313-.699.699-.699zm3.366 0c.386 0 .699.313.699.699 0 .386-.313.699-.699.699-.386 0-.699-.313-.699-.699 0-.386.313-.699.699-.699zm-5.049 2.1c.386 0 .699.313.699.699 0 .386-.313.699-.699.699-.386 0-.699-.313-.699-.699 0-.386.313-.699.699-.699zm6.732 0c.386 0 .699.313.699.699 0 .386-.313.699-.699.699-.386 0-.699-.313-.699-.699 0-.386.313-.699.699-.699zm-3.366.699c.386 0 .699.313.699.699 0 .386-.313.699-.699.699-.386 0-.699-.313-.699-.699 0-.386.313-.699.699-.699zm-1.683 1.4c.386 0 .699.313.699.699 0 .386-.313.699-.699.699-.386 0-.699-.313-.699-.699 0-.386.313-.699.699-.699z"/>
          </svg>
        );
      case GitPlatform.GITEE:
        return (
          <svg className="w-5 h-5" viewBox="0 0 1024 1024" fill="currentColor">
            <path d="M512 1024C229.222 1024 0 794.778 0 512S229.222 0 512 0s512 229.222 512 512-229.222 512-512 512z m259.149-568.883h-290.74a25.293 25.293 0 0 0-25.292 25.293l-0.026 63.206c0 13.952 11.315 25.293 25.267 25.293h177.024c13.978 0 25.293 11.315 25.293 25.267v12.646a75.853 75.853 0 0 1-75.853 75.853h-240.23a25.293 25.293 0 0 1-25.267-25.293V417.203a75.853 75.853 0 0 1 75.827-75.853h353.946a25.293 25.293 0 0 0 25.267-25.292l0.077-63.207a25.293 25.293 0 0 0-25.268-25.293H417.152a189.62 189.62 0 0 0-189.62 189.645V771.15c0 13.977 11.316 25.293 25.294 25.293h372.94a170.65 170.65 0 0 0 170.65-170.65V480.384a25.293 25.293 0 0 0-25.293-25.267z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      JavaScript: 'bg-yellow-300',
      TypeScript: 'bg-blue-400',
      Python: 'bg-blue-600',
      Java: 'bg-red-500',
      Go: 'bg-blue-300',
      Rust: 'bg-orange-600',
      C: 'bg-gray-500',
      'C++': 'bg-pink-500',
      'C#': 'bg-green-500',
      PHP: 'bg-purple-500',
      Ruby: 'bg-red-600',
      Swift: 'bg-orange-500',
      Kotlin: 'bg-purple-400',
      Dart: 'bg-blue-500',
      HTML: 'bg-orange-400',
      CSS: 'bg-blue-400',
      Shell: 'bg-green-600',
    };

    return colors[language] || 'bg-gray-400';
  };

  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1
  };

  if (loading && projects.length === 0) {
    return <div className="flex justify-center p-8">加载中...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">错误: {error}</div>;
  }

  const getPlatformName = (platform: GitPlatform) => {
    return GIT_PLATFORM_CONFIG.platformNames[platform];
  };

  // 自定义标题或使用默认标题
  const displayTitle = title || `${getPlatformName(platform)} 项目`;

  return (
    <div className="git-project-collection">
      <h2 className="text-2xl font-bold mb-6 text-primary-700">
        {displayTitle}
        {effectiveUsername && <span className="ml-2 text-secondary-500">(@{effectiveUsername})</span>}
        {organization && <span className="ml-2 text-secondary-500">(组织: {organization})</span>}
      </h2>
      
      {loading && projects.length === 0 ? (
        <div className="flex justify-center p-8">加载中...</div>
      ) : error ? (
        <div className="text-red-500 p-4">错误: {error}</div>
      ) : projects.length === 0 ? (
        <div className="text-secondary-500 p-4">
          {platform === GitPlatform.GITEE ? 
            "无法获取 Gitee 项目数据，可能需要配置访问令牌。" : 
            "没有找到项目数据。"}
        </div>
      ) : (
        <ReactMasonryCss
          breakpointCols={breakpointColumnsObj}
          className="flex -ml-4 w-auto"
          columnClassName="pl-4 bg-clip-padding"
        >
          {projects.map((project, index) => (
            <div key={`${project.platform}-${project.owner}-${project.name}-${index}`} className="mb-4 overflow-hidden rounded-lg border border-secondary-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="block p-4">
                <div className="flex items-center mb-2">
                  <div className="mr-2 text-secondary-600">
                    {getPlatformIcon(project.platform as GitPlatform)}
                  </div>
                  <div className="flex-1 truncate">
                    <div className="flex items-center">
                      <img 
                        src={project.avatarUrl} 
                        alt={`${project.owner}'s avatar`} 
                        className="w-5 h-5 rounded-full mr-2"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'https://via.placeholder.com/40';
                        }}
                      />
                      <span className="text-sm text-secondary-600 truncate">{project.owner}</span>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold mb-1 text-primary-800 line-clamp-1">{project.name}</h3>
                
                {project.description && (
                  <p className="text-secondary-700 text-sm mb-3 line-clamp-2">{project.description}</p>
                )}
                
                <div className="flex flex-wrap items-center text-xs mt-2">
                  {project.language && (
                    <div className="flex items-center mr-4 mb-1">
                      <span className={`w-3 h-3 rounded-full mr-1 ${getLanguageColor(project.language)}`}></span>
                      <span className="text-secondary-600">{project.language}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center mr-4 mb-1">
                    <svg className="w-4 h-4 mr-1 text-secondary-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
                    </svg>
                    <span className="text-secondary-600">{project.stars}</span>
                  </div>
                  
                  <div className="flex items-center mr-4 mb-1">
                    <svg className="w-4 h-4 mr-1 text-secondary-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-secondary-600">{project.forks}</span>
                  </div>
                  
                  <div className="flex items-center mb-1 ml-auto">
                    <svg className="w-4 h-4 mr-1 text-secondary-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-secondary-500">{new Date(project.updatedAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </ReactMasonryCss>
      )}
      
      {pagination.total > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => handlePageChange(pagination.current - 1)}
            disabled={!pagination.hasPrev || pagination.current <= 1 || isPageChanging}
            className={`px-4 py-2 rounded ${!pagination.hasPrev || pagination.current <= 1 || isPageChanging ? 'bg-secondary-200 text-secondary-500 cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
          >
            {isPageChanging ? '加载中...' : '上一页'}
          </button>
          
          <span className="px-4 py-2 bg-secondary-100 rounded">
            {pagination.current} / {pagination.total}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.current + 1)}
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

export default GitProjectCollection; 