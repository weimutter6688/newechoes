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

  const getPlatformName = (platform: GitPlatform) => {
    return GIT_PLATFORM_CONFIG.platformNames[platform];
  };

  // 自定义标题或使用默认标题
  const displayTitle = title || `${getPlatformName(platform)} 项目`;

  return (
    <div className="git-project-collection max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <div key={`${project.platform}-${project.owner}-${project.name}-${index}`} className="mb-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-lg">
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="block p-5">
                <div className="flex items-start">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary-100 text-primary-600 group-hover:bg-primary-200 transition-colors">
                    {getPlatformIcon(project.platform as GitPlatform)}
                  </div>
                  <div className="ml-3 flex-1">
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
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{project.owner}</span>
                    </div>
                    
                    <h3 className="font-bold text-base text-gray-800 dark:text-gray-100 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors line-clamp-1 mt-2">{project.name}</h3>
                    
                    <div className="h-12 mb-3">
                      {project.description ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{project.description}</p>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">暂无描述</p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center text-xs gap-4">
                      {project.language && (
                        <div className="flex items-center">
                          <span className={`w-3 h-3 rounded-full mr-1.5 ${getLanguageColor(project.language)}`}></span>
                          <span className="text-gray-600 dark:text-gray-400">{project.language}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className="text-gray-600 dark:text-gray-400">{project.stars}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span className="text-gray-600 dark:text-gray-400">{project.forks}</span>
                      </div>
                      
                      <div className="flex items-center ml-auto">
                        <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-500 dark:text-gray-400">{new Date(project.updatedAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
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