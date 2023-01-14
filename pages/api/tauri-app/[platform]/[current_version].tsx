import { NextApiRequest, NextApiResponse } from "next";
import NodeCache from "node-cache";
import Cors from "cors";
import { getGhReleases } from "tauri-github-releases-test";

// import { runMiddleware } from "../../../../utils/middleware";

export const cors = Cors({
  methods: ["GET", "HEAD"],
});

// repo url
const App_Repo = "G9000/tauri-test";


export default async function TauriTestAppApi(
  req: NextApiRequest,
  res: NextApiResponse<any>
): Promise<any> {
  // const params = req.query;
  // const { current_version } = params;
  const latestRelease = await getGhReleases({ repo: App_Repo, caching: true })); // Get latest releases
  console.log('latestRelease', latestRelease)
  return latestRelease
  
}
