# 张梓皓 AIGC 简历网站重设计规格

## 状态

待用户审阅。本文是设计规格，不包含应用实现代码。

## 目标

将现有静态构建产物重建为一个单页长卷式、作品集优先的 AIGC 技术简历网站。页面需要同时承担三件事：

1. 用编辑型技术作品集的视觉语言展示张梓皓的 AIGC 视频生成与 AI 动画渲染能力。
2. 保留完整工作经历、AI 动画生产 SOP、项目、技能、教育背景、竞赛荣誉和联系方式。
3. 通过 Supabase 后台管理履历内容，并自动同步 GitHub 项目，让项目列表不再依赖前端硬编码。

PDF 是独立输出：严格为单页 A4，突出 AI 动画岗位和高信号成果，弱化 GitHub 项目，不受网页动效影响。

## 已确认约束

- 网页采用单页长卷式结构。
- 视觉方向采用编辑型技术作品集。
- 动效采用 A+B：编辑电影感 + 受控 3D/WebGL 视觉层。
- 不直接展示视频，不虚构作品截图；项目证据使用真实数据、项目叙事、GitHub 链接和已有外部作品入口。
- 主页面完整展示同步得到的 GitHub 项目。
- `zeroaigen-auto-mention` 永久排除，即使它仍存在于 GitHub，也不进入项目列表。
- GitHub 同步目标为 `crazyzhang277` 的公开仓库；默认过滤 Fork 和归档仓库。
- 使用 Supabase 作为内容后台、数据库和同步任务承载平台。
- 保留 PDF 预览/打印功能，并输出严格单页 A4。
- 动效必须支持桌面、移动端降级和 `prefers-reduced-motion`。

## 视觉方向

### 视觉世界

页面不使用黑色主背景，也不再沿用现有的浅灰卡片和苹果玻璃拟态作为主语言。新的基调是浅色纸张底、深色正文和 Google 四色关系启发的红、黄、绿、蓝动态色场，配合大字号编辑型排版和严谨的工程元数据。四色只作为色彩关系参考，不复制 Google 标志或品牌图形。

全页背景使用 Chromatic Flow Field：彩色丝带和连续流场缓慢运动，形成动态但不喧闹的底层空间。章节转场和项目区加入 Color Editorial Grid，以移动网格、色块切片和排版分隔制造编辑节奏。首屏可叠加程序化的 AI 渲染实验场，使用光带、网格、粒子、景深和参数标签构成技术气质；它是抽象的品牌视觉，不冒充真实作品。移动端将高成本动态层降级为静态海报式画面，保证文本和操作优先。

### 动效原则

- 首屏只执行一次短促 reveal，不用长时间 loading 隐藏简历内容。
- 主背景的色彩流动保持低频和低对比度，不使用黑色大面积底色、离散渐变气泡或持续闪烁。
- 章节标题、工作时间线和项目卡片使用 Intersection Observer 触发一次性入场。
- Hero、章节进度线和项目局部使用少量 scroll-linked scrub；保留浏览器原生滚动，不做 scroll-jacking。
- 项目卡片的 hover 和 keyboard focus 使用同一套反馈，支持轻微深度、边界和箭头状态变化。
- 3D 层只更新 `transform`、`opacity` 等适合高频动画的属性；页面不可依赖动画才能读取内容。
- `prefers-reduced-motion: reduce` 下取消平移、缩放、视差、自动播放和连续 scrub，直接显示完整内容。

动效依据记录在 [portfolio-motion-research.md](../../research/2026-08-11-portfolio-motion-research.md)，参考了 [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)、[Codrops 动效案例](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/)、[Apple Motion 指南](https://developer.apple.com/design/human-interface-guidelines/motion)、[MDN 动画性能](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)、[Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) 和 [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)。只借鉴机制，不复制页面布局、文案或资产。

## 页面结构

### 1. Hero / 定位

展示姓名、英文名、AIGC 视频生成与 AI 动画渲染师定位、个人简介、到岗状态、主要联系方式和三个高信号指标。主 CTA 指向项目区，次 CTA 用于复制联系方式或打开 PDF。

### 2. Impact / 量化成果

展示渲染周期缩短 40%、生成废片率降低 30%、多镜头特征一致性 100%、SnapBatch Pro 压缩至 55MB 等现有成果。数字可在进入视口时计数，但实际内容在初始 DOM 中可读。

### 3. Experience / 工作经历

保留公司、岗位、时间、完整职责和成果。使用垂直时间线组织信息，AI 动画生产 SOP 作为相邻的流程图展示：剧本拆解、角色 Seed 与 Prompt、批量渲染、漂移修复与后期调色。

### 4. Projects / GitHub 项目

项目数据来自 Supabase 同步缓存，不在前端写死项目数组。主页面完整展示所有满足同步规则且可见的仓库，按照人工置顶顺序、更新时间排序。

每个项目卡至少包含：仓库名称、项目描述、主要语言、Topics、Star/Fork、最近更新时间、GitHub 链接和可选的人工补充说明。项目卡可原地展开技术细节，但展开内容必须存在于正常 DOM 顺序中。

`zeroaigen-auto-mention` 使用稳定仓库 ID 和仓库名双重排除。GitHub 后续同步不会重新将其写入可见项目列表。

### 5. Skills / 技能矩阵

分为 AIGC 视频生成与渲染、后期处理与调色、代码开发与工具编写、硬件与嵌入式四组。使用分类切换和工具标签，不使用没有客观依据的百分比能力条。

### 6. Education / 教育与荣誉

保留广东科贸职业学院、物联网应用技术、就读时间、核心课程、省级竞赛和奖项说明。该区域以静态信息为主，只做轻量章节入场。

### 7. Contact / 联系

保留电话、邮箱、现居城市、到岗状态、GitHub 个人主页、PDF 预览/打印入口。复制操作要有明确的成功状态和键盘可访问反馈。

## Supabase 后台设计

### 数据表

- `profile_content`：姓名、英文名、职位、简介、状态、联系方式和站点设置。
- `experience`：公司、部门、岗位、时间和排序。
- `experience_items`：工作职责、成果、排序和所属经历。
- `projects`：GitHub 稳定 ID、名称、描述、URL、语言、Topics、Star、Fork、更新时间、同步时间、可见状态、置顶顺序和人工覆盖字段。
- `skills`：技能分组、名称、标签和排序。
- `education`：学校、专业、时间、课程和排序。
- `awards`：竞赛名称、级别、年份、说明和排序。
- `sync_runs`：同步开始/结束时间、状态、读取数量、写入数量、过滤数量和错误摘要。
- `project_exclusions`：被排除的 GitHub 仓库 ID、仓库名、原因和创建时间。

### 权限

- 公共页面只能读取已发布的履历内容和可见项目。
- 管理员通过 Supabase Auth 登录后才能编辑履历、修改项目显示状态和触发同步。
- 每张公开读取的表启用 RLS；写入策略只允许管理员用户。
- GitHub Token 和 Supabase service role key 只存在于 Edge Function 的服务器端密钥中，不进入浏览器。

### GitHub 同步流程

1. 定时任务或管理员手动触发 Edge Function。
2. 按页读取 `crazyzhang277` 的公开仓库。
3. 过滤 Fork、归档仓库和 `zeroaigen-auto-mention`，并检查 `project_exclusions`。
4. 以 GitHub 稳定仓库 ID 执行 upsert，更新同步字段，保留人工覆盖字段。
5. 对本次未返回的历史仓库标记为不可见或 stale，不直接删除。
6. 写入 `sync_runs`，前台显示最近成功同步时间；失败时继续使用上一次成功缓存。

同步任务不在每次页面访问时调用 GitHub，避免速率限制、加载抖动和外部服务故障影响简历阅读。

## PDF 输出

网页和 PDF 使用同一份 Supabase 履历数据，但采用独立布局组件。

- 页面尺寸固定为 `210mm x 297mm`，只允许一页。
- 打印时隐藏导航、3D Canvas、项目动效、装饰背景和后台状态。
- PDF 保留职业定位、简介、工作经历、核心职责、量化成果、AI 动画 SOP 摘要、技能、教育、荣誉和联系方式。
- GitHub 项目以紧凑的技术证明形式出现，不抢占 AI 动画岗位的主要篇幅。
- 生成前要在浏览器中验证打印预览的页数、溢出、文字截断和链接可读性。

## 错误与降级

- GitHub 同步失败：保留上一次同步数据，后台显示错误摘要和重试入口。
- Supabase 暂时不可用：页面使用最近一次构建缓存或本地初始数据，不显示空白页。
- GitHub 仓库缺少描述：显示仓库语言、Topics 和人工补充字段；不伪造项目内容。
- 3D 初始化失败：保留 Hero 文本和指标，切换到静态视觉背景。
- 动效被关闭或浏览器不支持：所有正文、项目和链接直接可见。
- 移动端：关闭高成本 3D 和指针交互，保持正常滚动与完整信息。

## 技术边界

- 重建为可维护的 React + Vite 源码结构，替换当前仅有的构建产物维护方式。
- 使用 Supabase JS 访问公开内容和管理员数据；Edge Function 负责 GitHub 同步。
- 使用 GSAP ScrollTrigger 处理少量连续滚动效果，使用原生 Intersection Observer 处理一次性入场。
- 使用 Three.js 或等价的轻量 WebGL 层承载 Hero 3D 视觉，并提供静态降级。
- 使用 Canvas/WebGL 承载 Chromatic Flow Field；在低端设备、移动端或 WebGL 初始化失败时切换为静态四色网格。
- 使用语义 HTML、键盘焦点、可见 focus 状态和 `prefers-reduced-motion`。
- 不加入视频播放器、视频自动轮播或虚构作品素材。

## 验收标准

### 内容

- 工作经历、SOP、技能、教育、荣誉、联系方式和项目内容均可从后台读取。
- GitHub 项目区显示全部符合规则的可见仓库，并永久排除 `zeroaigen-auto-mention`。
- 管理员可以编辑履历、置顶/隐藏项目并手动触发同步。

### 交互与动效

- 桌面端完成 Hero、章节 reveal、时间线、项目展开和导航跳转验证。
- 移动端无横向溢出、文字遮挡、滚动锁死或 3D 空白区域。
- 键盘 Tab 可以访问导航、项目链接、复制按钮、同步状态和 PDF 入口。
- `prefers-reduced-motion` 下内容直接可见，功能不依赖动效。

### PDF

- 打印结果只有一页 A4。
- 无截断、溢出、空白页或动效残留。
- AI 动画岗位定位、工作经历和量化成果优先可读。

### 工程

- 同步失败不会清空上一次可用项目数据。
- RLS 阻止未登录用户写入内容。
- 浏览器控制台无未解释的应用错误。
- 在桌面和移动视口完成真实页面截图验收。

## 暂定假设

- GitHub 仓库公开可访问，账号为 `crazyzhang277`。
- Supabase 项目、管理员账号和必要的 GitHub Token 在实现阶段提供或配置。
- 当前 GitHub Pages 静态部署将调整为前端静态托管 + Supabase 后端服务。
- 研究文档中的中文显示异常需要在后续提交前统一修复为 UTF-8 可读文本。
