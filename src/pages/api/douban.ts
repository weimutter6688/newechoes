import type { APIRoute } from 'astro';
import { load } from 'cheerio';

// 添加服务器渲染标记
export const prerender = false;

// 生成随机的bid Cookie值
function generateBid() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 11; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'movie';
  const start = parseInt(url.searchParams.get('start') || '0');
  const doubanId = url.searchParams.get('doubanId');  // 从查询参数获取 doubanId
  
  if (!doubanId) {
    return new Response(JSON.stringify({ error: '缺少豆瓣ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    let doubanUrl = '';
    if (type === 'book') {
      doubanUrl = `https://book.douban.com/people/${doubanId}/collect?start=${start}&sort=time&rating=all&filter=all&mode=grid`;
    } else {
      doubanUrl = `https://movie.douban.com/people/${doubanId}/collect?start=${start}&sort=time&rating=all&filter=all&mode=grid`;
    }

    // 生成随机bid
    const bid = generateBid();

    const response = await fetch(doubanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Cookie': `bid=${bid}`
      }
    });
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: '获取豆瓣数据失败' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const html = await response.text();
    const $ = load(html);
    
    // 添加类型定义
    interface DoubanItem {
      imageUrl: string;
      title: string;
      subtitle: string;
      link: string;
      intro: string;
      rating: number;
      date: string;
    }
    
    const items: DoubanItem[] = [];
    
    // 尝试不同的选择器
    let itemSelector = '.item.comment-item';
    let itemCount = $(itemSelector).length;
    
    if (itemCount === 0) {
      // 尝试其他可能的选择器
      itemSelector = '.subject-item';
      itemCount = $(itemSelector).length;
    }
    
    $(itemSelector).each((_, element) => {
      const $element = $(element);
      
      // 根据选择器调整查找逻辑
      let imageUrl = '';
      let title = '';
      let subtitle = '';
      let link = '';
      let intro = '';
      let rating = 0;
      let date = '';
      
      if (itemSelector === '.item.comment-item') {
        // 原始逻辑
        imageUrl = $element.find('.pic img').attr('src') || '';
        title = $element.find('.title a em').text().trim();
        subtitle = $element.find('.title a').text().replace(title, '').trim();
        link = $element.find('.title a').attr('href') || '';
        intro = $element.find('.intro').text().trim();
        
        // 获取评分，从rating1-t到rating5-t
        for (let i = 1; i <= 5; i++) {
          if ($element.find(`.rating${i}-t`).length > 0) {
            rating = i;
            break;
          }
        }
        
        date = $element.find('.date').text().trim();
      } else if (itemSelector === '.subject-item') {
        // 新的图书页面结构
        imageUrl = $element.find('.pic img').attr('src') || '';
        title = $element.find('.info h2 a').text().trim();
        link = $element.find('.info h2 a').attr('href') || '';
        intro = $element.find('.info .pub').text().trim();
        
        // 获取评分
        const ratingClass = $element.find('.rating-star').attr('class') || '';
        const ratingMatch = ratingClass.match(/rating(\d)-t/);
        if (ratingMatch) {
          rating = parseInt(ratingMatch[1]);
        }
        
        date = $element.find('.info .date').text().trim();
      }
      
      items.push({
        imageUrl,
        title,
        subtitle,
        link,
        intro,
        rating,
        date
      });
    });
    
    // 改进分页信息获取逻辑
    let currentPage = 1;
    let totalPages = 1;
    
    // 尝试从当前页码元素获取信息
    if ($('.paginator .thispage').length > 0) {
      currentPage = parseInt($('.paginator .thispage').text() || '1');
      // 豆瓣可能不直接提供总页数，需要计算
      const paginatorLinks = $('.paginator a');
      let maxPage = currentPage;
      paginatorLinks.each((_, el) => {
        const pageNum = parseInt($(el).text());
        if (!isNaN(pageNum) && pageNum > maxPage) {
          maxPage = pageNum;
        }
      });
      totalPages = maxPage;
    }
    
    const pagination = {
      current: currentPage,
      total: totalPages,
      hasNext: $('.paginator .next a').length > 0,
      hasPrev: $('.paginator .prev a').length > 0
    };
    
    return new Response(JSON.stringify({ items, pagination }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '获取豆瓣数据失败' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 