"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const http_1 = __importDefault(require("http"));
const client_1 = require("@notionhq/client");
// The dotenv library will read from your .env file into these values on `process.env`
const notionStackId = process.env.NOTION_STACK_ID;
const notionSkillsId = process.env.NOTION_SKILLS_ID || "none";
const notionSecret = process.env.NOTION_SECRET;
const port = process.env.PORT || 8000;
// Will provide an error to users who forget to create the .env file
// with their Notion data in it
if (!notionStackId || !notionSecret) {
    throw Error("Must define NOTION_SECRET and NOTION_STACK_ID in env");
}
// Initializing the Notion client with your secret
const notion = new client_1.Client({
    auth: notionSecret,
});
// Require an async function here to support await with the DB query
const server = http_1.default.createServer((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (typeof req.url == "string") {
        if (req.url == "/menu") {
            // Query the database and wait for the result
            const query = yield notion.databases.query({
                database_id: notionStackId,
            });
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(JSON.stringify(query.results));
        }
        else if (req.url.split("/")[1] == "stack-item") {
            let dbId = req.url.split("/").at(-1) || "";
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            try {
                const content = yield notion.databases.query({
                    database_id: notionSkillsId,
                    filter: {
                        or: [{ property: "Parents", relation: { contains: dbId } }],
                    },
                });
                res.end(JSON.stringify(content));
            }
            catch (error) {
                res.end(JSON.stringify({ error: "Resource not found" }));
            }
        }
        else {
            res.setHeader("Content-Type", "application/json");
            res.writeHead(404);
            res.end(JSON.stringify({ error: "Resource not found" }));
        }
    }
}));
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
