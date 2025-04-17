import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ request }) => {
  // 获取查询参数
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const tag = url.searchParams.get('tag') || '';
  const path = url.searchParams.get('path') || '';

  // 获取所有技术文章
  const articles = await getCollection('tech');

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
    filteredArticles = filteredArticles.filter(article => {
      const articlePath = article.id.split('/');
      return article.id.toLowerCase().includes(normalizedPath);
    });
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
    url: `/articles/${article.slug}` // 使用 slug 生成 URL
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