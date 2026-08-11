# 适合 AIGC 工程师单页作品集的高级网页动效研究

- 研究日期：2026-08-11
- 研究对象：作品集优先、单页长卷式的 AIGC 工程师个人简历网站
- 已知约束：不展示视频，不虚构项目视觉素材；真实项目以项目叙事、技术细节、GitHub 链接和量化结果为主
- 研究目标：提炼可落地的高级动效模式，并为后续前端重设计提供动效系统、性能和可访问性边界
- 取材原则：优先使用官方文档、平台一手设计文档和实际案例教程；不复制任何具体页面的布局、文案或视觉资产

## 结论摘要

这类简历最适合的“高级感”不是持续播放的背景特效，而是让滚动本身承担叙事：进入页面时建立身份，向下滚动时依次揭示项目成果、工作经历和能力证据，交互时再用短促的状态变化确认用户的操作。GSAP 官方文档支持用触发、scrub、pin 和 snap 建立滚动关系，但其说明也强调 ScrollTrigger 不会接管原生滚动；这个原则适合简历，因为招聘方需要可预测地阅读、跳转和复制信息。[S1](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

建议采用四层动效系统：

1. **进入层**：首屏身份信息、章节标题和项目条目只做一次性的透明度、位移和轻微 stagger 揭示。动效服务于内容层级，而不是把信息藏在动画后面。[S3](https://developer.apple.com/design/human-interface-guidelines/motion) [S4](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)
2. **滚动层**：用原生滚动驱动章节进度、时间线节点和少量视差；把连续 scrub 限定在一两个视觉锚点，避免整页每个元素都绑定滚动。[S1](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) [S2](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/)
3. **交互层**：项目条目、GitHub 链接和目录导航使用 hover/focus 的颜色、边界、箭头或小幅位移变化；鼠标与键盘 focus 复用同一套反馈，确保动效不依赖指针。[S3](https://developer.apple.com/design/human-interface-guidelines/motion) [S5](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
4. **降级层**：检测 prefers-reduced-motion: reduce 后移除大幅平移、缩放、视差、连续 scrub 和自动播放，只保留即时显示、颜色或边框状态变化。[S6](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

最高优先级的实现顺序是：原生滚动和可读内容 -> 首屏与章节揭示 -> 项目/经历的轻交互 -> 进度线和微型视差 -> 性能审计。这样即使 JavaScript 被禁用、设备性能较弱或用户关闭动效，履历信息仍然完整可读。[S4](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance) [S6](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

## 来源与一手事实

### S1. GSAP 官方 ScrollTrigger 文档

来源：[ScrollTrigger | GSAP | Docs & Learning](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

页面直接列出 scrub、pin、snap、触发点和滚动进度等能力；一个时间线也可以由 ScrollTrigger 控制。[S1](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

文档 FAQ 说明 ScrollTrigger 不会进行 scroll-jacking，原生滚动仍然有效；可选的 snap 只是对原生滚动位置做动画，并在用户再次滚动时释放控制。[S1](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

文档还提醒：固定元素的祖先节点上使用 transform 或 will-change 可能改变 position: fixed 的行为；当布局变化时需要刷新触发位置，固定触发器应按页面发生顺序创建或调用排序方法。[S1](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

**可迁移的工程原则**：ScrollTrigger 适合做“内容进入视口时的叙事控制”和“少数与滚动进度强关联的视觉锚点”，但不应成为夺取页面控制权的全屏滚动引擎。[S1](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

### S2. Codrops：Infinite GSAP Scroll Gallery

来源：[Building an Infinite GSAP Scroll Gallery with Parallax and Flip Transitions](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/)

案例将动效拆成三个模块：输入/滚动引擎、元素进入视口时的 reveal、点击条目到详情视图的 transition；实现使用 GSAP、Observer、Flip 和 SplitText。[S2](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/)

案例中的每个条目使用相对自身尺寸的 yPercent 做循环位移，用 y 单独叠加视差；作者还通过预渲染时间线避免首帧跳动，并根据移动距离计算持续时间以保持速度一致。[S2](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/)

案例明确说明，为了接管无限滚动，它关闭了原生滚动并设置 overflow: hidden、overscroll-behavior: none 和 touch-action: none。[S2](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/)

**可迁移的工程原则**：可以借鉴“滚动揭示 + 局部视差 + 条目到详情的状态变形”这套模块化思路；本项目不采用它的无限自定义滚动，因为简历需要保留原生滚动、锚点、浏览器返回和键盘阅读。[S2](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/)

### S3. Apple Human Interface Guidelines：Motion

来源：[Motion | Apple Developer Documentation](https://developer.apple.com/design/human-interface-guidelines/motion)

Apple 将 Motion 作为独立的界面设计原则来讨论，核心参考价值是让运动表达界面状态、层级、空间关系和操作结果，而不是把动画当作持续的装饰。[S3](https://developer.apple.com/design/human-interface-guidelines/motion)

**可迁移的工程原则**：在简历中，动效应回答“我刚刚进入了哪一章”“这个项目条目是否被选中”“这个链接是否获得 focus”等可理解的问题。对没有状态变化的背景，不增加持续动画。[S3](https://developer.apple.com/design/human-interface-guidelines/motion)

### S4. MDN：CSS and JavaScript animation performance

来源：[CSS and JavaScript animation performance | MDN](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)

MDN 对 CSS transition、CSS animation 和基于 requestAnimationFrame() 的 JavaScript 动画进行比较，并指出性能不能只按“CSS”或“JavaScript”二分，具体实现和更新的属性更重要。[S4](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)

**可迁移的工程原则**：高频动画优先使用不会改变文档流的视觉属性，例如 transform 和 opacity；涉及布局、复杂滤镜或大面积绘制的效果必须通过真实设备和 DevTools 验证，而不能只凭 API 名称判断快慢。[S4](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)

### S5. MDN：Intersection Observer API

来源：[Intersection Observer API | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

Intersection Observer 可以异步观察目标元素与视口或祖先容器的相交变化。MDN 将懒加载、无限滚动和“根据用户是否看得到结果来决定是否执行动画”列为适用场景。[S5](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

**可迁移的工程原则**：一次性 reveal、工作经历条目入场、项目卡片延迟初始化可以先用 Intersection Observer；只有需要连续跟随滚动进度的效果才交给 ScrollTrigger，从而减少无意义的持续更新。[S5](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) [S1](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

### S6. MDN：prefers-reduced-motion

来源：[prefers-reduced-motion CSS media feature | MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

prefers-reduced-motion 用于检测用户是否在设备上要求减少非必要运动。MDN 特别指出，大对象的缩放或平移可能触发前庭不适，因此不能只把 reduced-motion 当作“把持续时间调短”。[S6](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

**可迁移的工程原则**：reduced-motion 模式应切换到“内容立即出现 + 颜色/边框/静态进度状态”，而不是继续保留大幅位移、缩放、视差或自动播放。[S6](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

## 面向本项目的动效方案

### 1. 首屏：编辑型标题揭示

**位置**：姓名、AIGC 工程师定位、核心成果摘要、联系方式。

**模式**：页面加载后一次性执行三段式 reveal：章节眉题先出现，姓名/定位以短距离上移和透明度变化出现，成果数字最后以轻微 stagger 出现。不要让标题分字跳动到难以阅读，也不要把核心履历延迟到用户必须等待的 loading 状态。[S3](https://developer.apple.com/design/human-interface-guidelines/motion) [S4](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)

**建议参数**：位移控制在一个字高以内；每段 180-420ms；只使用一次；reduce 模式直接显示完整内容。这里的数值是本项目的设计建议，不是来源的原始规范。

### 2. 章节导航：滚动进度与活动章节

**位置**：固定在桌面端侧边或顶部的章节导航，移动端改为简洁的当前章节标记。

**模式**：用一条极细的进度线和活动章节颜色变化表达阅读位置。进度线可以由 ScrollTrigger 的滚动进度驱动；章节高亮使用触发区间，不需要每一帧读取布局。[S1](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

**边界**：导航必须是可点击的原生锚点；不做全屏 snap，不锁住滚轮，不把用户的滚动速度改造成固定的“镜头”。ScrollTrigger 的官方 FAQ 对原生滚动保留的说明支持这一选择。[S1](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

### 3. 项目区：案例条目的 reveal 与轻微视差

**位置**：除 GitHub 外的真实项目案例、项目标题、角色、技术栈、成果数据和外部作品入口。

**模式**：项目条目进入视口时，先显示结构线和标签，再显示标题和成果；项目条目内部的装饰性网格、编号或状态线只做很小的 scrub 视差。没有视频时，不用空白的视频框替代，可以用排版、代码片段、指标和链接组成“可验证的项目证据面板”。进入揭示与局部视差的组合来自 Codrops 案例，但不复制其图库布局。[S2](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/)

**性能做法**：用 Intersection Observer 先判断项目是否接近视口；进入后再初始化一次性 reveal。连续视差只更新 transform，避免同步改变宽高、边距或位置造成布局重排。[S5](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) [S4](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)

### 4. 工作经历：时间线的“证据推进”

**位置**：工作经历、职责、SOP、工作成果。

**模式**：时间线主轴保持静态可读；当每个经历条目进入视口时，仅让节点、年份和内容依次出现。用户滚动回看时可以重复或保持已揭示状态，但不能因为动画尚未触发而看不到正文。[S3](https://developer.apple.com/design/human-interface-guidelines/motion) [S5](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

**高级感来源**：把“主轴线推进”绑定到内容顺序，把“成果数字/关键词出现”绑定到条目进入视口，形成编辑型节奏；不要使用无限循环、漂浮粒子或与履历无关的 3D 背景。[S3](https://developer.apple.com/design/human-interface-guidelines/motion) [S5](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

### 5. 项目条目交互：从索引到证据

**位置**：项目索引、GitHub 按钮、外部网盘入口、项目展开/收起区域。

**模式**：桌面端 hover 和所有设备的 keyboard focus 都提供同样的反馈：边界颜色变化、箭头小幅位移、摘要展开或信息层级提升。若需要“条目放大到详情”的视觉效果，可参考 Codrops 的 Flip 思路，让同一条目在索引和详情间做连续变形；但对单页简历更建议使用原地展开，避免打断阅读上下文。[S2](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/) [S3](https://developer.apple.com/design/human-interface-guidelines/motion)

**无障碍要求**：交互不能只由 hover 触发；focus 状态必须可见；展开内容应存在于正常 DOM 顺序中，且关闭/返回后焦点位置可预期。这些是针对简历交互的实现要求，动效只承担反馈，不承担信息存储。[S3](https://developer.apple.com/design/human-interface-guidelines/motion) [S6](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

### 6. 技能与教育：静态信息优先

**位置**：技能矩阵、教育背景、竞赛荣誉。

**模式**：不使用会暗示主观精确度的“技能百分比动画”。优先使用分类、工具名、使用场景和证书/荣誉事实；若需要动效，只在章节首次进入时让分组顺序出现。[S3](https://developer.apple.com/design/human-interface-guidelines/motion)

## 动效系统建议

下表是针对该项目的实现基线；时长和距离是设计提案，来源列用于说明其工程依据。

| 层级 | 推荐效果 | 初始基线 | 适用内容 | 来源依据 |
| --- | --- | --- | --- | --- |
| Essential | opacity + 小幅 translateY | 180-260ms，一次 | 首屏、章节标题、时间线节点 | 动效表达层级和状态；低成本属性优先。[S3](https://developer.apple.com/design/human-interface-guidelines/motion) [S4](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance) |
| Contextual | stagger + border/color transition | 260-420ms | 项目元数据、成果列表、技能分组 | 进入视口后再处理可见内容。[S5](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) |
| Scroll-linked | scrub + 轻微 translate/scale | 跟随滚动，不持续自播 | 章节进度、主轴线、单个装饰锚点 | ScrollTrigger 的 scrub 和进度模型。[S1](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) |
| Transformative | Flip 或原地展开 | 仅由明确点击触发 | 项目索引到项目证据 | Codrops 的模块化 transition 思路。[S2](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/) |
| Reduced | 立即显示 + color/border 状态 | 0ms 或极短 | 全站 | prefers-reduced-motion 的用户偏好。[S6](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) |

## 性能与可访问性清单

### 必须满足

- 所有工作经历、职责、SOP、项目成果、技能、教育、荣誉和联系方式在初始 DOM 中存在；动画失败不能造成内容缺失。[S3](https://developer.apple.com/design/human-interface-guidelines/motion) [S6](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- 保留浏览器原生滚动、锚点、复制、键盘 Tab 和返回行为；不使用全屏 scroll-jacking。[S1](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) [S2](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/)
- 对进入视口的 reveal 使用 Intersection Observer；不要给整页每一个节点都安装持续的滚动监听。[S5](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- 高频动画优先更新 transform 和 opacity；任何大面积滤镜、阴影、布局属性或复杂 canvas 都要用低端移动设备实测。[S4](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)
- prefers-reduced-motion: reduce 下取消大幅缩放、平移、视差、自动播放和连续 scrub，确保替代状态仍然清楚。[S6](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- hover 与 focus 使用相同的状态反馈；点击展开项目后，焦点、标题层级和关闭路径保持可理解。这是对 Apple“动效表达关系和状态”原则的网页实现。[S3](https://developer.apple.com/design/human-interface-guidelines/motion)

### 应当避免

- 无限循环滚动、滚轮接管、强制吸附到整屏、长时间等待的入场动画。[S1](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) [S2](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/)
- 让正文、工作经历或成果数字依赖 JavaScript 动画才能显示。[S4](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)
- 在所有组件上同时使用模糊、混合模式、3D 旋转、粒子和持续视差，造成注意力竞争和绘制压力。[S3](https://developer.apple.com/design/human-interface-guidelines/motion) [S4](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)
- 在 ScrollTrigger 固定节点的祖先元素上滥用 transform 或 will-change，导致固定定位和刷新位置异常。[S1](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- 直接复刻 Codrops 或其他作品的图库结构、动线、文案和素材；只吸收可解释的动效机制，并将其重新映射到真实简历内容。[S2](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/)

## 后续落地顺序

1. 建立无动效基线：先完成单页语义结构、章节锚点、GitHub/外部链接、工作经历和全部履历内容。
2. 加入首屏 reveal 与章节 reveal：使用统一 easing、距离和 stagger，并验证刷新、深链和键盘阅读。
3. 加入项目与工作时间线：先用 Intersection Observer 做一次性触发，再为进度线和一个装饰锚点增加 ScrollTrigger scrub。
4. 加入项目原地展开或轻量 Flip：只服务于从“项目标题”到“项目证据”的阅读转换，不增加视频依赖。
5. 加入 prefers-reduced-motion、移动端降级和低端设备检查：至少检查 375px 移动端、桌面端、键盘 Tab、触摸滚动、系统减弱动态效果和 JavaScript 失败状态。
6. 用浏览器性能面板检查滚动帧率、布局抖动、长任务和图片/字体加载；若某个效果不能同时满足可读性和流畅度，保留内容、删除效果。[S4](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)

## 研究边界

本研究只产出设计和工程决策依据，没有修改应用代码，也没有提交 Git。后续实现可以选择 GSAP，或用 CSS transitions、Intersection Observer 和 Web Animations API 完成同样的分层逻辑；具体库的选择应以现有项目依赖和构建方式为准。[S1](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) [S4](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)

## 来源索引

| 编号 | 来源 | 类型 | 访问日期 |
| --- | --- | --- | --- |
| S1 | [GSAP ScrollTrigger 官方文档](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) | 官方 API 文档 | 2026-08-11 |
| S2 | [Codrops: Building an Infinite GSAP Scroll Gallery with Parallax and Flip Transitions](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/) | 实际案例教程 | 2026-08-11 |
| S3 | [Apple Human Interface Guidelines: Motion](https://developer.apple.com/design/human-interface-guidelines/motion) | 官方设计指南 | 2026-08-11 |
| S4 | [MDN: CSS and JavaScript animation performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance) | Web 平台工程文档 | 2026-08-11 |
| S5 | [MDN: Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) | Web 平台 API 文档 | 2026-08-11 |
| S6 | [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) | Web 可访问性文档 | 2026-08-11 |
