import https from "https";
import fs from "fs";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const port = 3000;

const certDir = new URL("./certs/", import.meta.url);
const key = fs.readFileSync(new URL("localhost+2-key.pem", certDir));
const cert = fs.readFileSync(new URL("localhost+2.pem", certDir));

app.prepare().then(() => {
    https
        .createServer({ key, cert }, (req, res) => handle(req, res))
        .listen(port, () => {
            console.log(`> Frontend ready on https://localhost:${port}`);
        });
});