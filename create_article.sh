#!/bin/bash

# 定义颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 技术分类列表
declare -a categories=(
    "Windows"
    "Linux" 
    "Python"
    "DevOps"
    "Database"
    "Frontend"
    "Backend"
    "Cloud"
    "Security"
    "Network"
    "AI"
    "Mobile"
)

# 获取分类的标签数组
get_category_tags() {
    local category=$1
    case "${category,,}" in
        "windows")
            echo -e "Windows\nPowerShell\n系统管理"
            ;;
        "linux")
            echo -e "Linux\nShell\n系统管理"
            ;;
        "python")
            echo -e "Python\n编程\n自动化"
            ;;
        "devops")
            echo -e "DevOps\n自动化\nCI/CD"
            ;;
        "database")
            echo -e "Database\nSQL\n性能优化"
            ;;
        "frontend")
            echo -e "Frontend\nJavaScript\nWeb开发"
            ;;
        "backend")
            echo -e "Backend\nAPI\n服务端"
            ;;
        "cloud")
            echo -e "Cloud\n云计算\n架构"
            ;;
        "security")
            echo -e "Security\n安全\n漏洞防护"
            ;;
        "network")
            echo -e "Network\n网络\n协议"
            ;;
        "ai")
            echo -e "AI\n机器学习\n深度学习"
            ;;
        "mobile")
            echo -e "Mobile\nApp开发\n移动端"
            ;;
        *)
            echo -e "技术\n教程\n最佳实践"
            ;;
    esac
}

# 获取分类的技术栈
get_category_technologies() {
    local category=$1
    case "${category,,}" in
        "windows")
            echo -e "Windows Server 2022\nPowerShell 7\nWindows Admin Center"
            ;;
        "linux")
            echo -e "Ubuntu 22.04\nCentOS 8\nShell Script"
            ;;
        "python")
            echo -e "Python 3.11\npip\nvirtualenv"
            ;;
        "devops")
            echo -e "Docker\nKubernetes\nJenkins"
            ;;
        "database")
            echo -e "MySQL 8.0\nRedis\nPostgreSQL"
            ;;
        "frontend")
            echo -e "React\nTypeScript\nWebpack"
            ;;
        "backend")
            echo -e "Node.js\nSpring Boot\nMongoDB"
            ;;
        "cloud")
            echo -e "AWS\nDocker\nKubernetes"
            ;;
        "security")
            echo -e "OpenSSL\nFirewall\nWAF"
            ;;
        "network")
            echo -e "TCP/IP\nNGINX\nWireshark"
            ;;
        "ai")
            echo -e "TensorFlow\nPyTorch\nscikit-learn"
            ;;
        "mobile")
            echo -e "Flutter\nReact Native\niOS/Android"
            ;;
        *)
            echo -e "技术栈1\n技术栈2\n技术栈3"
            ;;
    esac
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}技术文章创建工具${NC}"
    echo "用法: ./create_article.sh [选项]"
    echo ""
    echo "选项:"
    echo "  -t, --title     文章标题（必需）"
    echo "  -c, --category  技术分类（必需）："
    echo ""
    echo "支持的分类:"
    for category in "${categories[@]}"; do
        echo "  - $category"
    done
    echo ""
    echo "示例:"
    echo "  ./create_article.sh -t \"Windows性能优化指南\" -c Windows"
    echo "  ./create_article.sh -t \"MySQL性能调优\" -c Database"
}

# 检查依赖
check_dependencies() {
    if ! command -v date &> /dev/null; then
        echo -e "${RED}错误: 未找到 date 命令${NC}"
        exit 1
    fi
}

# 验证分类
validate_category() {
    local category=$1
    local normalized_category=$(echo "$category" | tr '[:lower:]' '[:upper:]')
    for valid_category in "${categories[@]}"; do
        if [ "${valid_category^^}" = "$normalized_category" ]; then
            return 0
        fi
    done
    return 1
}

# 生成文件名
generate_filename() {
    local title=$1
    # 1. 转换为小写
    # 2. 保留中文和英文之间的空格
    # 3. 统一空格为连字符
    # 4. 移除其他特殊字符
    # 5. 处理多余的连字符
    echo "$title" | \
    tr '[:upper:]' '[:lower:]' | \
    sed -E 's/([[:alpha:]])([[:digit:]])/\1-\2/g' | \
    sed -E 's/([[:digit:]])([[:alpha:]])/\1-\2/g' | \
    sed -E 's/[[:space:]]+/-/g' | \
    sed -E 's/[^a-z0-9-]//g' | \
    sed -E 's/-+/-/g' | \
    sed -E 's/^-+|-+$//g'
}

# 格式化标签为YAML
format_tags() {
    while IFS= read -r tag; do
        echo "  - $tag"
    done
}

# 主函数
main() {
    local title=""
    local category=""

    # 解析参数
    while [[ "$#" -gt 0 ]]; do
        case $1 in
            -t|--title) title="$2"; shift ;;
            -c|--category) category="$2"; shift ;;
            -h|--help) show_help; exit 0 ;;
            *) echo -e "${RED}未知参数: $1${NC}"; show_help; exit 1 ;;
        esac
        shift
    done

    # 检查必需参数
    if [ -z "$title" ] || [ -z "$category" ]; then
        echo -e "${RED}错误: 标题和分类都是必需的${NC}"
        show_help
        exit 1
    fi

    # 验证分类
    if ! validate_category "$category"; then
        echo -e "${RED}错误: 无效的分类 '$category'${NC}"
        echo -e "有效的分类:"
        for category in "${categories[@]}"; do
            echo -e "  ${GREEN}- $category${NC}"
        done
        exit 1
    fi

    # 生成文件名
    filename=$(generate_filename "$title")
    directory="src/content/tech/${category,,}"  # 使用小写的分类名称
    filepath="$directory/$filename.mdx"

    # 创建目录（如果不存在）
    mkdir -p "$directory"

    # 检查文件是否已存在
    if [ -f "$filepath" ]; then
        echo -e "${RED}错误: 文件已存在: $filepath${NC}"
        exit 1
    fi

    # 获取标签和技术栈
    local tags_yaml=$(get_category_tags "$category" | format_tags)
    local tech_yaml=$(get_category_technologies "$category" | format_tags)

    # 创建文章内容
    cat > "$filepath" << EOF
---
title: "$title"
date: $(date +%Y-%m-%d)
summary: "简洁的技术描述（150字以内，包含关键技术词和目标读者）"
tags:
$tags_yaml
difficulty: "intermediate" # beginner/intermediate/advanced
technologies:
$tech_yaml
prerequisites:
  - 前置技术要求1
  - 前置技术要求2
image: "/images/${category,,}-cover.png"
---

## 技术背景

描述这个技术问题的背景和重要性...

## 环境要求

- 运行环境要求
- 相关软件版本
- 必要的配置

## 实现步骤

### 1. 第一步

详细的操作步骤...

\`\`\`bash
# 示例代码
command here
\`\`\`

### 2. 第二步

继续详细步骤...

## 常见问题

### 问题1：xxx

问题描述和解决方案...

### 问题2：xxx

问题描述和解决方案...

## 最佳实践

1. 实践建议1
2. 实践建议2
3. 注意事项

## 扩展阅读

- [相关文档1](链接)
- [相关文档2](链接)
- [进阶主题](链接)
EOF

    echo -e "${GREEN}成功创建文章: $filepath${NC}"
    echo -e "${BLUE}提示：${NC}"
    echo "1. 请完善文章的frontmatter信息"
    echo "2. 确保添加适当的技术标签"
    echo "3. 填写清晰的技术描述"
    echo "4. 添加相关的技术链接"
    echo ""
    echo -e "文章访问路径: ${GREEN}http://localhost:4321/articles/${category,,}/$filename${NC}"
    
    # 显示创建的文件内容预览
    echo -e "\n${BLUE}文章内容预览：${NC}"
    head -n 10 "$filepath"
}

# 检查依赖
check_dependencies

# 运行主函数
main "$@"