import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { contentStructure } from '../../content.config';
import type { SectionStructure } from '../../content.config';

export const GET: APIRoute = async ({ request }) => {
  // 获取查询参数
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const tag = url.searchParams.get('tag') || '';
  const path = url.searchParams.get('path') || '';
  
  // 获取所有文章
  const articles = await getCollection('articles');
  
  // 根据条件过滤文章
  let filteredArticles = articles;
  
  // 如果有标签过滤
  if (tag) {
    filteredArticles = filteredArticles.filter(article => 
      article.data.tags && article.data.tags.includes(tag)
    );
  }
  
  // 如果有路径过滤，需要从contentStructure中查找对应目录下的文章
  if (path) {
    // 解析路径
    const pathSegments = path.split('/').filter(segment => segment.trim() !== '');
    
    // 递归查找目录
    const findArticlesInPath = (sections: SectionStructure[], currentPath = ''): string[] => {
      for (const section of sections) {
        const sectionPath = currentPath ? `${currentPath}/${section.name}` : section.name;
        
        // 如果找到匹配的目录
        if (sectionPath === path) {
          return section.articles;
        }
        
        // 递归查找子目录
        const articlesInSubsection = findArticlesInPath(section.sections, sectionPath);
        if (articlesInSubsection.length > 0) {
          return articlesInSubsection;
        }
      }
      
      return [];
    };
    
    // 获取目录下的文章路径
    const articlePaths = findArticlesInPath(contentStructure.sections);
    
    // 根据路径过滤文章
    if (articlePaths.length > 0) {
      filteredArticles = filteredArticles.filter(article => {
        // 检查文章ID是否在目录的文章列表中
        return articlePaths.some(articlePath => {
          const articleId = article.id;
          const pathParts = articlePath.split('/');
          const fileName = pathParts[pathParts.length - 1];
          
          // 尝试多种匹配方式
          return (
            articlePath.includes(articleId) || 
            articleId.includes(fileName) || 
            fileName.includes(articleId)
          );
        });
      });
    }
  }
  
  // 按日期排序（最新的在前面）
  const sortedArticles = filteredArticles.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );
  
  // 计算分页
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedArticles = sortedArticles.slice(startIndex, endIndex);
  
  // 格式化文章数据，只返回需要的字段
  const formattedArticles = paginatedArticles.map(article => {
    // 查找文章所属的目录
    let section = '';
    
    // 递归查找文章所属的目录
    const findSection = (sections: SectionStructure[], articleId: string, parentPath = ''): string | null => {
      for (const sec of sections) {
        const sectionPath = parentPath ? `${parentPath}/${sec.name}` : sec.name;
        
        // 检查文章是否在当前目录中
        for (const artPath of sec.articles) {
          const pathParts = artPath.split('/');
          const fileName = pathParts[pathParts.length - 1];
          
          // 尝试多种匹配方式
          if (
            artPath.includes(articleId) || 
            articleId.includes(fileName) || 
            fileName.includes(articleId)
          ) {
            return sectionPath;
          }
        }
        
        // 递归检查子目录
        const foundInSubsection = findSection(sec.sections, articleId, sectionPath);
        if (foundInSubsection) {
          return foundInSubsection;
        }
      }
      
      return null;
    };
    
    section = findSection(contentStructure.sections, article.id) || '';
    
    return {
      id: article.id,
      title: article.data.title,
      date: article.data.date.toISOString(),
      summary: article.data.summary || '',
      tags: article.data.tags || [],
      section: section
    };
  });
  
  // 构建分页信息
  const pagination = {
    total: sortedArticles.length,
    current: page,
    limit: limit,
    hasNext: endIndex < sortedArticles.length,
    hasPrev: page > 1,
    totalPages: Math.ceil(sortedArticles.length / limit)
  };
  
  // 返回JSON响应
  return new Response(
    JSON.stringify({
      articles: formattedArticles,
      pagination: pagination
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}; 