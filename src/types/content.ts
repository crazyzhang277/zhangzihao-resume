export type Profile = {
  name: string
  englishName: string
  birth: string
  location: string
  phone: string
  email: string
  targetRoles: string[]
  status: string
  github: string
  bio: string
}

export type ImpactMetric = {
  number: string
  unit: string
  title: string
  subtitle: string
  description: string
}

export type Duty = { title: string; description: string }

export type Experience = {
  company: string
  department: string
  role: string
  period: string
  status: string
  duties: Duty[]
}

export type SopStep = { title: string; description: string }

export type Skill = { name: string; tag: string }
export type SkillGroup = { name: string; skills: Skill[] }

export type Education = {
  school: string
  major: string
  period: string
  courses: string[]
}

export type Award = {
  title: string
  level: string
  field: string
  date: string
  description: string
}

export type PortfolioProject = {
  id: string
  title: string
  category: string
  role: string
  tags: string[]
  metrics: string
  description: string
  highlights: string[]
  githubUrl?: string
  portfolioUrl?: string
  portfolioPass?: string
}

export type PrintContent = {
  pageSize: 'A4 portrait'
  pageCount: 1
}

export type ResumeContent = {
  profile: Profile
  impact: ImpactMetric[]
  experience: Experience[]
  sop: SopStep[]
  projects: PortfolioProject[]
  skills: SkillGroup[]
  education: Education[]
  awards: Award[]
  print: PrintContent
}

export type Project = {
  githubId: number
  name: string
  description: string
  htmlUrl: string
  language: string | null
  topics: string[]
  stars: number
  forks: number
  updatedAt: string
  visible: boolean
  featuredRank: number | null
  manualTitle: string | null
  manualDescription: string | null
}

export interface ContentRepository {
  getResume(): Promise<ResumeContent>
  getProjects(): Promise<Project[]>
}
