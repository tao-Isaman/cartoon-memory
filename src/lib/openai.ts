import OpenAI, { toFile } from 'openai';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export async function generateCartoonImage(
  userImageBuffer: Buffer,
  templateImageUrl: string,
  templateFilename: string
): Promise<string> {
  const res = await fetch(templateImageUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch template image: ${res.status}`);
  }
  const templateBuffer = Buffer.from(await res.arrayBuffer());

  const ext = templateFilename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const templateMime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const response = await getOpenAI().images.edit({
    model: 'gpt-image-1.5',
    image: [
      await toFile(templateBuffer, templateFilename, { type: templateMime }),
      await toFile(userImageBuffer, 'user.webp', { type: 'image/webp' }),
    ],
    prompt: 'Use style of first image apply to second image. Change the background to pastel color from template image',
    size: '1024x1024',
    quality: 'medium',
  });

  const imageData = response.data?.[0];
  if (!imageData) {
    throw new Error('No image data returned from OpenAI');
  }

  // If b64_json is available, use it; otherwise fetch from URL
  if (imageData.b64_json) {
    return imageData.b64_json;
  }
  if (imageData.url) {
    const res = await fetch(imageData.url);
    const buffer = Buffer.from(await res.arrayBuffer());
    return buffer.toString('base64');
  }

  throw new Error('No image content in OpenAI response');
}
