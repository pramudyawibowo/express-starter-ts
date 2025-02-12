import morgan from "morgan";
import moment from "moment";
import fs from "fs";
import path from "path";

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../public/storage/logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Create a write stream for the log file
const filename = process.env.NODE_ENV === "production" ? "production.log" : "development.log";
const accessLogStream = fs.createWriteStream(path.join(logsDir, filename), { flags: "a" });

// Override console methods to write to file
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
};

// Function to format log message
const formatLogMessage = (type: string, args: any[]) => {
    const timestamp = moment().format("D/M/Y HH:mm:ss");
    return `[${timestamp}] [${type}]: ${args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg)).join(" ")}\n`;
};

// Override console methods
console.log = (...args) => {
    accessLogStream.write(formatLogMessage("LOG", args));
    originalConsole.log.apply(console, args);
};

console.error = (...args) => {
    accessLogStream.write(formatLogMessage("ERROR", args));
    originalConsole.error.apply(console, args);
};

console.warn = (...args) => {
    accessLogStream.write(formatLogMessage("WARN", args));
    originalConsole.warn.apply(console, args);
};

console.info = (...args) => {
    accessLogStream.write(formatLogMessage("INFO", args));
    originalConsole.info.apply(console, args);
};

// Create custom morgan token for date
morgan.token("date", function () {
    return moment().format("D/M/Y HH:mm:ss");
});

// Create the middleware
const MorganMiddleware = morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    skip: function (_req, res) {
        if (process.env.NODE_ENV === "production") {
            return res.statusCode < 300;
        }
        return false;
    },
    stream: {
        write: (message: string) => {
            accessLogStream.write(message);
            process.stdout.write(message);
        },
    },
});

export default MorganMiddleware;
