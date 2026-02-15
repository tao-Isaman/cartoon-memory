export interface Template {
  id: string;
  name: string;
  filename: string;
  path: string;
}

export const TEMPLATES: Template[] = [
  { id: 'pink_tone', name: 'โทนชมพู', filename: 'pink_tone.png', path: '/template/pink_tone.png' },
  { id: 'dark_pink_tone', name: 'โทนชมพูเข้ม', filename: 'dark_pink_tone.jpg', path: '/template/dark_pink_tone.jpg' },
  { id: 'pastel_paper_tone', name: 'โทนพาสเทล', filename: 'pastel_paper_tone.jpg', path: '/template/pastel_paper_tone.jpg' },
  { id: 'cool_paper_tone', name: 'โทนเย็น', filename: 'cool_paper_tone.jpg', path: '/template/cool_paper_tone.jpg' },
  { id: 'orage_pink_tone', name: 'โทนส้มชมพู', filename: 'orage_pink_tone.jpg', path: '/template/orage_pink_tone.jpg' },
  { id: 'dark_tone', name: 'โทนเข้ม', filename: 'dark_tone.jpg', path: '/template/dark_tone.jpg' },
  { id: 'white_tone', name: 'โทนขาว', filename: 'white_tone.jpg', path: '/template/white_tone.jpg' },
];

export const DEFAULT_TEMPLATE = TEMPLATES[0];

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id);
}
