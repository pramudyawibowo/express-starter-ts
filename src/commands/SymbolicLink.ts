import fs from "fs";
import path from "path";

const SymbolicLink = async (): Promise<void> => {
    try {
        const buildFolder = path.join(__dirname, "../../build");
        if (fs.existsSync(buildFolder)) {
            const target = path.join(__dirname, "../public/storage");
            const link = path.join(__dirname, "../../build/public/storage");

            // Cek apakah folder target ada
            if (!fs.existsSync(target)) {
                console.error(`Target folder '${target}' does not exist.`);
                process.exit(1); // Keluar dari proses jika folder target tidak ditemukan
            }

            // Cek apakah symbolic link sudah ada
            if (!fs.existsSync(link)) {
                // Buat folder 'public' di dalam 'build' jika belum ada
                fs.mkdirSync(path.join(__dirname, "../../build/public"), { recursive: true });

                // Buat symbolic link
                fs.symlink(target, link, "junction", (err) => {
                    if (err) {
                        console.error(`Failed to create symlink: ${err.message}`);
                    } else {
                        console.log(`Symlink created from '${link}' to '${target}'`);
                    }
                });
            } else {
                console.log(`Symlink already exists at '${link}'`);
            }
        } else {
            console.error(`Build folder '${buildFolder}' does not exist.`);
        }
    } catch (error) {
        console.error("Terjadi kesalahan:", error);
    }
};

SymbolicLink();
