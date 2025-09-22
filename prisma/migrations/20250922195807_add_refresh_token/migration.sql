-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "ref_token" TEXT,
ADD COLUMN     "ref_tokenExpireDate" TIMESTAMP(3);
