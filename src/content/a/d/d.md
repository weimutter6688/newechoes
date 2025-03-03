---
title: "多级目录测试文章"
date: 2023-03-03
tags: ["测试", "多级目录"]
category: "测试分类"
summary: "这是一篇用于测试多级目录功能的文章"
---
## 1. 基础语法

### 1.1 粗体文本

```markdown
**这是粗体文本**
```

**这是粗体文本**

### 1.2 斜体文本

```markdown
*这是斜体文本*
```

*这是斜体文本*

### 1.3 粗斜体文本

```markdown
***这是粗斜体文本***
```

***这是粗斜体文本***

### 1.4 删除线文本

```markdown
~~这是删除线文本~~
```

~~这是删除线文本~~

### 1.5 无序列表

```markdown
- 第一项
  - 子项 1
  - 子项 2
- 第二项
- 第三项
```

- 第一项
  - 子项 1
  - 子项 2
- 第二项
- 第三项

### 1.6 有序列表

```markdown
1. 第一步
   1. 子步骤 1
   2. 子步骤 2
2. 第二步
3. 第三步
```

1. 第一步
   1. 子步骤 1
   2. 子步骤 2
2. 第二步
3. 第三步

### 1.7 任务列表

```markdown
- [x] 已完成任务
- [ ] 未完成任务
- [x] 又一个已完成任务
```

- [x] 已完成任务
- [ ] 未完成任务
- [x] 又一个已完成任务

### 1.8 行内代码

```markdown
这是一段包含`const greeting = "Hello World";`的行内代码
```

这是一段包含`const greeting = "Hello World";`的行内代码

### 1.9 代码块

````markdown
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function greet(user: User): string {
  return `Hello, \${user.name}!`;
}
```
````

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function greet(user: User): string {
  return `Hello, \${user.name}!`;
}
```

### 1.10 表格

```markdown
| 功能 | 基础版 | 高级版 |
|:-----|:------:|-------:|
| 文本编辑 | ✓ | ✓ |
| 实时预览 | ✗ | ✓ |
| 导出格式 | 2种 | 5种 |
```

| 功能 | 基础版 | 高级版 |
|:-----|:------:|-------:|
| 文本编辑 | ✓ | ✓ |
| 实时预览 | ✗ | ✓ |
| 导出格式 | 2种 | 5种 |

### 1.11 引用

```markdown
> 📌 **最佳实践**
> 
> 好的文章需要有清晰的结构和流畅的表达。
```

> 📌 **最佳实践**
> 
> 好的文章需要有清晰的结构和流畅的表达。

### 1.12 脚注

```markdown
这里有一个脚注[^1]。

[^1]: 这是脚注的内容。
```

这里有一个脚注[^1]。

[^1]: 这是脚注的内容。

### 1.13 表情符号

```markdown
:smile: :heart: :star: :rocket:
```

:smile: :heart: :star: :rocket:

### 1.14 可折叠内容

```markdown
<details>
<summary >
  🎯 如何选择合适的写作工具？
</summary>

选择写作工具时需要考虑以下几点：

1. **跨平台支持** - 确保在不同设备上都能访问
2. **实时预览** - Markdown 实时渲染很重要
3. **版本控制** - 最好能支持文章的版本管理
4. **导出功能** - 支持导出为多种格式
</details>
```

<details>
<summary>
  🎯 如何选择合适的写作工具？
</summary>

选择写作工具时需要考虑以下几点：

1. **跨平台支持** - 确保在不同设备上都能访问
2. **实时预览** - Markdown 实时渲染很重要
3. **版本控制** - 最好能支持文章的版本管理
4. **导出功能** - 支持导出为多种格式
</details>

### 1.15 引用式

```markdown
> 📌 **最佳实践**
> 
> 好的文章需要有清晰的结构和流畅的表达。以下是一些建议：
> 
> 1. 开门见山，直入主题
> 2. 层次分明，逻辑清晰
> 3. 语言简洁，表达准确
> 
> *— 写作指南*
```

> 📌 **最佳实践**
> 
> 好的文章需要有清晰的结构和流畅的表达。以下是一些建议：
> 
> 1. 开门见山，直入主题
> 2. 层次分明，逻辑清晰
> 3. 语言简洁，表达准确
> 
> *— 写作指南*


## 2. HTML排版

### 2.1 图文混排布局

```markdown
<div class="flex items-center gap-6 my-8">
  <img src="https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=400" 
       alt="写作工具" 
       class="w-1/3 rounded-lg shadow-lg" />
  <div class="flex-1">
    <h4 class="text-xl font-bold mb-2">高效写作工具</h4>
    <p>使用合适的写作工具可以极大提升写作效率。推荐使用支持即时预览的编辑器，这样可以实时查看排版效果。</p>
  </div>
</div>
```

<div class="flex items-center gap-6 my-8">
  <img src="https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=400" 
       alt="写作工具" 
       class="w-1/3 rounded-lg shadow-lg" />
  <div class="flex-1">
    <h4 class="text-xl font-bold mb-2">高效写作工具</h4>
    <p>使用合适的写作工具可以极大提升写作效率。推荐使用支持即时预览的编辑器，这样可以实时查看排版效果。</p>
  </div>
</div>



### 2.2 并排卡片

```markdown
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
  <div class="p-6 bg-gray-100 rounded-lg">
    <h4 class="text-lg font-bold mb-2">🚀 快速上手</h4>
    <p>通过简单的标记语法，快速创建格式化的文档，无需复杂的排版工具。</p>
  </div>
  <div class="p-6 bg-gray-100 rounded-lg">
    <h4 class="text-lg font-bold mb-2">⚡ 高效输出</h4>
    <p>专注于内容创作，让工具自动处理排版，提高写作效率。</p>
  </div>
</div>
```

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
  <div class="p-6 bg-gray-100 rounded-lg">
    <h4 class="text-lg font-bold mb-2">🚀 快速上手</h4>
    <p>通过简单的标记语法，快速创建格式化的文档，无需复杂的排版工具。</p>
  </div>
  <div class="p-6 bg-gray-100 rounded-lg">
    <h4 class="text-lg font-bold mb-2">⚡ 高效输出</h4>
    <p>专注于内容创作，让工具自动处理排版，提高写作效率。</p>
  </div>
</div>

### 2.4 高亮提示框

```markdown
<div class="p-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg my-8">
  <h4 class="text-lg font-bold text-blue-700 mb-2">💡 小贴士</h4>
  <p class="text-blue-600">在写作时，可以先列出文章大纲，再逐步充实内容。这可以保证文章结构清晰，内容完整。</p>
</div>
```

<div class="p-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg my-8">
  <h4 class="text-lg font-bold text-blue-700 mb-2">小贴士</h4>
  <p class="text-blue-600">在写作时，可以先列出文章大纲，再逐步充实内容。这样可以保证文章结构清晰，内容完整。</p>
</div>

### 2.5 时间线

```markdown
<div class="relative pl-8 my-8 border-l-2 border-gray-200">
  <div class="mb-8 relative">
    <div class="absolute -left-10 w-4 h-4 bg-blue-500 rounded-full"></div>
    <div class="font-bold mb-2">1. 确定主题</div>
    <p>根据目标受众和写作目的，确定文章主题。</p>
  </div>
  
  <div class="mb-8 relative">
    <div class="absolute -left-10 w-4 h-4 bg-blue-500 rounded-full"></div>
    <div class="font-bold mb-2">2. 收集资料</div>
    <p>广泛搜集相关资料，为写作做充实准备。</p>
  </div>
</div>
```

<div class="relative pl-8 my-8 border-l-2 border-gray-200">
  <div class="mb-8 relative">
    <div class="absolute -left-10 w-4 h-4 bg-blue-500 rounded-full"></div>
    <div class="font-bold mb-2">1. 确定主题</div>
    <p>根据目标受众和写作目的，确定文章主题。</p>
  </div>
  
  <div class="mb-8 relative">
    <div class="absolute -left-10 w-4 h-4 bg-blue-500 rounded-full"></div>
    <div class="font-bold mb-2">2. 收集资料</div>
    <p>广泛搜集相关资料，为写作做充实准备。</p>
  </div>
</div>



## 3. 总结

本文展示了 Markdown 从基础到高级的各种用法：

1. 基础语法：文本格式化、列表、代码、表格等
2. 高级排版：图文混排、叠面板、卡片布局等
3. 特殊语法：数学公式、脚注、表情符号等

> 💡 **提示**：部分高级排版功能可能需要特定的 Markdown 编辑器或渲染支持，请确认是否支持这些功能。