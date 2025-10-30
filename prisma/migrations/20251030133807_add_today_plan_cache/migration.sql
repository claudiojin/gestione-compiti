-- CreateTable
CREATE TABLE `TodayPlan` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `summary` TEXT NOT NULL,
    `advice` TEXT NOT NULL,
    `focus` TEXT NOT NULL,
    `tasksHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TodayPlan_userId_key`(`userId`),
    INDEX `TodayPlan_userId_idx`(`userId`),
    INDEX `TodayPlan_tasksHash_idx`(`tasksHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TodayPlan` ADD CONSTRAINT `TodayPlan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
