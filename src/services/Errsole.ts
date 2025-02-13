import Errsole from "errsole";
import ErrsolePostgres from "errsole-postgres";

export const errsole = Errsole;

export const initializeErrsole = () => {
    errsole.initialize({
        storage: new ErrsolePostgres({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || "5432"),
            user: process.env.DB_USER,
            password: decodeURIComponent(process.env.DB_PASSWORD || ""),
            database: process.env.DB_DATABASE,
        }),
        port: parseInt(process.env.APP_PORT || "3000") + 1,
        enableConsoleOutput: true,
    });
};
