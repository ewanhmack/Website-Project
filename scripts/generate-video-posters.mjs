import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

async function pathExists(absolutePath) {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

async function listMp4FilesRecursively(rootFolderAbsolutePath) {
  const outputFiles = [];
  const folderQueue = [rootFolderAbsolutePath];

  while (folderQueue.length > 0) {
    const currentFolderAbsolutePath = folderQueue.pop();
    const entries = await fs.readdir(currentFolderAbsolutePath, { withFileTypes: true });

    for (const entry of entries) {
      const entryAbsolutePath = path.join(currentFolderAbsolutePath, entry.name);

      if (entry.isDirectory()) {
        folderQueue.push(entryAbsolutePath);
        continue;
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith(".mp4")) {
        outputFiles.push(entryAbsolutePath);
      }
    }
  }

  return outputFiles;
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const processHandle = spawn("ffmpeg", args, { stdio: "inherit" });

    processHandle.on("error", reject);

    processHandle.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

function posterPathForVideo(videoAbsolutePath) {
  const directoryName = path.dirname(videoAbsolutePath);
  const baseName = path.basename(videoAbsolutePath, path.extname(videoAbsolutePath));
  return path.join(directoryName, `${baseName}-poster.webp`);
}

async function main() {
  const projectRoot = process.cwd();
  const rootFolderFromArgs = process.argv[2];
  const shouldForce = process.argv.includes("--force");

  const defaultMediaRoot = path.join(projectRoot, "public");
  const mediaRootAbsolutePath = rootFolderFromArgs
    ? path.isAbsolute(rootFolderFromArgs)
      ? rootFolderFromArgs
      : path.join(projectRoot, rootFolderFromArgs)
    : defaultMediaRoot;

  const mp4Files = await listMp4FilesRecursively(mediaRootAbsolutePath);

  if (mp4Files.length === 0) {
    console.log(`No .mp4 files found under: ${mediaRootAbsolutePath}`);
    return;
  }

  let generatedCount = 0;
  let skippedCount = 0;

  for (const videoAbsolutePath of mp4Files) {
    const outputPosterAbsolutePath = posterPathForVideo(videoAbsolutePath);

    if (!shouldForce && (await pathExists(outputPosterAbsolutePath))) {
      skippedCount += 1;
      continue;
    }

    const ffmpegArgs = [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      "0.35",
      "-i",
      videoAbsolutePath,
      "-frames:v",
      "1",
      "-vf",
      "scale=960:-1",
      "-q:v",
      "70",
      outputPosterAbsolutePath,
    ];

    await runFfmpeg(ffmpegArgs);
    generatedCount += 1;
  }

  console.log(`Posters generated: ${generatedCount}`);
  console.log(`Posters skipped (already existed): ${skippedCount}`);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exitCode = 1;
});
