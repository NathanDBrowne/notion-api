require("dotenv").config();
import http from "http";
import { Client } from "@notionhq/client";

// This is Typescript  interface for the shape of the object we will
// create based on our database to send to the React app
// When the data is queried it will come back in a much more complicated shape, so our goal is to
// simplify it to make it easy to work with on the front end

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
const notion = new Client({
  auth: notionSecret,
});

// Require an async function here to support await with the DB query
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (typeof req.url == "string") {
    if (req.url == "/menu") {
      // Query the database and wait for the result
      const query = await notion.databases.query({
        database_id: notionStackId,
      });

      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);
      res.end(JSON.stringify(query.results));

      //
    } else if (req.url.split("/")[1] == "stack-item") {
      // stack item query
      let dbId = req.url.split("/").at(-1) || "";
      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);

      try {
        const content = await notion.databases.query({
          database_id: notionSkillsId,
          filter: {
            and: [
              {
                property: "Status",
                status: { does_not_equal: "Not started" },
              },
              { property: "Parents", relation: { contains: dbId } },
            ],
          },
        });
        res.end(JSON.stringify(content.results));
      } catch (error) {
        res.end(JSON.stringify({ error: "Resource not found" }));
      }
    } else if (req.url.split("/")[1] == "article") {
      //article query
      let pageId = req.url.split("/").at(-1) || "";
      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);

      try {
        const content = await notion.blocks.children.list({
          block_id: pageId,
        });
        res.end(JSON.stringify(content.results));
      } catch (error) {
        res.end(JSON.stringify({ error: "Resource not found" }));
      }
    } else {
      res.setHeader("Content-Type", "application/json");
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Resource not found" }));
    }
  }
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
