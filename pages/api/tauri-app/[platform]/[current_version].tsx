import { NextApiRequest, NextApiResponse } from "next";
import NodeCache from "node-cache";
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
  [["darwin-x86_64", "darwin-aarch64"], "app.tar.gz"], // apple intel & apple silicon
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

    PLATFORMS.forEach(([forPlatforms, extension]) => {
      forPlatforms.forEach(async (platform) => {
        const urlAsset = release.assets.find(({ name }: { name: string }) =>
          name.endsWith(extension)
        );
        if (urlAsset) {
          releaseResponse.platforms[platform] = {
            ...releaseResponse.platforms[platform],
            url: urlAsset.browser_download_url,
          };
        }

        const sigAsset = release.assets.find(({ name }: { name: string }) =>
          name.endsWith(`${extension}.sig`)
        );
        if (sigAsset) {
          const response = await fetch(urlAsset["browser_download_url"]);
          const sig = await response.text();
          releaseResponse.platforms[platform] = {
            ...releaseResponse.platforms[platform],
            signature: sig,
          };
        }
      });
    });

    return releaseResponse;
  } catch (error) {
    return {} as Release;
  }
}

// Caching
async function TestAppApiFetch(repo: string): Promise<Release> {
  const data = myCache.get("data");
  if (data) {
    console.log("oldData", data);
    return data as Release;
  } else {
    // perform expensive operation to get data
    const newData = await getLatestGithubRelease(repo);
    myCache.set("data", newData);
    console.log("newData", newData);
    return newData;
  }
}

export default async function TauriTestAppApi(
  req: NextApiRequest,
  res: NextApiResponse<Release | string>
): Promise<void> {
  const params = req.query;
  const { current_version } = params;
  const latestRelease = await TestAppApiFetch(App_Repo); // Get latest releases

  if (!latestRelease || !current_version) {
    return res.status(204).send("NO CONTENT");
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
        console.log("UP TO DATE SAME AS LATEST VERSION");
        throw new Error();
      }
    } else {
      throw new Error("version is not a string");
    }
  } catch (e) {
    return res.status(204).send("NO CONTENT");
  }
  return res.json(latestRelease);
}
