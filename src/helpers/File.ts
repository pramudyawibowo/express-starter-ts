import fs from "fs";
import path from "path";
import slug from "slug";
import { v7 as uuidv7 } from "uuid";

const saveFile = async (file: Express.Multer.File, directory: string): Promise<string> => {
    let uploadDir = "public/uploads";
    if (directory) uploadDir = path.join(__dirname, "../", uploadDir, directory);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filename = uuidv7() + "-" + slug(file.originalname) + path.extname(file.originalname);
    const uploadPath = path.join(uploadDir, filename);
    fs.writeFileSync(uploadPath, file.buffer);
    if (!fs.existsSync(uploadPath)) throw new Error("Failed to save file");
    return directory + "/" + filename;
};

export default saveFile;
