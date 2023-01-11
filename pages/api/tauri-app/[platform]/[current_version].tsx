import { NextApiRequest, NextApiResponse } from "next";
const NodeCache = require("node-cache");
import Cors from "cors";
// import { runMiddleware } from "../../../../utils/middleware";

export const cors = Cors({
  methods: ["GET", "HEAD"],
});

// repo url
const App_Repo = "G9000/tauri-test";
const myCache = new NodeCache({ stdTTL: 300 }); // every 5 minutes

const PLATFORMS: Array<[Array<string>, string]> = [
  [["linux-x86_64"], "amd64.AppImage.tar.gz"], // linux
  [["darwin-x86_64", "darwin-aarch64"], "app.tar.gz"], // apple intel & apple silicone
  [["windows-x86_64"], "x64_en-US.msi.zip"], // windows
];

interface Release {
  version: string;
  notes: string;
  pub_date: string;
  platforms: { [key: string]: { url: string; signature?: string } };
}

// get the latest release for the app
async function getLatestGithubRelease(repo: string): Promise<Release> {
  const githubLatestReleaseUrl = `https://api.github.com/repos/${repo}/releases/latest`;

  try {
    const response = await fetch(githubLatestReleaseUrl);
    const release = await response.json();

    const releaseResponse: Release = {
      version: release.tag_name,
      notes: release.body
        .replace(/See the assets to download this version and install./, "")
        .trim(),
      pub_date: release.published_at,
      platforms: {},
    };

    for (const asset of release.assets || []) {
      for (const [for_platforms, extension] of PLATFORMS) {
        if (asset.name.endsWith(extension)) {
          for (const platform of for_platforms) {
            releaseResponse.platforms[platform] = {
              ...releaseResponse.platforms[platform],
              url: asset.browser_download_url,
            };
          }
        } else if (asset.name.endsWith(`${extension}.sig`)) {
          const response = await fetch(asset["browser_download_url"]);
          const sig = await response.text();
          for (const platform of for_platforms) {
            releaseResponse.platforms[platform] = {
              ...releaseResponse.platforms[platform],
              signature: sig,
            };
          }
        }
      }
    }
    return releaseResponse;
  } catch (error) {
    return {} as Release;
  }
}

async function TestAppApiFetch(
  req: NextApiRequest,
  res: NextApiResponse<Release>
): Promise<void> {
  const params = req.query;
  const { current_version } = params;
  const latestRelease = await getLatestGithubRelease(App_Repo);

  if (!latestRelease || !current_version) {
    res.status(204).end();
    return;
  }

  try {
    const latestVersion = latestRelease.version;

    if (
      typeof latestRelease.version === "string" &&
      typeof current_version === "string"
    ) {
      const [latestMax, latestMin, latestPatch] = latestVersion
        .replace(/^[vV]/, "")
        .split(".");
      const [curMax, curMin, curPatch] = current_version
        .replace(/^[vV]/, "")
        .split(".");

      if (
        curMax === latestMax &&
        curMin === latestMin &&
        curPatch === latestPatch
      ) {
        throw new Error();
      }
    } else {
      throw new Error("version is not a string");
    }
  } catch (e) {
    res.status(204).end();
    return;
  }
  return res.json(latestRelease);
}

export default async function TestAppApi(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const data = myCache.get("data");
  if (data) {
    return res.json(data);
  } else {
    // perform expensive operation to get data
    const newData = await TestAppApiFetch(req, res);
    myCache.set("data", newData);
    return res.json(newData);
  }
}
