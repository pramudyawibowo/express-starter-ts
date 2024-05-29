import { genSaltSync, hashSync, compareSync } from "bcrypt";

const hashPassword = async (password: string): Promise<string> => {
    const salt = genSaltSync(10);
    return hashSync(password, salt);
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return compareSync(password, hash);
};

export { hashPassword, comparePassword };
