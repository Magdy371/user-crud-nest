-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('User', 'Admin');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'User';
