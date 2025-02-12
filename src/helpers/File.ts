import fs from "fs";
import path from "path";
import slug from "slug";
import { v7 as uuidv7 } from "uuid";

const saveFile = async (
    file: Express.Multer.File,
    directory: string,
    maxFileSize: number = 5 * 1024 * 1024 // 5 MB
): Promise<string> => {
    if (file.size > maxFileSize) {
        throw new Error(`File ${file.originalname} exceeds the maximum allowed size of ${maxFileSize / (1024 * 1024)}MB.`);
    }
    let uploadDir = "public/storage/media";
    if (directory)
        uploadDir = process.env.STORAGE_PATH ? path.join(process.env.STORAGE_PATH, directory) : path.join(__dirname, "../", uploadDir, directory);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filename = uuidv7() + "-" + slug(path.basename(file.originalname, path.extname(file.originalname))) + path.extname(file.originalname);
    const uploadPath = path.join(uploadDir, filename);
    fs.writeFileSync(uploadPath, file.buffer);
    if (!fs.existsSync(uploadPath)) throw new Error("Failed to save file");
    return directory + "/" + filename;
};

const deleteFile = (directory: string) => {
    const dir = process.env.STORAGE_PATH || path.join(__dirname, "../public/storage/media", directory);
    if (fs.existsSync(dir)) fs.unlinkSync(dir);
};

export { saveFile, deleteFile };
