import dynamic from 'next/dynamic';
import { Sparkles } from 'lucide-react';

const LandingPage = dynamic(() => import('@/components/LandingPage'), {
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-heartbeat text-primary">
        <Sparkles size={48} />
      </div>
    </div>
  ),
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cartoon-gen.app';

const faqs = [
  { question: 'Cartoon Gen สร้างรูปการ์ตูนได้อย่างไร?', answer: 'Cartoon Gen คือเว็บแอปสำหรับสร้างรูปการ์ตูนจากรูปถ่ายด้วยเทคโนโลยี AI คุณสามารถอัพโหลดรูปถ่ายใดก็ได้ แล้วระบบจะวาดรูปการ์ตูนให้โดยอัตโนมัติ เปลี่ยนรูปเป็นการ์ตูนได้ทันที' },
  { question: 'วาดรูปการ์ตูนออนไลน์ยากไหม?', answer: 'ไม่ยากเลย! แค่ 3 ขั้นตอนง่ายๆ คือ อัพโหลดรูป → เลือกสไตล์ → กดสร้างรูปการ์ตูน ไม่ต้องติดตั้งแอปเพิ่มเติม วาดรูปการ์ตูนออนไลน์ผ่านเว็บบราวเซอร์ได้เลย' },
  { question: 'ต้องจ่ายเงินเท่าไหร่?', answer: 'สร้างรูปการ์ตูนใช้ 10 เครดิตต่อรูป โดยมีแพ็กเกจเริ่มต้นที่ 59 บาท (100 เครดิต = 10 รูป) และคุณจะได้รับ 10 เครดิตฟรีเมื่อกรอกข้อมูลโปรไฟล์ครบ!' },
  { question: 'รูปภาพของฉันปลอดภัยไหม?', answer: 'ปลอดภัย 100% ครับ! รูปภาพของคุณถูกเก็บรักษาอย่างปลอดภัยบนระบบ Supabase Storage และเฉพาะคุณเท่านั้นที่สามารถจัดการรูปของตัวเองได้' },
  { question: 'รองรับไฟล์ประเภทอะไรบ้าง?', answer: 'รองรับไฟล์รูปภาพ JPG, PNG และ WebP ขนาดไม่เกิน 10MB ต่อไฟล์ ระบบจะปรับขนาดและบีบอัดรูปให้อัตโนมัติก่อนส่งไปประมวลผล' },
];

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Cartoon Gen',
    url: siteUrl,
    description: 'สร้างรูปการ์ตูนจากรูปถ่ายด้วย AI วาดรูปการ์ตูนออนไลน์ เปลี่ยนรูปเป็นการ์ตูนสุดน่ารัก แปลงรูปเป็นการ์ตูน ไม่มีลายน้ำ',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '59',
      priceCurrency: 'THB',
      description: '100 เครดิต สร้างรูปการ์ตูนได้ 10 รูป',
    },
    featureList: [
      'สร้างรูปการ์ตูนด้วย AI',
      'วาดรูปการ์ตูนออนไลน์',
      'เปลี่ยนรูปเป็นการ์ตูน',
      'หลายสไตล์ให้เลือก',
      'ดาวน์โหลดฟรีไม่มีลายน้ำ',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
