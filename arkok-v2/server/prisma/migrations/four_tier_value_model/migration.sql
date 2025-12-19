-- CreateTable
CREATE TYPE "TaskCategory" AS ENUM ('PROGRESS', 'METHODOLOGY', 'TASK', 'PERSONALIZED');

-- AlterTable
ALTER TABLE "task_records"
ADD COLUMN     "task_category" "TaskCategory" NOT NULL DEFAULT 'TASK',
ADD COLUMN     "is_current" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subject" TEXT;

-- AlterTable
ALTER TABLE "task_library"
ADD COLUMN     "value_dimension" TEXT;