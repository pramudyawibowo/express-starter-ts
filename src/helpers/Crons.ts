import cron from "node-cron";
import { prisma } from "./Prisma";

export const startCrons = () => {
    console.log("Cron started");
};
