-- Supabase migration for AI Bootcamp Showcase Platform
-- This file should be run in your Supabase SQL editor

-- Create enum types
CREATE TYPE "UserRole" AS ENUM ('COACH', 'ACTIONIST', 'MEMBER', 'VOLUNTEER', 'STAFF', 'ADMIN');
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
CREATE TYPE "ProjectType" AS ENUM ('HTML_FILE', 'LINK');

-- Create bootcamps table
CREATE TABLE "bootcamps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bootcamps_pkey" PRIMARY KEY ("id")
);

-- Create users table
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "planetNumber" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "skillLevel" "SkillLevel" NOT NULL DEFAULT 'BEGINNER',
    "avatar" TEXT,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create projects table
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ProjectType" NOT NULL,
    "htmlFile" TEXT,
    "projectUrl" TEXT,
    "coverImage" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bootcampId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- Create votes table
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "bootcamps_name_key" ON "bootcamps"("name");
CREATE UNIQUE INDEX "users_planetNumber_key" ON "users"("planetNumber");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "votes_projectId_voterId_key" ON "votes"("projectId", "voterId");

-- Add foreign key constraints
ALTER TABLE "projects" ADD CONSTRAINT "projects_bootcampId_fkey" FOREIGN KEY ("bootcampId") REFERENCES "bootcamps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "votes" ADD CONSTRAINT "votes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "votes" ADD CONSTRAINT "votes_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE "bootcamps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "votes" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Bootcamps: Anyone can read, only admins can modify
CREATE POLICY "Anyone can view bootcamps" ON "bootcamps" FOR SELECT USING (true);
CREATE POLICY "Only admins can modify bootcamps" ON "bootcamps" FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "users"
        WHERE "users"."id" = auth.uid()::text
        AND "users"."role" = 'ADMIN'
    )
);

-- Users: Users can read their own data and public info
CREATE POLICY "Users can view public user info" ON "users" FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON "users" FOR UPDATE USING (auth.uid()::text = id);

-- Projects: Public read access, users can manage their own projects
CREATE POLICY "Anyone can view approved projects" ON "projects" FOR SELECT USING ("isApproved" = true);
CREATE POLICY "Users can view their own projects" ON "projects" FOR SELECT USING (auth.uid()::text = "authorId");
CREATE POLICY "Users can create projects" ON "projects" FOR INSERT WITH CHECK (auth.uid()::text = "authorId");
CREATE POLICY "Users can update their own projects" ON "projects" FOR UPDATE USING (auth.uid()::text = "authorId");

-- Votes: Users can vote and view votes
CREATE POLICY "Anyone can view votes" ON "votes" FOR SELECT USING (true);
CREATE POLICY "Users can create votes" ON "votes" FOR INSERT WITH CHECK (auth.uid()::text = "voterId");
CREATE POLICY "Users can delete their own votes" ON "votes" FOR DELETE USING (auth.uid()::text = "voterId");

-- Create trigger function for updating updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updatedAt
CREATE TRIGGER update_bootcamps_updated_at BEFORE UPDATE ON "bootcamps" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON "projects" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();