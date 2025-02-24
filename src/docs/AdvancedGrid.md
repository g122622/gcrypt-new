# AdvancedGrid 组件文档

---

## 简介

`AdvancedGrid` 是一个功能强大的响应式布局容器组件，提供多种布局模式、智能响应式断点系统和性能优化策略。适用于构建卡片流、瀑布流、砖石布局等多种复杂场景。

---

## 功能特性

-   🚀 4 种布局模式：Grid / Flex / 瀑布流 / 砖石布局
-   📱 响应式断点系统（兼容 Bootstrap 标准）
-   🧩 智能列数计算（支持 auto-fit/auto-fill）
-   🎛️ 间距响应式控制
-   ⚡ 窗口 resize 防抖优化

---

## 安装 & 基本使用

```html
<template>
    <AdvancedGrid :breakpoints="{ xs: 0, sm: 576, md: 768 }" :columns="{ xs: 1, sm: 2, md: 3 }" layout-mode="waterfall" :gap="15">
        <div v-for="item in 20" :key="item" class="custom-card">
            <!-- 你的自定义内容 -->
        </div>
    </AdvancedGrid>
</template>

<script setup>
    import AdvancedGrid from "./AdvancedGrid.vue";
</script>
```

---

## Props 配置

| 属性名           | 类型                                           | 默认值             | 说明                                            |
| ---------------- | ---------------------------------------------- | ------------------ | ----------------------------------------------- |
| breakpoints      | `{ [key: string]: number }`                    | Bootstrap 标准断点 | 定义响应式断点，格式：`{ xs: 0, sm: 576, ... }` |
| columns          | `number \| string \| { [bp]: value }`          | `'auto-fit'`       | 列数配置，支持响应式对象格式                    |
| layout-mode      | `'grid' \| 'flex' \| 'masonry' \| 'waterfall'` | `'grid'`           | 布局模式选择                                    |
| gap              | `number`                                       | `10`               | 间距等级或响应式配置                            |
| min-column-width | `string`                                       | `'200px'`          | auto-fit 模式下的最小列宽                       |
| debounce-resize  | `boolean`                                      | `true`             | 是否启用窗口 resize 防抖（200ms）               |

---

## 布局模式详解

### 1. Grid 模式 (默认)

```html
<AdvancedGrid layout-mode="grid" columns="auto-fit"></AdvancedGrid>
```

-   使用原生 CSS Grid 布局
-   支持 `auto-fit`/`auto-fill` 自动列数
-   推荐场景：等宽卡片流、图片墙

### 2. Flex 模式

```html
<AdvancedGrid layout-mode="flex" :columns="3"></AdvancedGrid>
```

-   使用 Flexbox 布局
-   固定列数布局
-   推荐场景：传统导航菜单、工具条

### 3. 瀑布流模式

```html
<AdvancedGrid layout-mode="waterfall" :columns="{ xs: 2, md: 3 }"></AdvancedGrid>
```

-   JavaScript 动态计算位置
-   自动填充最短列
-   推荐场景：高度不规则的卡片流

### 4. 砖石布局 (Masonry)

```html
<AdvancedGrid layout-mode="masonry" columns="auto-fill"></AdvancedGrid>
```

-   基于 CSS Columns 实现
-   自动填充水平空间
-   推荐场景：Pinterest 式布局

---

## 响应式配置

### 断点系统

默认使用 Bootstrap 5 的断点系统：

```js
{ xs: 0, sm: 576, md: 768, lg: 992, xl: 1200 }
```

### 响应式列数

```html
<AdvancedGrid :columns="{ xs: 1, sm: 2, md: 3, lg: 4 }" />
```

---

## 自定义样式

### 间距系统

参数为数字，单位为 `px` 。

### 自定义项目样式

```css
/* 在父组件样式表中 */
.advanced-grid :deep(.grid-item) {
    transition: transform 0.3s ease;
}

.advanced-grid :deep(.grid-item:hover) {
    transform: scale(1.02);
}
```

---

## 最佳实践

### 瀑布流布局建议

```html
<AdvancedGrid layout-mode="waterfall" :columns="{ xs: 2, md: 3, lg: 4 }" :min-column-width="'240px'">
    <div v-for="item in items" :key="item.id" class="waterfall-item" :style="{ height: item.height + 'px' }">
        <!-- 内容 -->
    </div>
</AdvancedGrid>
```

### 动态数据加载

```js
// 数据更新后重新计算布局
const loadMore = async () => {
    items.value.push(...newItems);
    await nextTick();
    container.value?.recalculateLayout?.();
};
```

---

## 注意事项

1. **性能优化**

    - 瀑布流模式建议配合虚拟滚动使用
    - 避免在单个容器中使用超过 500 个项目
    - 动态数据更新后调用 `recalculateLayout()`

2. **浏览器兼容性**

    - Grid 模式需要现代浏览器支持
    - 瀑布流模式兼容 IE11+

3. **子元素要求**
    - 必须设置 `key` 属性
    - 瀑布流模式下建议固定项目宽度

---

## 示例集合

### 基础网格布局

```html
<AdvancedGrid :columns="4" :gap="15">
    <div v-for="n in 12" class="card">...</div>
</AdvancedGrid>
```

### 响应式相册

```html
<AdvancedGrid :columns="{ xs: 2, sm: 3, lg: 4 }" :gap="15" layout-mode="masonry">
    <img v-for="img in images" :src="img.url" class="photo" />
</AdvancedGrid>
```

### 电商商品瀑布流

```html
<AdvancedGrid layout-mode="waterfall" :columns="{ xs: 1, md: 2, xl: 3 }" :debounce-resize="true">
    <ProductCard v-for="product in products" :product="product" class="h-auto" />
</AdvancedGrid>
```

---

## 问题排查

### 布局错位问题

1. 检查是否在 CSS 中覆盖了 `position` 属性
2. 确保所有子元素都有唯一的 `key`
3. 确认父容器没有设置 `overflow: hidden`

### 响应式失效

1. 检查断点配置是否正确定义
2. 确认没有多个断点使用相同的像素值
3. 确保浏览器视口宽度符合预期

---

通过这份文档，开发者可以快速掌握 `AdvancedGrid` 组件的核心功能和使用方法。组件设计兼顾灵活性和性能，能够满足大多数现代 Web 应用的布局需求。
