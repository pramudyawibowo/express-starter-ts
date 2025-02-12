import { prisma } from "../helpers/Prisma";

const otpExpiredTime = parseInt(process.env.OTP_EXPIRED_TIME || "5");
const otpTryDailyLimit = parseInt(process.env.OTP_TRY_DAILY_LIMIT || "5");
const otpThrottleLimit = parseInt(process.env.OTP_THROTTLE_LIMIT || "1");

export const generateOtp = (): string => {
    return Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0");
};

export const checkThrottle = async (phonenumber: string, type: string): Promise<{ throttling: boolean; remaining: number }> => {
    const otpData = await prisma.otp.findFirst({
        where: {
            user: {
                phonenumber,
            },
            type: type,
        },
        orderBy: {
            created_at: "desc",
        },
    });
    if (!otpData) return { throttling: false, remaining: 0 };

    const timeSinceLastOtp = (new Date().getTime() - new Date(otpData.created_at).getTime()) / 1000;
    if (timeSinceLastOtp < otpThrottleLimit * 60) {
        return { throttling: true, remaining: otpThrottleLimit * 60 - Math.floor(timeSinceLastOtp) };
    }

    return { throttling: false, remaining: 0 };
};

export const checkDailyLimit = async (phonenumber: string, type: string): Promise<boolean> => {
    const otpData = await prisma.otp.findMany({
        where: {
            user: {
                phonenumber,
            },
            type: type,
            created_at: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
        },
    });

    if (otpData.length >= otpTryDailyLimit) return true;

    return false;
};

export const sendOtp = async (phonenumber: string, otp: string, type: string) => {
    await prisma.user
        .findFirst({
            where: {
                phonenumber,
            },
        })
        .then(async (user) => {
            if (user) {
                await prisma.otp.create({
                    data: {
                        otp: otp,
                        type: type,
                        user: {
                            connect: {
                                id: user.id,
                            },
                        },
                    },
                });
            }
        });

    console.log(`Sending OTP to ${phonenumber}: ${otp}`);
};

export const verifyOtp = async (user_id: any, type: string, inputOtp: string): Promise<boolean> => {
    const otpData = await prisma.otp.findFirst({
        where: {
            user_id: user_id,
            otp: inputOtp,
            type: type,
        },
    });

    if (!otpData) throw new Error("Unauthorized");

    if ((new Date().getTime() - new Date(otpData.created_at).getTime()) / 60000 > otpExpiredTime) {
        throw new Error("OTP Expired");
    }

    return true;
};
