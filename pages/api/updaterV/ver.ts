import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import { runMiddleware } from "../../../utils/middleware";

export const cors = Cors({
  methods: ["GET", "HEAD"],
});

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<any[]>
): Promise<void> {
  await runMiddleware(req, res, cors);
  res.json([
    {
      version: "v1.0.0",
      notes: "Test version",
      pub_date: "2020-06-22T19:25:57Z",
      platforms: {
        "darwin-x86_64": {
          signature: "",
          url: "https://github.com/G9000/tauri-test/releases/download/main/tauri-vite-updater.app.tar.gz",
        },
        "darwin-aarch64": {
          signature: "",
          url: "https://github.com/G9000/tauri-test/releases/download/main/tauri-vite-updater.app.tar.gz",
        },
        "linux-x86_64": {
          signature: "",
          url: "https://github.com/G9000/tauri-test/releases/download/main/tauri-vite-updater.app.tar.gz",
        },
        "windows-x86_64": {
          signature: "",
          url: "https://github.com/G9000/tauri-test/releases/download/main/tauri-vite-updater.app.tar.gz",
        },
      },
    },
  ]);
}
