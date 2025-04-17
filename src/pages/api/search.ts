import { getCollection } from 'astro:content';

export async function GET({ url }: { url: URL }) {
  try {
    // 获取查询参数
    const query = url.searchParams.get('q')?.toLowerCase() || '';

    // 获取所有技术文章
    const articles = await getCollection('tech');

    // 过滤和格式化文章
    const formattedArticles = articles
      .filter(article => {
        // 过滤掉草稿
        if (article.data.draft) return false;

        // 如果有搜索查询，进行过滤
        if (query) {
          const searchableContent = [
            article.data.title,
            article.data.summary,
            article.data.tags?.join(' '),
            article.body
          ].join(' ').toLowerCase();

          return searchableContent.includes(query);
        }

        return true;
      })
      .map(article => {
        // 从slug中提取分类
        const category = article.slug.split('/')[0];

        // 提取文章内容，去除 Markdown 标记
        let contentPreview = '';
        if (article.body) {
          contentPreview = article.body
            .replace(/---[\s\S]*?---/, '') // 移除 frontmatter
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 将链接转换为纯文本
            .replace(/[#*`~>]/g, '') // 移除特殊字符
            .replace(/\n+/g, ' ') // 将换行转换为空格
            .trim()
            .slice(0, 200) + '...'; // 只保留前200个字符
        }

        return {
          id: article.slug.replace(/^tech\//, ''), // 移除tech/前缀
          title: article.data.title,
          date: article.data.date,
          summary: article.data.summary || contentPreview,
          tags: article.data.tags || [],
          image: article.data.image || '',
          category: category, // 添加分类信息
          difficulty: article.data.difficulty || 'intermediate',
          url: `/articles/${article.slug.replace(/^tech\//, '')}` // 生成正确的URL
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // 按日期排序

    return new Response(JSON.stringify({
      total: formattedArticles.length,
      articles: formattedArticles
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('获取文章数据失败:', error);
    return new Response(JSON.stringify({
      error: '获取文章数据失败',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}