# PDF Splitter

一个简单、安全、跨平台的 PDF 拆分工具，完全在本地浏览器运行，保护您的数据隐私。

## 功能特点

*   **跨平台支持**：支持 PC、Mac、iOS、Android 等所有现代浏览器。
*   **本地处理**：所有文件操作均在浏览器中完成，无需上传服务器，安全可靠。
*   **灵活拆分**：默认每 30 页拆分一份，支持自定义每份页数。
*   **PWA 支持**：可安装到桌面或手机主屏幕，离线使用。
*   **响应式设计**：完美适配移动端和桌面端界面。

## 技术栈

*   React + TypeScript
*   Vite
*   Tailwind CSS
*   pdf-lib (PDF 处理)
*   lucide-react (图标)

## 开发指南

1.  克隆仓库
2.  安装依赖：`npm install`
3.  启动开发服务器：`npm run dev`
4.  构建生产版本：`npm run build`

## 部署

本项目配置了 GitHub Actions，推送到 `main` 分支时自动构建并部署到 GitHub Pages。

## 许可证

MIT License
