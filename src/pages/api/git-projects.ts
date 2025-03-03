import type { APIRoute } from 'astro';
import { Octokit } from 'octokit';
import fetch from 'node-fetch';
import { GIT_CONFIG } from '@/consts';
import { GitPlatform, GIT_PLATFORM_CONFIG } from '@/components/GitProjectCollection';

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

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const platformParam = url.searchParams.get('platform') || 'github';
  const platform = platformParam as GitPlatform;
  const page = parseInt(url.searchParams.get('page') || '1');
  const username = url.searchParams.get('username') || '';
  const organization = url.searchParams.get('organization') || '';
  
  try {
    let projects: GitProject[] = [];
    let pagination: Pagination = { current: page, total: 1, hasNext: false, hasPrev: page > 1 };
    
    if (platform === GitPlatform.GITHUB) {
      const result = await fetchGithubProjects(username, organization, page);
      projects = result.projects;
      pagination = result.pagination;
    } else if (platform === GitPlatform.GITEA) {
      const result = await fetchGiteaProjects(username, organization, page);
      projects = result.projects;
      pagination = result.pagination;
    } else if (platform === GitPlatform.GITEE) {
      try {
        const result = await fetchGiteeProjects(username, organization, page);
        projects = result.projects;
        pagination = result.pagination;
      } catch (giteeError) {
        // 返回空数据而不是抛出错误
      }
    }
    
    return new Response(JSON.stringify({ projects, pagination }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    let errorMessage = '获取数据失败';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      platform
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

async function fetchGithubProjects(username: string, organization: string, page: number) {
  // 添加重试逻辑
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const octokit = new Octokit({
        auth: GIT_PLATFORM_CONFIG.platforms[GitPlatform.GITHUB].token || process.env.GITHUB_TOKEN,
        request: {
          timeout: 10000 // 增加超时时间到10秒
        }
      });
      
      const perPage = GIT_CONFIG.perPage;
      let repos;
      
      if (organization) {
        const { data } = await octokit.request('GET /orgs/{org}/repos', {
          org: organization,
          per_page: perPage,
          page: page,
          sort: 'updated',
          direction: 'desc'
        });
        repos = data;
      } else if (username) {
        const { data } = await octokit.request('GET /users/{username}/repos', {
          username: username,
          per_page: perPage,
          page: page,
          sort: 'updated',
          direction: 'desc'
        });
        repos = data;
      } else {
        // 如果没有指定用户或组织，使用默认用户名
        const defaultUsername = GIT_PLATFORM_CONFIG.platforms[GitPlatform.GITHUB].username;
        const { data } = await octokit.request('GET /users/{username}/repos', {
          username: defaultUsername,
          per_page: perPage,
          page: page,
          sort: 'updated',
          direction: 'desc'
        });
        repos = data;
      }
      
      // 替换获取分页信息的代码
      let hasNext = false;
      let hasPrev = page > 1;
      let totalPages = 1;
      
      // 使用响应头中的 Link 信息
      if (repos.length === perPage) {
        hasNext = true;
        totalPages = page + 1;
      }
      
      // 或者使用 GitHub API 的 repository_count 估算
      if (repos.length > 0 && repos[0].owner) {
        // 简单估算：如果有结果且等于每页数量，则可能有下一页
        hasNext = repos.length === perPage;
        totalPages = hasNext ? page + 1 : page;
      }
      
      const projects = repos.map((repo: any) => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        updatedAt: repo.updated_at,
        owner: repo.owner.login,
        avatarUrl: repo.owner.avatar_url,
        platform: GitPlatform.GITHUB
      }));
      
      return {
        projects,
        pagination: {
          current: page,
          total: totalPages,
          hasNext,
          hasPrev
        }
      };
    } catch (error) {
      retryCount++;
      
      if (retryCount >= maxRetries) {
        throw error;
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
    }
  }
  
  // 添加默认返回值，防止 undefined
  return {
    projects: [],
    pagination: {
      current: page,
      total: 1,
      hasNext: false,
      hasPrev: page > 1
    }
  };
}

async function fetchGiteaProjects(username: string, organization: string, page: number) {
  try {
    // 使用consts中的配置
    const perPage = GIT_CONFIG.perPage;
    const platformConfig = GIT_PLATFORM_CONFIG.platforms[GitPlatform.GITEA];
    
    if (!platformConfig) {
      throw new Error('Gitea 平台配置不存在');
    }
    
    const giteaUrl = platformConfig.url;
    
    if (!giteaUrl) {
      throw new Error('Gitea URL 不存在');
    }
    
    let apiUrl;
    if (organization) {
      apiUrl = `${giteaUrl}/api/v1/orgs/${organization}/repos?page=${page}&per_page=${perPage}`;
    } else if (username) {
      apiUrl = `${giteaUrl}/api/v1/users/${username}/repos?page=${page}&per_page=${perPage}`;
    } else {
      const defaultUsername = GIT_PLATFORM_CONFIG.platforms[GitPlatform.GITEA].username;
      apiUrl = `${giteaUrl}/api/v1/users/${defaultUsername}/repos?page=${page}&per_page=${perPage}`;
    }
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        ...(GIT_PLATFORM_CONFIG.platforms[GitPlatform.GITEA].token ? 
          { 'Authorization': `token ${GIT_PLATFORM_CONFIG.platforms[GitPlatform.GITEA].token}` } : 
          {})
      }
    });
    
    if (!response.ok) {
      throw new Error(`Gitea API 请求失败: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    // Gitea API 返回的是数组
    const repos = Array.isArray(data) ? data : [];
    
    // 获取分页信息
    const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');
    const totalPages = Math.ceil(totalCount / perPage) || 1;
    
    const projects = repos.map((repo: any) => ({
      name: repo.name,
      description: repo.description || '',
      url: repo.html_url || `${giteaUrl}/${repo.full_name || `${repo.owner.username || repo.owner.login}/${repo.name}`}`,
      stars: repo.stars_count || repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      language: repo.language || '',
      updatedAt: repo.updated_at,
      owner: repo.owner.username || repo.owner.login,
      avatarUrl: repo.owner.avatar_url,
      platform: GitPlatform.GITEA
    }));
    
    return {
      projects,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    // 返回空数据而不是抛出错误
    return {
      projects: [],
      pagination: {
        current: page,
        total: 1,
        hasNext: false,
        hasPrev: page > 1
      }
    };
  }
}

async function fetchGiteeProjects(username: string, organization: string, page: number) {
  try {
    // 使用consts中的配置
    const perPage = GIT_CONFIG.perPage;
    
    // 确定用户名
    const giteeUsername = username || GIT_CONFIG.gitee.username;
    
    if (!giteeUsername) {
      throw new Error('Gitee 用户名未配置');
    }
    
    // 构建API URL
    let apiUrl;
    if (organization) {
      apiUrl = `https://gitee.com/api/v5/orgs/${organization}/repos?page=${page}&per_page=${perPage}&sort=updated&direction=desc`;
    } else {
      apiUrl = `https://gitee.com/api/v5/users/${giteeUsername}/repos?page=${page}&per_page=${perPage}&sort=updated&direction=desc`;
    }
    
    // 添加访问令牌（如果有）
    if (GIT_CONFIG.gitee.token) {
      apiUrl += `&access_token=${GIT_CONFIG.gitee.token}`;
    }
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Gitee API 请求失败: ${response.statusText}`);
    }
    
    const data = await response.json() as any[];
    
    // 转换数据格式
    const projects: GitProject[] = data.map(repo => ({
      name: repo.name || '',
      description: repo.description || '',
      url: repo.html_url || '',
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      language: repo.language || '',
      updatedAt: repo.updated_at || '',
      owner: repo.owner?.login || '',
      avatarUrl: repo.owner?.avatar_url || '',
      platform: GitPlatform.GITEE
    }));
    
    // 获取分页信息
    const totalCount = parseInt(response.headers.get('total_count') || '0');
    const totalPages = Math.ceil(totalCount / perPage) || 1;
    
    return {
      projects,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    // 返回空结果
    return {
      projects: [],
      pagination: {
        current: page,
        total: 1,
        hasNext: false,
        hasPrev: page > 1
      }
    };
  }
}