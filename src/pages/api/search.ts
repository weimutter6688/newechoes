import { getCollection } from 'astro:content';

export async function GET() {
  try {
    // 获取所有文章
    const articles = await getCollection('articles');
    
    // 过滤掉草稿文章，并转换为简化的数据结构
    const formattedArticles = articles
      .filter(article => !article.data.draft) // 过滤掉草稿
      .map(article => ({
        id: article.id,
        title: article.data.title,
        date: article.data.date,
        summary: article.data.summary || '',
        tags: article.data.tags || [],
        image: article.data.image || ''
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // 按日期排序
    
    return new Response(JSON.stringify(formattedArticles), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // 添加缓存头，缓存1小时
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('获取文章数据失败:', error);
    return new Response(JSON.stringify({ error: '获取文章数据失败' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 