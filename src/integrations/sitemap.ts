import type { AstroIntegration } from 'astro';
import { getCollection } from 'astro:content';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// 获取技术类别
function getTechCategory(tags: string[] = []): string {
    const categories = {
        Windows: ["Windows", "PowerShell"],
        Linux: ["Linux", "Ubuntu", "CentOS", "Bash"],
        Python: ["Python", "Django", "Flask"],
        DevOps: ["Docker", "Kubernetes", "CI/CD", "自动化"]
    };

    for (const [category, keywords] of Object.entries(categories)) {
        if (tags.some(tag => keywords.includes(tag))) {
            return category;
        }
    }
    return "Technology";
}

export default function sitemapIntegration(): AstroIntegration {
    return {
        name: 'sitemap-integration',
        hooks: {
            'astro:build:done': async ({ dir }) => {
                try {
                    const articles = await getCollection('articles');
                    const siteUrl = process.env.SITE_URL || 'https://yourdomain.com';

                    // 生成URL列表
                    const urls = [
                        // 首页
                        {
                            url: siteUrl,
                            lastmod: new Date().toISOString(),
                            changefreq: 'daily',
                            priority: '1.0'
                        },
                        // 文章列表页
                        {
                            url: `${siteUrl}/articles`,
                            lastmod: new Date().toISOString(),
                            changefreq: 'daily',
                            priority: '0.9'
                        }
                    ];

                    // 添加分类页面
                    const categories = ['Windows', 'Linux', 'Python', 'DevOps'];
                    categories.forEach(category => {
                        urls.push({
                            url: `${siteUrl}/articles/category/${category.toLowerCase()}`,
                            lastmod: new Date().toISOString(),
                            changefreq: 'weekly',
                            priority: '0.8'
                        });
                    });

                    // 添加文章页面
                    articles.forEach((article) => {
                        urls.push({
                            url: `${siteUrl}/articles/${article.id}`,
                            lastmod: article.data.date.toISOString(),
                            changefreq: 'monthly',
                            priority: '0.7'
                        });
                    });

                    // 生成标签页面URL
                    const allTags = [...new Set(articles.flatMap(article => article.data.tags || []))];
                    allTags.forEach(tag => {
                        urls.push({
                            url: `${siteUrl}/articles/tag/${tag}`,
                            lastmod: new Date().toISOString(),
                            changefreq: 'weekly',
                            priority: '0.6'
                        });
                    });

                    // 生成sitemap.xml
                    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ url, lastmod, changefreq, priority }) => `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;

                    // 保存sitemap.xml
                    const outFile = path.join(fileURLToPath(dir), 'sitemap.xml');
                    writeFileSync(outFile, sitemap);
                    console.log('Generated sitemap.xml');

                    // 生成RSS feed
                    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>技术博客</title>
    <link>${siteUrl}</link>
    <description>技术教程、最佳实践和运维经验分享</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${articles
                            .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
                            .slice(0, 20)
                            .map(article => {
                                const category = getTechCategory(article.data.tags || []);
                                return `
    <item>
      <title><![CDATA[${article.data.title}]]></title>
      <link>${siteUrl}/articles/${article.id}</link>
      <pubDate>${article.data.date.toUTCString()}</pubDate>
      <category>${category}</category>
      ${article.data.tags?.map(tag => `<category>${tag}</category>`).join('\n      ')}
      <description><![CDATA[${article.data.summary || ''}]]></description>
    </item>`;
                            }).join('\n    ')}
  </channel>
</rss>`;

                    // 保存feed.xml
                    const rssFile = path.join(fileURLToPath(dir), 'feed.xml');
                    writeFileSync(rssFile, rss);
                    console.log('Generated feed.xml');

                } catch (error) {
                    console.error('Error generating sitemap:', error);
                }
            }
        }
    };
}