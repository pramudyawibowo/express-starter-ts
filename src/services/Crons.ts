import cron from "node-cron";
import { prisma } from "@helpers/Prisma";

export const startCrons = () => {
    console.log("Cron started");
};
