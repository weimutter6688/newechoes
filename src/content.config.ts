// 1. 从 `astro:content` 导入工具函数
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import fs from 'node:fs';
import path from 'node:path';

// 2. 定义内容结构接口
export interface ContentStructure {
  articles: string[];
  sections: SectionStructure[];
}

export interface SectionStructure {
  name: string;
  path: string;
  articles: string[];
  sections: SectionStructure[];
}

// 辅助函数：获取相对于content目录的路径
export function getRelativePath(fullPath: string, basePath = './src/content'): string {
  // 统一路径分隔符
  const normalizedPath = fullPath.replace(/\\/g, '/');
  const normalizedBasePath = basePath.replace(/\\/g, '/');
  
  // 移除基础路径
  let relativePath = normalizedPath;
  
  // 如果路径包含基础路径，则移除它
  if (normalizedPath.includes(normalizedBasePath)) {
    relativePath = normalizedPath.replace(normalizedBasePath, '');
  }
  
  // 移除开头的斜杠
  relativePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  
  // 如果路径以articles/开头，移除它（适配Astro内容集合）
  if (relativePath.startsWith('articles/')) {
    relativePath = relativePath.substring('articles/'.length);
  }
  
  return relativePath;
}

// 辅助函数：从文件路径中提取文件名（不带扩展名）
export function getBasename(filePath: string): string {
  // 统一路径分隔符
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // 分割路径并获取最后一部分（文件名）
  const parts = normalizedPath.split('/');
  const fileName = parts[parts.length - 1];
  
  // 移除扩展名
  const basename = fileName.replace(/\.(md|mdx)$/, '');
  
  return basename;
}

// 辅助函数：从文件路径中提取目录路径
export function getDirPath(filePath: string, basePath = './src/content'): string {
  const basename = getBasename(filePath);
  const relativePath = getRelativePath(filePath, basePath);
  
  // 移除文件名部分，获取目录路径
  const dirPath = relativePath.replace(`${basename}.md`, '').replace(/\/$/, '');
  
  return dirPath;
}

// 辅助函数：获取原始文件路径（移除特殊前缀）
export function getOriginalPath(specialPath: string): string {
  // 检查路径是否包含特殊前缀
  const parts = specialPath.split('/');
  const fileName = parts[parts.length - 1];
  
  // 如果文件名以下划线开头，移除它
  if (fileName.startsWith('_')) {
    const originalFileName = fileName.substring(1);
    const newParts = [...parts.slice(0, -1), originalFileName];
    return newParts.join('/');
  }
  
  return specialPath;
}

// 辅助函数：获取特殊文件路径（添加特殊前缀）
export function getSpecialPath(originalPath: string): string {
  // 检查文件名是否与其所在目录名相同或包含目录名
  const parts = originalPath.split('/');
  const fileName = parts[parts.length - 1].replace(/\.md$/, '');
  
  // 如果文件名与目录名相同或以目录名开头，则在文件名前添加特殊前缀
  if (parts.length > 1) {
    const dirName = parts[parts.length - 2];
    if (fileName.toLowerCase() === dirName.toLowerCase() || fileName.toLowerCase().startsWith(dirName.toLowerCase())) {
      // 创建一个新的路径，在文件名前添加下划线前缀
      const newFileName = fileName.startsWith('_') ? fileName : `_${fileName}`;
      const fileExt = originalPath.endsWith('.md') ? '.md' : '';
      const newParts = [...parts.slice(0, -1), newFileName + fileExt];
      return newParts.join('/');
    }
  }
  
  return originalPath;
}

// 3. 定义目录结构处理函数
function getContentStructure(contentDir = './src/content', basePath = './src/content'): ContentStructure {
  // 检查目录是否存在
  if (!fs.existsSync(contentDir)) {
    return { articles: [], sections: [] };
  }
  // 获取目录下的所有文件和文件夹
  const items = fs.readdirSync(contentDir, { withFileTypes: true });
  
  // 分离文章和目录
  const articles = items
    .filter(item => item.isFile() && item.name.endsWith('.md'))
    .map(item => {
      // 生成相对于content目录的路径，用于在页面中查找文章
      const fullPath = path.join(contentDir, item.name);
      // 将路径转换为相对于content目录的格式，并移除basePath
      const relativePath = fullPath.replace(basePath, '').replace(/^[\/\\]/, '');
      
      // 检查文件名是否与其所在目录名相同或包含目录名
      const pathParts = relativePath.split(/[\/\\]/);
      const fileName = pathParts[pathParts.length - 1].replace(/\.md$/, '');
      
      // 如果文件名与目录名相同或以目录名开头，则在文件名前添加特殊前缀
      if (pathParts.length > 1) {
        const dirName = pathParts[pathParts.length - 2];
        if (fileName === dirName || fileName.startsWith(dirName)) {
          // 创建一个新的路径，在文件名前添加下划线前缀
          const newFileName = `_${fileName}.md`;
          const newPathParts = [...pathParts.slice(0, -1), newFileName];
          return newPathParts.join('/');
        }
      }
      
      return relativePath.replace(/\\/g, '/');
    });
  
  // 获取子目录（作为章节）
  const sections: SectionStructure[] = items
    .filter(item => item.isDirectory())
    .map(item => {
      const sectionPath = path.join(contentDir, item.name);
      // 递归获取子目录的结构
      const sectionContent: ContentStructure = getContentStructure(sectionPath, basePath);
      
      // 确保路径格式正确，并移除basePath
      const relativePath = sectionPath.replace(basePath, '').replace(/^[\/\\]/, '');
      const normalizedPath = relativePath.replace(/\\/g, '/');
      
      return {
        name: item.name,
        path: normalizedPath,
        articles: sectionContent.articles,
        sections: sectionContent.sections
      };
    });
  
  return { articles, sections };
}

// 4. 定义你的集合
const articles = defineCollection({
  // 使用glob加载器从content目录加载所有markdown文件
  loader: glob({ 
    pattern: "**/*.md", 
    base: "./src/content"
  }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()).optional(),
    summary: z.string().optional(),
    image: z.string().optional(),
    author: z.string().optional(),
    draft: z.boolean().optional().default(false),
    // 添加section字段，用于标识文章所属的目录
    section: z.string().optional(),
    // 添加weight字段，用于排序
    weight: z.number().optional(),
  }),
});

// 6. 导出一个 `collections` 对象来注册你的集合
export const collections = { articles };

// 7. 导出内容结构，可以在构建时使用
export const contentStructure = getContentStructure();
