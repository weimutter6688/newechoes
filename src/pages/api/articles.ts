import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getSpecialPath } from '../../content.config';

// 处理特殊ID的函数
function getArticleUrl(articleId: string) {
  return `/articles/${getSpecialPath(articleId)}`;
}

export const GET: APIRoute = async ({ request }) => {
  // 获取查询参数
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const tag = url.searchParams.get('tag') || '';
  const path = url.searchParams.get('path') || '';
  
  // 获取所有文章
  const articles = await getCollection('articles');
  
  // 打印所有文章的ID，用于调试
  console.log('所有文章的ID:');
  articles.forEach(article => {
    console.log(`- ${article.id}`);
  });
  
  // 根据条件过滤文章
  let filteredArticles = articles;
  
  // 如果有标签过滤
  if (tag) {
    filteredArticles = filteredArticles.filter(article => 
      article.data.tags && article.data.tags.includes(tag)
    );
  }
  
  // 如果有路径过滤，直接使用文章ID来判断
  if (path) {
    const normalizedPath = path.toLowerCase();
    console.log('当前过滤路径:', normalizedPath);
    
    filteredArticles = filteredArticles.filter(article => {
      const articlePath = article.id.split('/');
      console.log('处理文章:', article.id, '分割后:', articlePath);
      
      // 检查文章路径的每一部分
      return article.id.toLowerCase().includes(normalizedPath);
    });
    
    console.log('过滤后的文章数量:', filteredArticles.length);
  }
  
  // 按日期排序（最新的在前面）
  const sortedArticles = filteredArticles.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );
  
  // 计算分页
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedArticles = sortedArticles.slice(startIndex, endIndex);
  
  // 格式化文章数据
  const formattedArticles = paginatedArticles.map(article => ({
    id: article.id,
    title: article.data.title,
    date: article.data.date,
    tags: article.data.tags || [],
    summary: article.data.summary || '',
    url: getArticleUrl(article.id) // 使用特殊ID处理函数
  }));
  
  return new Response(JSON.stringify({
    articles: formattedArticles,
    total: sortedArticles.length,
    page,
    limit,
    totalPages: Math.ceil(sortedArticles.length / limit)
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}; 