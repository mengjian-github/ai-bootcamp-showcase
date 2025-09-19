export interface Bootcamp {
  id: string
  name: string
  description?: string
  startDate: Date
  endDate?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  projects?: Project[]
}

export type UserRole = 'COACH' | 'ACTIONIST' | 'MEMBER' | 'VOLUNTEER' | 'STAFF'

export interface User {
  id: string
  nickname: string
  planetNumber: string
  role: UserRole
  avatar?: string
  email?: string
  createdAt: Date
  updatedAt: Date
  projects?: Project[]
  votes?: Vote[]
}

export type ProjectType = 'HTML_FILE' | 'LINK'

export interface Project {
  id: string
  title: string
  description?: string
  type: ProjectType
  htmlFile?: string
  projectUrl?: string
  coverImage: string
  voteCount: number
  isApproved: boolean
  createdAt: Date
  updatedAt: Date
  bootcampId: string
  bootcamp?: Bootcamp
  authorId: string
  author?: User
  votes?: Vote[]
}

export interface Vote {
  id: string
  createdAt: Date
  projectId: string
  project?: Project
  voterId: string
  voter?: User
}

export interface CreateProjectData {
  title: string
  description?: string
  type: ProjectType
  htmlFile?: File
  projectUrl?: string
  coverImage: File
  bootcampId: string
  author: {
    nickname: string
    planetNumber: string
    role: UserRole
    email?: string
  }
}