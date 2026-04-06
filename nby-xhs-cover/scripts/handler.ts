import { request as httpsRequest } from "https";
import { request as httpRequest } from "http";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface GenerationOptions {
  topic: string;
  pageType?: "封面" | "内容" | "总结";
  referenceImage?: string; // COS URL for image-to-image
  sessionId?: string;
}

interface JimengResponse {
  created: number;
  data: Array<{ url: string }>;
  input_images?: string[];
  composition_type?: string;
}

// 小红书风格提示词模板（保留原skill精华，适配即梦文生图）
const PROMPT_TEMPLATES = {
  封面: (topic: string) =>
    `小红书爆款封面图，${topic}。竖版3:4比例，大标题文字醒目居中，副标题在下方，清新精致有设计感，适合年轻人审美，配色温暖和谐，背景丰富有视觉焦点，文字清晰可读，排版美观留白合理，无水印无logo，高清画质，适合手机屏幕查看`,

  内容: (topic: string) =>
    `小红书图文内容页，${topic}。竖版3:4比例，信息层次分明，列表项清晰展示，重点内容用颜色强调，有小图标辅助说明，清新精致风格，配色和谐，文字清晰可读，无水印无logo，高清画质`,

  总结: (topic: string) =>
    `小红书总结收尾图，${topic}。竖版3:4比例，总结性文字突出，有勾选框或完成标志，给人完成感和满足感，鼓励性的视觉元素，清新精致风格，配色温暖，无水印无logo，高清画质`,
};

function loadSessionId(): string | undefined {
  // 优先项目级 .env
  const projectEnv = join(process.cwd(), ".nby-skills/nby-jimeng-api/.env");
  const userEnv = join(
    process.env.HOME || "",
    ".nby-skills/nby-jimeng-api/.env",
  );

  for (const envPath of [projectEnv, userEnv]) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      const match = content.match(/JIMENG_SESSION_ID=(.+)/);
      if (match) return match[1].trim();
    }
  }
  return process.env.JIMENG_SESSION_ID;
}

function callJimeng(
  prompt: string,
  sessionId: string,
  referenceImage?: string,
): Promise<JimengResponse> {
  return new Promise((resolve, reject) => {
    const endpoint = referenceImage
      ? "/v1/images/compositions"
      : "/v1/images/generations";

    const body: Record<string, unknown> = {
      model: "jimeng-4.6",
      prompt,
      ratio: "3:4", // 小红书标准竖版
      resolution: "2k",
    };

    if (referenceImage) {
      body.images = [referenceImage];
      body.sample_strength = 0.7;
    }

    const data = JSON.stringify(body);

    const req = httpRequest(
      `http://localhost:8000${endpoint}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionId}`,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let responseData = "";
        res.on("data", (chunk) => {
          responseData += chunk;
        });
        res.on("end", () => {
          try {
            const json = JSON.parse(responseData);
            if (res.statusCode !== 200) {
              reject(
                new Error(
                  `Jimeng API Error (${res.statusCode}): ${JSON.stringify(json)}`,
                ),
              );
              return;
            }
            resolve(json);
          } catch (e) {
            reject(
              new Error(
                `Failed to parse Jimeng API response (status ${res.statusCode})`,
              ),
            );
          }
        });
      },
    );

    req.on("error", (error) => reject(error));
    req.write(data);
    req.end();
  });
}

function downloadImage(url: string, maxRedirects = 5): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error("Too many redirects"));
      return;
    }
    const client = url.startsWith("https") ? httpsRequest : httpRequest;
    client(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadImage(res.headers.location!, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    })
      .on("error", reject)
      .end();
  });
}

export async function generate(
  options: GenerationOptions,
): Promise<{ images: Buffer[]; urls: string[] }> {
  const { topic, pageType = "封面", referenceImage, sessionId } = options;

  const sid = sessionId || loadSessionId();
  if (!sid) {
    throw new Error(
      "缺少 JIMENG_SESSION_ID。请在 ~/.nby-skills/nby-jimeng-api/.env 中配置。",
    );
  }

  const prompt = PROMPT_TEMPLATES[pageType](topic);
  console.log(`🎨 生成${pageType}图: ${topic.slice(0, 50)}...`);
  console.log(`📐 比例: 3:4 (小红书标准竖版)`);

  const response = await callJimeng(prompt, sid, referenceImage);

  if (!response.data || response.data.length === 0) {
    throw new Error("即梦API未返回图片");
  }

  const urls = response.data.map((d) => d.url);
  console.log(`✅ 生成了 ${urls.length} 张变体`);

  // 下载所有变体
  const images = await Promise.all(urls.map((url) => downloadImage(url)));

  return { images, urls };
}

// 主函数
export async function main(args: string[]): Promise<void> {
  const topic = args[0];
  const validTypes = ["封面", "内容", "总结"] as const;
  const rawType = args[1] || "封面";
  if (!validTypes.includes(rawType as (typeof validTypes)[number])) {
    console.error(`无效的页面类型: ${rawType}。支持: ${validTypes.join(", ")}`);
    process.exit(1);
  }
  const pageType = rawType as "封面" | "内容" | "总结";

  if (!topic) {
    console.error('用法: npx tsx scripts/handler.ts "<主题>" [封面|内容|总结]');
    console.error("");
    console.error("示例:");
    console.error('  npx tsx scripts/handler.ts "湖南芷江旅游攻略"');
    console.error('  npx tsx scripts/handler.ts "张雪机车WSBK夺冠" "封面"');
    console.error('  npx tsx scripts/handler.ts "七项免费服务清单" "内容"');
    console.error("");
    console.error(
      "需要: ~/.nby-skills/nby-jimeng-api/.env 中配置 JIMENG_SESSION_ID",
    );
    console.error(
      "需要: Docker 容器 jimeng-free-api-all 运行在 localhost:8000",
    );
    process.exit(1);
  }

  try {
    const { images } = await generate({ topic, pageType });

    const { writeFileSync } = await import("fs");
    const timestamp = Date.now();

    // 保存所有变体
    images.forEach((buf, i) => {
      const outputPath = join(
        process.cwd(),
        `xiaohongshu-${pageType}-${timestamp}-${i + 1}.png`,
      );
      writeFileSync(outputPath, buf);
      console.log(`saved: ${outputPath}`);
    });

    console.log(`\n🎉 完成! 生成了 ${images.length} 张小红书${pageType}图`);
  } catch (error) {
    console.error("❌ 生成失败：");
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(String(error));
    }
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch(console.error);
}
