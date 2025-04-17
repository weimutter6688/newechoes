interface Article {
    id: string;
    title: string;
    date: string;
    summary?: string;
    tags?: string[];
    image?: string;
    category: string;
    difficulty: string;
    url: string;
}

// 移除全局 searchData

// 获取文章数据 - 修改为接受查询参数并直接请求过滤后的数据
async function fetchArticles(query: string = ''): Promise<Article[]> {
    try {
        console.log(`Fetching articles with query: "${query}"...`);
        // 将查询参数附加到 URL
        const apiUrl = query ? `/api/search?q=${encodeURIComponent(query)}` : '/api/search';
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch articles (status: ${response.status})`);
        }
        const data = await response.json();
        console.log('Received articles data:', data);
        return data.articles || []; // 直接返回获取到的文章
    } catch (error) {
        console.error('Error fetching articles:', error);
        return [];
    }
}

// 搜索文章 - 修改为调用 API 获取过滤后的结果
async function searchArticles(query: string, elements: {
    list: HTMLElement | null;
    message: HTMLElement | null;
}) {
    if (!elements.list || !elements.message) {
        console.error('Missing required elements');
        return;
    }

    // 如果查询为空，清空列表并显示提示
    if (!query.trim()) {
        elements.list.innerHTML = '';
        elements.message.textContent = '输入关键词开始搜索';
        elements.message.style.display = 'block';
        return;
    }

    // 调用 API 获取过滤后的文章
    console.log('Searching via API for:', query);
    elements.message.textContent = '正在搜索...'; // 显示加载状态
    elements.message.style.display = 'block';
    elements.list.innerHTML = ''; // 清空旧结果

    const filteredArticles = await fetchArticles(query); // 传递 query

    console.log('Found articles via API:', filteredArticles.length);

    if (filteredArticles.length === 0) {
        elements.list.innerHTML = '';
        elements.message.textContent = '没有找到相关内容';
        elements.message.style.display = 'block';
        return;
    }

    elements.message.style.display = 'none';
    elements.list.innerHTML = filteredArticles
        .map(article => `
            <li>
                <a href="${article.url}" class="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors duration-200">
                    <h3 class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        ${article.title}
                    </h3>
                    ${article.summary ? `
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            ${article.summary}
                        </p>
                    ` : ''}
                    ${article.tags?.length ? `
                        <div class="flex flex-wrap gap-1 mt-1.5">
                            ${article.tags.slice(0, 3).map(tag => `
                                <span class="inline-block text-xs bg-primary-50/50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 py-0.5 px-1.5 rounded-full">
                                    #${tag}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                </a>
            </li>
        `)
        .join('');
}

// 防抖函数
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    return function (this: any, ...args: Parameters<T>): void {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// 初始化搜索
export function initSearch() {
    console.log('Initializing search...');

    const elements = {
        input: document.getElementById('desktop-search') as HTMLInputElement,
        results: document.getElementById('desktop-search-results'),
        list: document.getElementById('desktop-search-list'),
        message: document.getElementById('desktop-search-message')
    };

    if (!elements.input || !elements.results || !elements.list || !elements.message) {
        console.error('Missing search elements');
        return;
    }

    console.log('Search elements found:', elements);

    const debouncedSearch = debounce(async (query: string) => {
        console.log('Searching for:', query);
        await searchArticles(query, {
            list: elements.list,
            message: elements.message
        });
    }, 300);

    // 移除预加载数据逻辑

    // 设置事件监听
    elements.input.addEventListener('focus', () => {
        console.log('Search input focused');
        elements.results.classList.remove('hidden');
        // 移除 focus 时的加载逻辑，只在输入时搜索
        if (elements.input.value) {
            // 如果已有内容，可以触发一次搜索
            searchArticles(elements.input.value, { list: elements.list, message: elements.message });
        } else {
            // 如果为空，显示初始提示
            elements.message.textContent = '输入关键词开始搜索';
            elements.message.style.display = 'block';
            elements.list.innerHTML = '';
        }
    });

    elements.input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        console.log('Search input changed:', target.value);
        debouncedSearch(target.value);
    });

    // 点击外部关闭搜索结果
    document.addEventListener('click', (e) => {
        const target = e.target as Node;
        if (!elements.input.contains(target) && !elements.results.contains(target)) {
            elements.results.classList.add('hidden');
        }
    });

    console.log('Search initialization complete');
}
