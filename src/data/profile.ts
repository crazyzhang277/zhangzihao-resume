import type { Project, ResumeContent } from '../types/content'

export const fallbackResume: ResumeContent = {
  profile: {
    name: '张梓皓',
    englishName: 'Zhang Zihao',
    birth: '2004.10',
    location: '广东广州',
    phone: '17302787402',
    email: '2773612084@qq.com',
    targetRoles: ['AIGC 视频生成工程师', 'AI 动画渲染师', 'AI 内容制作工程师'],
    status: '随时到岗 / 离岗状态',
    github: 'https://github.com/crazyzhang277',
    bio: '具备影视镜头语言思维与硬核代码开发能力的复合型 AIGC 工程师。精通 Seedance 2.0、可灵 AI、即梦 AI 等视频渲染引擎与提示词工程，擅长搭建标准化 AIGC 生产管线、调优多镜头角色一致性与肢体漂移。兼具 Python/PySide6 桌面解帧工具开发、Tampermonkey 油猴脚本与 OpenCV 计算机视觉/嵌入式硬件经验。',
  },
  impact: [
    { number: '40%', unit: '缩短', title: '渲染输出周期', subtitle: '搭建标准化 AIGC 生产管线', description: '从剧本拆解、分镜模板制作到资产整理，实现 AI 动画短剧批量化高效生产。' },
    { number: '30%', unit: '降低', title: '生成废片率', subtitle: '人脸变样与动作漂移调优', description: '建立角色种子资产库与 Prompt 参数调优方案，精准控制肢体稳定度与光影效果。' },
    { number: '100%', unit: '锁定', title: '多镜头特征一致性', subtitle: 'Seedance 2.0 资产库精控', description: '针对多镜头渲染难题，通过 Seed 锁定与特征提取，确保跨分镜角色人脸与服装 100% 连贯。' },
    { number: '55MB', unit: '压缩', title: 'SnapBatch Pro 引擎', subtitle: 'Python / PySide6 / UPX', description: '自主开发开源桌面解帧工具，使用 UPX 将 93MB 二进制体积压缩至 55MB，解决长视频解帧假死痛点。' },
  ],
  experience: [{
    company: '广州三阳开泰科技有限公司',
    department: 'AI 内容制作团队',
    role: 'AI 动画渲染师',
    period: '2026.04 — 至今',
    status: '离岗状态 · 随时到岗',
    duties: [
      { title: '剧本拆解与镜头语言规划', description: '负责 AI 动画短剧的视频生成与渲染制作，根据剧本需求拆解镜头语言，设计人物动作、场景构图及镜头运动方案 (推拉摇移/俯仰/景别切换)，将传统影视制作方法应用于 AI 视频生成流程，提升作品表现力与叙事效果。' },
      { title: 'AI 绘图与关键帧动态生成', description: '使用 AI 绘图及视频生成工具完成角色设计、场景搭建、关键帧制作和动态视频生成，高效推动动画内容批量化生产。' },
      { title: '提示词工程与参数精控', description: '编写和优化 AI 生成提示词 (Prompt Engineering)，针对人物一致性、场景连续性、影院级光影效果与镜头运动进行参数精准调整。' },
      { title: '画面质量与一致性调优', description: '负责 AI 视频生成后的质量优化，包括画面稳定性修复、角色动作调整、镜头衔接优化以及视觉效果提升，将生成废片率降低 30%。' },
      { title: '生产流程与资产规范搭建', description: '建立 AI 动画生产流程规范，包括角色资产管理、场景素材整理、分镜模板制作，提高团队批量化生产效率，使渲染输出周期缩短 40%。' },
    ],
  }],
  sop: [
    { title: '剧本拆解', description: '拆解镜头语言，设计人物动作、场景构图及推拉摇移、俯仰和景别切换。' },
    { title: '角色 Seed 与 Prompt', description: '建立角色种子资产库，编写并优化人物一致性、场景连续性、光影和镜头运动提示词。' },
    { title: '批量渲染', description: '完成角色设计、场景搭建、关键帧制作和动态视频生成，推动动画内容批量化生产。' },
    { title: '漂移修复与后期调色', description: '修复画面稳定性和角色动作，优化镜头衔接与视觉效果，并完成专业色彩调优。' },
  ],
  projects: [
    { id: 'personal-works', title: '个人 AIGC 动画与短剧渲染作品', category: 'AI 视频渲染 & 短剧管线', role: '主渲染师 / 镜头导演', tags: ['Seedance 2.0', '运镜精控', '剪映 (CapCut)', '达芬奇调色'], metrics: '单集短剧成片输出周期整体缩短 40%', description: '涵盖多风格 AIGC 动画短剧、高精镜头推演与影院级画面渲染作品。熟练拆解分镜语言，利用 Seedance 2.0、可灵 AI 等顶级 AI 渲染引擎实现高规格画面输出与后期调色。', portfolioUrl: 'https://pan.baidu.com/s/1AotwTgrK6VfiCGngumCKBA', portfolioPass: 'gdkm', highlights: ['熟练运用 Seedance 2.0、可灵 AI 与即梦 AI 进行多镜头运镜精控 (推拉摇移/俯仰) 与影院光影重构', '结合剪映 (CapCut) 与 DaVinci Resolve 进行节点级专业色彩调优、音效对齐与多轨剪辑', '建立个人 AIGC 渲染 SOP 标准分镜库与资产模板，显著提升动画短剧成片输出效率'] },
    { id: 'consistency-fix', title: '多镜头角色 100% 一致性与动作漂移修复方案', category: 'AIGC 核心技术攻关', role: 'AI 算法调优 / 资产工程师', tags: ['提示词工程', '角色一致性', '动作漂移修复', '种子资产库'], metrics: 'AI 生成画面废片率降低 30%', description: '针对多镜头渲染中角色人脸变样、服装漂移、肢体坍塌等行业核心痛点，建立角色种子资产库与 Prompt 参数调优，保持连续镜头 100% 特征锁定。', highlights: ['构建三维多角度 Character Seed 资产库，实现跨镜头的脸部与骨骼参考锁定', '优化提示词加权与负面提示词 (Negative Prompts)，消除动作切换过程中的画面噪点', '废片率从行业平均 45% 以上降低至 15% 极低区间'] },
    { id: 'snapbatch-pro', title: 'SnapBatch Pro — 桌面级视频帧批量提取引擎', category: '开源 Python 桌面工具', role: '独立开发者 / 开源作者', tags: ['Python', 'OpenCV Headless', 'PySide6 GUI', 'UPX 55MB 压缩'], metrics: 'GitHub 开源项目 · 体积从 93MB 极限压缩至 55MB', description: '专为 AIGC 视频素材整理与数据集预处理打造的高性能 Python/PySide6 桌面工具。解决长视频解帧 UI 假死痛点，利用 QThread 异步解耦与 UPX 二进制打包。', githubUrl: 'https://github.com/crazyzhang277/SnapBatchPro', highlights: ['使用 OpenCV Headless 与 QThread 异步线程，完美解决长视频解帧主界面冻结痛点', '采用 PyInstaller 模块化打包 + UPX 极致代码压缩，构建产物体积减少 40.8%', '支持按帧率、时间间隔、关键帧抽样，内置图像对比去重算法'] },
    { id: 'smart-logistics', title: '智慧物流多传感器数据采集与安防系统', category: '嵌入式软硬件项目', role: '硬件集成与 C 语言开发', tags: ['STM32', 'Zigbee 无线', 'C 语言', '传感器集成'], metrics: 'STM32 & Zigbee 硬件集成', description: '基于 STM32 单片机与 Zigbee 无线网络构建的硬件感应与数据采集系统，具备出色的工程动手能力与底层逻辑。', highlights: ['设计 STM32 主控与多路传感器 (温湿度/烟雾/红外障碍) 数据的实时采集与状态调度', '编写 Zigbee 无线自组网传输协议，实现库房节点数据低延迟无线汇聚', '实现硬件传感器信号轮询与安防异常状态响应逻辑'] },
  ],
  skills: [
    { name: 'AIGC 视频生成 & 渲染', skills: [{ name: 'Seedance 2.0', tag: '精控/Seed锁定' }, { name: '可灵 AI (Kling)', tag: '高帧率渲染' }, { name: '即梦 AI (Dreamina)', tag: '镜头衔接' }] },
    { name: '后期处理与调色', skills: [{ name: '剪映 (CapCut Pro)', tag: '音效/剪辑/节奏' }, { name: 'DaVinci Resolve', tag: '节点调色/影院光影' }, { name: 'Adobe Photoshop', tag: '修图/贴图合成' }, { name: 'Adobe Lightroom', tag: '色彩预设' }] },
    { name: '代码开发与工具编写', skills: [{ name: 'Python 程序设计', tag: '自动化脚本/数据处理' }, { name: 'OpenCV (Open Source Computer Vision)', tag: '机器视觉/图像处理' }, { name: 'PySide6 / PyQt GUI', tag: '桌面端应用' }, { name: 'QThread 异步编程', tag: '多线程解耦' }, { name: 'UPX 压缩打包', tag: '二进制体积优化' }, { name: 'Tampermonkey / JS', tag: 'Web 自动化/油猴脚本' }] },
    { name: '硬件与嵌入式', skills: [{ name: 'STM32 单片机', tag: '底层中断与外设' }, { name: 'Zigbee 通信 protocol', tag: '无线组网' }, { name: 'C 语言嵌入式开发', tag: '寄存器与驱动' }, { name: '多传感器集成', tag: '安防与采集' }] },
  ],
  education: [{ school: '广东科贸职业学院', major: '物联网应用技术 (大专)', period: '2023.09 — 2026.06', courses: ['《C语言程序设计》', '《Python程序设计》', '《嵌入式技术》', '《单片机原理及应用》'] }],
  awards: [{ title: '2024 广东省大学生计算机设计大赛 二等奖', level: '省级赛事', field: '智慧物流方向', date: '2024', description: '赛题方向：智慧物流方向。基于 Python 与 OpenCV 计算机视觉 (Open Source Computer Vision Library) 算法开发智慧物流系统，实现包裹检测定位、物流条码/二维码识别与智能分拣调度。' }],
  print: { pageSize: 'A4 portrait', pageCount: 1 },
}

export const fallbackProjects: Project[] = [
  { githubId: 1323937997, name: 'codex-antigravity-bridge', description: 'Let Codex supervise Google Antigravity agents through MCP with scoped tasks, plan-driven workflows, and parallel Git worktrees.', htmlUrl: 'https://github.com/crazyzhang277/codex-antigravity-bridge', language: 'Python', topics: ['agy', 'ai-agent', 'antigravity', 'codex', 'coding-agent', 'developer-tools', 'git-worktree', 'mcp', 'multi-agent', 'python'], stars: 0, forks: 0, updatedAt: '2026-08-09T08:50:18Z', visible: true, featuredRank: null, manualTitle: null, manualDescription: null },
  { githubId: 1327653729, name: 'zhangzihao-signal-archive', description: '', htmlUrl: 'https://github.com/crazyzhang277/zhangzihao-signal-archive', language: 'CSS', topics: [], stars: 0, forks: 0, updatedAt: '2026-08-08T12:18:26Z', visible: true, featuredRank: null, manualTitle: null, manualDescription: null },
  { githubId: 1318240022, name: 'zihao-personal-station', description: 'Zhang Zihao personal geek station', htmlUrl: 'https://github.com/crazyzhang277/zihao-personal-station', language: 'TypeScript', topics: [], stars: 0, forks: 0, updatedAt: '2026-08-07T16:25:09Z', visible: true, featuredRank: null, manualTitle: null, manualDescription: null },
  { githubId: 1308424125, name: 'zhangzihao-resume', description: '', htmlUrl: 'https://github.com/crazyzhang277/zhangzihao-resume', language: 'HTML', topics: [], stars: 0, forks: 0, updatedAt: '2026-07-28T08:55:19Z', visible: true, featuredRank: null, manualTitle: null, manualDescription: null },
  { githubId: 1242093948, name: '520-Prank-Review', description: '520-Prank-Review', htmlUrl: 'https://github.com/crazyzhang277/520-Prank-Review', language: 'HTML', topics: [], stars: 0, forks: 0, updatedAt: '2026-07-27T06:49:22Z', visible: true, featuredRank: null, manualTitle: null, manualDescription: null },
  { githubId: 1244801443, name: 'SnapBatchPro', description: '一个简单的批量提取视频帧工具', htmlUrl: 'https://github.com/crazyzhang277/SnapBatchPro', language: 'Python', topics: [], stars: 0, forks: 0, updatedAt: '2026-07-22T09:47:52Z', visible: true, featuredRank: null, manualTitle: null, manualDescription: null },
]
