import OpenAI, { toFile } from 'openai';
import fs from 'fs';
import path from 'path';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export async function generateCartoonImage(
  userImageBuffer: Buffer,
  templateFilename: string
): Promise<string> {
  const templatePath = path.join(process.cwd(), 'public', 'template', templateFilename);
  const templateBuffer = fs.readFileSync(templatePath);

  const response = await getOpenAI().images.edit({
    model: 'gpt-image-1.5',
    image: [
      await toFile(templateBuffer, 'template.png'),
      await toFile(userImageBuffer, 'user.png'),
    ],
    prompt: 'Use style of first image apply to second image. Change the background to pastel color from template image',
    size: '1024x1024',
    quality: 'medium',
  });

  return response.data![0].b64_json!;
}
