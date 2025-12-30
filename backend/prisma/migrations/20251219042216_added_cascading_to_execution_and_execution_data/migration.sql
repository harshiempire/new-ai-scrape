-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('ACTION', 'TRIGGER', 'CONDITION');

-- DropForeignKey
ALTER TABLE "execution_data" DROP CONSTRAINT "execution_data_executionId_fkey";

-- DropForeignKey
ALTER TABLE "executions" DROP CONSTRAINT "executions_workflowId_fkey";

-- CreateTable
CREATE TABLE "nodes" (
    "id" TEXT NOT NULL,
    "type" "NodeType" NOT NULL,
    "propertiesSchema" JSONB NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edges" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "edges_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "executions" ADD CONSTRAINT "executions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_data" ADD CONSTRAINT "execution_data_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
