import fs from "fs";
import path from "path";

const saveFile = async (
    file: Express.Multer.File,
    directory: string,
    filename?: string,
    maxFileSize: number = 5 * 1024 * 1024, // 5 MB
): Promise<string> => {
    if (file.size > maxFileSize) {
        throw new Error(`File ${file.originalname} exceeds the maximum allowed size of ${maxFileSize / (1024 * 1024)}MB.`);
    }
    let uploadDir = "public/storage/media";
    if (directory)
        uploadDir = process.env.STORAGE_PATH ? path.join(process.env.STORAGE_PATH, directory) : path.join(__dirname, "../", uploadDir, directory);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const now = new Date();
    const datetimeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const actualFilename = filename || datetimeStr + "_" + file.originalname;
    const uploadPath = path.join(uploadDir, actualFilename);
    fs.writeFileSync(uploadPath, file.buffer);
    if (!fs.existsSync(uploadPath)) throw new Error("Failed to save file");
    return directory + "/" + actualFilename;
};

const deleteFile = (directory: string) => {
    const dir = process.env.STORAGE_PATH ? path.join(process.env.STORAGE_PATH, directory) : path.join(__dirname, "../public/storage/media", directory);
    if (fs.existsSync(dir)) fs.unlinkSync(dir);
};

const getRelativePath = (directory: string) => {
    const dir = process.env.STORAGE_PATH ? path.join(process.env.STORAGE_PATH, directory) : path.join(__dirname, "../public/storage/media", directory);
    return dir;
}

export { saveFile, deleteFile, getRelativePath };
