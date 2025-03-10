import type { APIContext } from 'astro';
import { Octokit } from 'octokit';
import fetch from 'node-fetch';
import { GitPlatform } from '@/components/GitProjectCollection';

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

export const prerender = false;

export async function GET({ request }: APIContext) {
  try {
    const url = new URL(request.url);
    
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    const platformParam = url.searchParams.get('platform');
    const page = parseInt(url.searchParams.get('page') || '1');
    const username = url.searchParams.get('username') || '';
    const organization = url.searchParams.get('organization') || '';
    const configStr = url.searchParams.get('config');

    if (!platformParam) {
      return new Response(JSON.stringify({ 
        error: '无效的平台参数',
        receivedPlatform: platformParam,
      }), { status: 400, headers });
    }

    if (!configStr) {
      return new Response(JSON.stringify({ 
        error: '缺少配置参数'
      }), { status: 400, headers });
    }

    const config = JSON.parse(configStr);

    if (!Object.values(GitPlatform).includes(platformParam as GitPlatform)) {
      return new Response(JSON.stringify({ 
        error: '无效的平台参数',
        receivedPlatform: platformParam,
      }), { status: 400, headers });
    }
    
    const platform = platformParam as GitPlatform;
    let projects: GitProject[] = [];
    let pagination: Pagination = { current: page, total: 1, hasNext: false, hasPrev: page > 1 };
    
    if (platform === GitPlatform.GITHUB) {
      const result = await fetchGithubProjects(username, organization, page, config);
      projects = result.projects;
      pagination = result.pagination;
    } else if (platform === GitPlatform.GITEA) {
      const result = await fetchGiteaProjects(username, organization, page, config);
      projects = result.projects;
      pagination = result.pagination;
    } else if (platform === GitPlatform.GITEE) {
      const result = await fetchGiteeProjects(username, organization, page, config);
      projects = result.projects;
      pagination = result.pagination;
    }
    
    return new Response(JSON.stringify({ projects, pagination }), {
      status: 200,
      headers
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: '处理请求错误',
      message: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

async function fetchGithubProjects(username: string, organization: string, page: number, config: any) {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
        request: {
          timeout: 10000
        }
      });
      
      const perPage = config.perPage || 10;
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
        const { data } = await octokit.request('GET /users/{username}/repos', {
          username: config.username,
          per_page: perPage,
          page: page,
          sort: 'updated',
          direction: 'desc'
        });
        repos = data;
      }
      
      let hasNext = false;
      let hasPrev = page > 1;
      let totalPages = 1;
      
      if (repos.length === perPage) {
        hasNext = true;
        totalPages = page + 1;
      }
      
      if (repos.length > 0 && repos[0].owner) {
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
      
      await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
    }
  }
  
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

async function fetchGiteaProjects(username: string, organization: string, page: number, config: any) {
  try {
    const perPage = config.perPage || 10;
    const giteaUrl = config.url;
    
    if (!giteaUrl) {
      throw new Error('Gitea URL 不存在');
    }
    
    let apiUrl;
    if (organization) {
      apiUrl = `${giteaUrl}/api/v1/orgs/${organization}/repos?page=${page}&per_page=${perPage}`;
    } else if (username) {
      apiUrl = `${giteaUrl}/api/v1/users/${username}/repos?page=${page}&per_page=${perPage}`;
    } else {
      apiUrl = `${giteaUrl}/api/v1/users/${config.username}/repos?page=${page}&per_page=${perPage}`;
    }
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        ...(config.token ? { 'Authorization': `token ${config.token}` } : {})
      }
    });
    
    if (!response.ok) {
      throw new Error(`Gitea API 请求失败: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    const repos = Array.isArray(data) ? data : [];
    
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

async function fetchGiteeProjects(username: string, organization: string, page: number, config: any) {
  try {
    const perPage = config.perPage || 10;
    
    const giteeUsername = username || config.username;
    
    if (!giteeUsername) {
      throw new Error('Gitee 用户名未配置');
    }
    
    let apiUrl;
    if (organization) {
      apiUrl = `https://gitee.com/api/v5/orgs/${organization}/repos?page=${page}&per_page=${perPage}&sort=updated&direction=desc`;
    } else {
      apiUrl = `https://gitee.com/api/v5/users/${giteeUsername}/repos?page=${page}&per_page=${perPage}&sort=updated&direction=desc`;
    }
    
    if (config.token) {
      apiUrl += `&access_token=${config.token}`;
    }
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Gitee API 请求失败: ${response.statusText}`);
    }
    
    const data = await response.json() as any[];
    
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