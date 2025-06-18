import fs from "fs";
import path from "path";

const SymbolicLink = async (): Promise<void> => {
    try {
        const buildFolder = path.join(__dirname, "../../build");
        if (fs.existsSync(buildFolder)) {
            const publicFolder = path.join(__dirname, "../public");
            const buildPublicFolder = path.join(buildFolder, "public");

            // Buat folder 'public' di dalam 'build' jika belum ada
            if (!fs.existsSync(buildPublicFolder)) {
                fs.mkdirSync(buildPublicFolder, { recursive: true });
            }

            // Cek apakah folder public ada
            if (!fs.existsSync(publicFolder)) {
                console.error(`Public folder '${publicFolder}' does not exist.`);
                process.exit(1);
            }

            // Baca semua item di folder public
            const items = fs.readdirSync(publicFolder);

            // Filter hanya direktori
            const directories = items.filter((item) => {
                const itemPath = path.join(publicFolder, item);
                return fs.statSync(itemPath).isDirectory();
            });

            // Buat symbolic link untuk setiap direktori
            for (const dir of directories) {
                const target = path.join(publicFolder, dir);
                const link = path.join(buildPublicFolder, dir);

                // Lewati jika symbolic link sudah ada
                if (fs.existsSync(link)) {
                    console.log(`Symlink already exists at '${link}'`);
                    continue;
                }

                // Buat symbolic link
                try {
                    fs.symlinkSync(target, link, "junction");
                    console.log(`Symlink created from '${link}' to '${target}'`);
                } catch (err: any) {
                    console.error(`Failed to create symlink for '${dir}': ${err.message}`);
                }
            }

            if (directories.length === 0) {
                console.log(`No directories found in '${publicFolder}'`);
            }
        } else {
            console.error(`Build folder '${buildFolder}' does not exist.`);
        }
    } catch (error: any) {
        console.error("Terjadi kesalahan:", error.message);
    }
};

SymbolicLink();
