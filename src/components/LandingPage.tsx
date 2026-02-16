'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
    Sparkles,
    Palette,
    Upload,
    Wand2,
    Download,
    ChevronDown,
    ArrowRight,
    Star,
    Zap,
    Shield,
    Clock,
    ImagePlus,
    CreditCard,
    Gift,
    Camera,
} from 'lucide-react';

// ─── Intersection Observer Hook ───────────────────────────────────────────────
function useReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return { ref, visible };
}

// ─── Floating Sparkle Particle ────────────────────────────────────────────────
function FloatingParticle({ delay, left, size }: { delay: number; left: string; size: number }) {
    return (
        <div
            className="absolute animate-float-up pointer-events-none"
            style={{ left, animationDelay: `${delay}s`, bottom: '-20px' }}
        >
            <Sparkles size={size} className="text-primary/20" />
        </div>
    );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, delay, gradient }: {
    icon: typeof Sparkles;
    title: string;
    description: string;
    delay: number;
    gradient: string;
}) {
    const { ref, visible } = useReveal();
    return (
        <div
            ref={ref}
            className={`group relative overflow-hidden rounded-2xl border border-white/30 bg-white/70 backdrop-blur-sm p-6 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 hover:border-primary/30 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-rose-300/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative">
                <div className={`mb-4 inline-flex items-center justify-center rounded-2xl ${gradient} p-3.5 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon size={24} className="text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-foreground/55">{description}</p>
            </div>
        </div>
    );
}

// ─── Step Card ────────────────────────────────────────────────────────────────
function StepCard({ number, icon: Icon, title, description, delay }: {
    number: number;
    icon: typeof Sparkles;
    title: string;
    description: string;
    delay: number;
}) {
    const { ref, visible } = useReveal();
    return (
        <div
            ref={ref}
            className={`relative text-center transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-rose-300/20 animate-pulse" />
                <div className="relative flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-white shadow-xl shadow-primary/30">
                    <Icon size={28} />
                </div>
                <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-amber-400 text-xs font-bold text-foreground shadow-md">
                    {number}
                </div>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-foreground/55">{description}</p>
        </div>
    );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ question, answer, delay }: { question: string; answer: string; delay: number }) {
    const [open, setOpen] = useState(false);
    const { ref, visible } = useReveal();
    const toggle = useCallback(() => setOpen(prev => !prev), []);

    return (
        <div
            ref={ref}
            className={`overflow-hidden rounded-2xl border border-white/30 bg-white/70 backdrop-blur-sm transition-all duration-500 hover:shadow-md ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <button
                onClick={toggle}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-primary/5"
            >
                <span className="text-sm font-medium text-foreground sm:text-base">{question}</span>
                <ChevronDown
                    size={20}
                    className={`shrink-0 text-primary transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            <div
                className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
            >
                <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm leading-relaxed text-foreground/55">{answer}</p>
                </div>
            </div>
        </div>
    );
}

// ─── Pricing Card ─────────────────────────────────────────────────────────────
function PricingCard({ credits, price, discount, popular, delay }: {
    credits: number;
    price: number;
    discount: number;
    popular: boolean;
    delay: number;
}) {
    const { ref, visible } = useReveal();
    return (
        <div
            ref={ref}
            className={`relative overflow-hidden rounded-2xl border p-6 text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${popular
                ? 'border-primary bg-gradient-to-b from-primary/5 to-rose-300/5 shadow-lg shadow-primary/15'
                : 'border-white/30 bg-white/70 backdrop-blur-sm shadow-sm hover:border-primary/30'
                } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {popular && (
                <div className="absolute -right-8 top-4 rotate-45 bg-gradient-to-r from-primary to-primary-dark px-10 py-1 text-xs font-bold text-white shadow">
                    ยอดนิยม
                </div>
            )}
            {discount > 0 && (
                <span className="mb-3 inline-block rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                    ลด {discount}%
                </span>
            )}
            <p className="text-3xl font-bold text-foreground">{credits}</p>
            <p className="mb-3 text-sm text-foreground/50">เครดิต</p>
            <p className="mb-1 text-2xl font-bold text-primary">฿{price}</p>
            <p className="mb-5 text-xs text-foreground/40">({Math.floor(credits / 10)} รูป)</p>
            <Link
                href="/login"
                className={`inline-block w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-95 ${popular
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/25 hover:shadow-lg'
                    : 'border border-primary/20 text-primary hover:bg-primary/5'
                    }`}
            >
                ซื้อเครดิต
            </Link>
        </div>
    );
}

// ─── Main Landing Page ───────────────────────────────────────────────────────
export default function LandingPage() {
    const features = [
        { icon: Wand2, title: 'AI สร้างการ์ตูนอัตโนมัติ', description: 'เปลี่ยนรูปถ่ายของคุณเป็นการ์ตูนสุดน่ารักด้วยเทคโนโลยี AI ชั้นนำจาก OpenAI', gradient: 'bg-gradient-to-br from-pink-500 to-rose-600' },
        { icon: Camera, title: 'รองรับทุกรูปถ่าย', description: 'อัพโหลดรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 10MB ได้เลย', gradient: 'bg-gradient-to-br from-pink-500 to-rose-500' },
        { icon: Zap, title: 'รวดเร็วทันใจ', description: 'สร้างรูปการ์ตูนเสร็จภายในไม่กี่วินาที ไม่ต้องรอนาน', gradient: 'bg-gradient-to-br from-amber-500 to-orange-500' },
        { icon: Palette, title: 'หลายสไตล์ให้เลือก', description: 'เลือกสไตล์การ์ตูนที่คุณชอบ ไม่ว่าจะเป็นแนวน่ารัก หรือแนวเท่', gradient: 'bg-gradient-to-br from-emerald-500 to-teal-500' },
        { icon: Download, title: 'ดาวน์โหลดฟรี', description: 'ดาวน์โหลดรูปการ์ตูนคุณภาพสูงได้ทันที ไม่มีลายน้ำ', gradient: 'bg-gradient-to-br from-sky-500 to-cyan-500' },
        { icon: Shield, title: 'ปลอดภัย 100%', description: 'รูปภาพของคุณถูกเก็บรักษาอย่างปลอดภัย และเป็นส่วนตัว', gradient: 'bg-gradient-to-br from-rose-500 to-pink-600' },
    ];

    const steps = [
        { icon: Upload, title: 'อัพโหลดรูปภาพ', description: 'เลือกรูปถ่ายที่คุณอยากเปลี่ยนเป็นการ์ตูน รองรับ JPG, PNG, WebP' },
        { icon: Wand2, title: 'AI สร้างการ์ตูน', description: 'ระบบ AI จะเปลี่ยนรูปของคุณเป็นการ์ตูนสุดน่ารักภายในไม่กี่วินาที' },
        { icon: Download, title: 'ดาวน์โหลดผลลัพธ์', description: 'ดาวน์โหลดรูปการ์ตูนคุณภาพสูงไปใช้งานได้เลย' },
    ];

    const faqs = [
        { question: 'Cartoon Gen คืออะไร?', answer: 'Cartoon Gen คือเว็บแอปสำหรับเปลี่ยนรูปถ่ายเป็นรูปการ์ตูนด้วยเทคโนโลยี AI จาก OpenAI คุณสามารถอัพโหลดรูปถ่ายใดก็ได้ แล้วระบบจะสร้างรูปการ์ตูนให้โดยอัตโนมัติ' },
        { question: 'ใช้งานยากไหม?', answer: 'ไม่ยากเลย! แค่ 3 ขั้นตอนง่ายๆ คือ อัพโหลดรูป → เลือกสไตล์ → กดสร้าง ไม่ต้องติดตั้งแอปเพิ่มเติม ใช้งานผ่านเว็บบราวเซอร์ได้เลย' },
        { question: 'ต้องจ่ายเงินเท่าไหร่?', answer: 'สร้างรูปการ์ตูนใช้ 10 เครดิตต่อรูป โดยมีแพ็กเกจเริ่มต้นที่ 59 บาท (100 เครดิต = 10 รูป) และคุณจะได้รับ 10 เครดิตฟรีเมื่อกรอกข้อมูลโปรไฟล์ครบ!' },
        { question: 'รูปภาพของฉันปลอดภัยไหม?', answer: 'ปลอดภัย 100% ครับ! รูปภาพของคุณถูกเก็บรักษาอย่างปลอดภัยบนระบบ Supabase Storage และเฉพาะคุณเท่านั้นที่สามารถจัดการรูปของตัวเองได้' },
        { question: 'รองรับไฟล์ประเภทอะไรบ้าง?', answer: 'รองรับไฟล์รูปภาพ JPG, PNG และ WebP ขนาดไม่เกิน 10MB ต่อไฟล์ ระบบจะปรับขนาดและบีบอัดรูปให้อัตโนมัติก่อนส่งไปประมวลผล' },
    ];

    const packages = [
        { credits: 100, price: 59, discount: 0, popular: false },
        { credits: 300, price: 129, discount: 27, popular: true },
        { credits: 500, price: 199, discount: 33, popular: false },
    ];

    return (
        <div className="relative min-h-screen overflow-hidden bg-background">
            {/* ════════════════ NAVBAR ════════════════ */}
            <nav className="sticky top-0 z-50 border-b border-white/40 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                            <Palette size={20} className="text-white" />
                        </div>
                        <span className="font-[family-name:var(--font-display)] text-xl text-primary tracking-wide">
                            Cartoon Gen
                        </span>
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href="/login"
                            className="hidden sm:block rounded-lg px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
                        >
                            เข้าสู่ระบบ
                        </Link>
                        <Link
                            href="/login"
                            className="rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5 active:scale-95"
                        >
                            เริ่มสร้างเลย ✨
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ════════════════ HERO ════════════════ */}
            <section className="relative px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
                {/* Gradient Orbs */}
                <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/15 to-rose-300/10 blur-3xl" />
                <div className="absolute -right-32 top-32 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-rose-300/10 to-secondary/10 blur-3xl" />
                <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

                {/* Floating Particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <FloatingParticle delay={0} left="8%" size={14} />
                    <FloatingParticle delay={2.5} left="22%" size={10} />
                    <FloatingParticle delay={4.5} left="42%" size={16} />
                    <FloatingParticle delay={1.5} left="62%" size={12} />
                    <FloatingParticle delay={3.5} left="78%" size={14} />
                    <FloatingParticle delay={5.5} left="92%" size={10} />
                </div>

                <div className="relative mx-auto max-w-4xl text-center">
                    {/* Badge */}
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/5 to-rose-300/5 px-5 py-2 text-sm font-medium text-primary shadow-sm">
                        <Sparkles size={14} className="animate-pulse" />
                        <span>เปลี่ยนรูปเป็นการ์ตูนด้วย AI</span>
                    </div>

                    <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                        เปลี่ยนรูปของคุณให้เป็น
                        <br />
                        <span className="bg-gradient-to-r from-primary via-rose-400 to-primary bg-clip-text text-transparent animate-gradient-text">
                            การ์ตูนสุดน่ารัก
                        </span>
                    </h1>

                    <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-foreground/55 sm:text-lg">
                        อัพโหลดรูปถ่ายของคุณ แล้วให้ AI เปลี่ยนเป็นรูปการ์ตูนคุณภาพสูงได้ทันที
                        เลือกสไตล์ที่ชอบ สร้างได้ไม่จำกัด ดาวน์โหลดฟรีไม่มีลายน้ำ
                    </p>

                    <div className="mb-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link
                            href="/login"
                            className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-10 py-4 text-base font-bold text-white shadow-xl shadow-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 active:scale-95 sm:w-auto"
                        >
                            <Wand2 size={20} className="transition-transform group-hover:rotate-12" />
                            เริ่มสร้างการ์ตูนฟรี
                            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                        <a
                            href="#how-it-works"
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/20 px-8 py-4 text-base font-medium text-primary transition-all hover:border-primary/40 hover:bg-primary/5 sm:w-auto"
                        >
                            ดูวิธีใช้งาน
                        </a>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-foreground/45">
                        <span className="flex items-center gap-1.5">
                            <Gift size={14} className="text-success" /> ฟรี 10 เครดิตแรก
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock size={14} className="text-primary" /> สร้างเสร็จใน 10 วินาที
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Star size={14} className="text-secondary" /> คุณภาพระดับ AI
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Shield size={14} className="text-primary" /> ปลอดภัย 100%
                        </span>
                    </div>
                </div>

                {/* Example Results Showcase */}
                <div className="relative mx-auto mt-16 max-w-3xl">
                    <div className="mb-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/45">
                            <Sparkles size={14} className="text-primary" />
                            ตัวอย่างผลงานจาก AI
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {[
                            '/example/cartoon-1771216401633.png',
                            '/example/cartoon-1771216409900.png',
                            '/example/cartoon-1771216414995.png',
                            '/example/cartoon-1771216420461.png',
                            '/example/cartoon-1771216425282.png',
                            '/example/cool_paper_tone.jpg',
                        ].map((src, i) => (
                            <div
                                key={src}
                                className="group aspect-square overflow-hidden rounded-2xl border border-white/40 bg-white/60 shadow-lg shadow-primary/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/20"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <img
                                    src={src}
                                    alt={`ตัวอย่างการ์ตูน ${i + 1}`}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════ FEATURES ════════════════ */}
            <section id="features" className="relative px-4 py-20 sm:px-6 sm:py-28">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
                <div className="relative mx-auto max-w-6xl">
                    <div className="mb-14 text-center sm:mb-20">
                        <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">ฟีเจอร์เด่น</span>
                        <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
                            ทำไมต้องเลือก <span className="text-primary">Cartoon Gen</span>
                        </h2>
                        <p className="mx-auto max-w-lg text-foreground/55">
                            เปลี่ยนรูปถ่ายธรรมดาให้กลายเป็นงานศิลป์การ์ตูนสุดน่ารัก ด้วยเทคโนโลยี AI ที่ทันสมัยที่สุด
                        </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                        {features.map((f, i) => (
                            <FeatureCard key={f.title} {...f} delay={i * 100} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════ HOW IT WORKS ════════════════ */}
            <section id="how-it-works" className="relative px-4 py-20 sm:px-6 sm:py-28">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
                <div className="relative mx-auto max-w-4xl">
                    <div className="mb-14 text-center sm:mb-20">
                        <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">ง่ายมาก</span>
                        <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
                            สร้างการ์ตูนใน <span className="text-primary">3 ขั้นตอน</span>
                        </h2>
                        <p className="mx-auto max-w-lg text-foreground/55">
                            ไม่ต้องมีทักษะการวาด ไม่ต้องติดตั้งโปรแกรม แค่อัพโหลดรูปแล้วรอ
                        </p>
                    </div>

                    <div className="relative grid gap-12 sm:grid-cols-3 sm:gap-8">
                        {/* Connector Line */}
                        <div className="absolute left-0 right-0 top-12 hidden h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent sm:block" />

                        {steps.map((s, i) => (
                            <StepCard key={s.title} number={i + 1} {...s} delay={i * 150} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════ PRICING ════════════════ */}
            <section id="pricing" className="relative px-4 py-20 sm:px-6 sm:py-28">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
                <div className="relative mx-auto max-w-4xl">
                    <div className="mb-14 text-center sm:mb-20">
                        <span className="mb-4 inline-block rounded-full bg-success/10 px-4 py-1.5 text-sm font-medium text-success">ราคาถูกมาก</span>
                        <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
                            แพ็กเกจ<span className="text-primary">เครดิต</span>
                        </h2>
                        <p className="mx-auto max-w-lg text-foreground/55">
                            เริ่มต้นเพียง 59 บาท สร้างรูปการ์ตูนได้ 10 รูป พร้อมรับฟรี 10 เครดิตแรกเมื่อกรอกโปรไฟล์ครบ
                        </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-3 sm:gap-6">
                        {packages.map((p, i) => (
                            <PricingCard key={p.credits} {...p} delay={i * 100} />
                        ))}
                    </div>

                    <p className="mt-8 text-center text-sm text-foreground/40">
                        <CreditCard size={14} className="mr-1 inline" />
                        รองรับบัตรเครดิต/เดบิตและ PromptPay • ราคาเป็นเงินบาท (THB)
                    </p>
                </div>
            </section>

            {/* ════════════════ FAQ ════════════════ */}
            <section className="relative px-4 py-20 sm:px-6 sm:py-28">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />
                <div className="relative mx-auto max-w-2xl">
                    <div className="mb-14 text-center sm:mb-20">
                        <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">FAQ</span>
                        <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
                            คำถามที่<span className="text-primary">พบบ่อย</span>
                        </h2>
                    </div>

                    <div className="flex flex-col gap-3">
                        {faqs.map((f, i) => (
                            <FAQItem key={i} {...f} delay={i * 80} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════ CTA ════════════════ */}
            <section className="relative px-4 py-16 sm:px-6 sm:py-24">
                <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-rose-400 to-primary-dark p-8 text-center sm:p-14">
                    {/* Decorative */}
                    <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
                    <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/10" />
                    <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-white/5" />

                    <div className="relative">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                            <ImagePlus size={32} className="text-white animate-heartbeat" />
                        </div>
                        <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                            พร้อมเปลี่ยนรูปเป็นการ์ตูนหรือยัง?
                        </h2>
                        <p className="mx-auto mb-8 max-w-md text-white/80">
                            เริ่มต้นฟรี! ได้รับ 10 เครดิตเมื่อกรอกข้อมูลโปรไฟล์ครบ สร้างรูปการ์ตูนรูปแรกได้เลย
                        </p>
                        <Link
                            href="/login"
                            className="group inline-flex items-center gap-2.5 rounded-2xl bg-white px-10 py-4 text-base font-bold text-primary shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 active:scale-95"
                        >
                            <Wand2 size={20} className="transition-transform group-hover:rotate-12" />
                            เริ่มสร้างการ์ตูนเลย
                            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ════════════════ FOOTER ════════════════ */}
            <footer className="border-t border-primary/10 bg-white/50 px-4 py-10 backdrop-blur-sm sm:px-6">
                <div className="mx-auto max-w-6xl">
                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow">
                                <Palette size={14} className="text-white" />
                            </div>
                            <span className="text-sm font-medium text-foreground/50">
                                Cartoon Gen — เปลี่ยนรูปเป็นการ์ตูนด้วย AI
                            </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-foreground/45">
                            <a href="#features" className="transition-colors hover:text-primary">ฟีเจอร์</a>
                            <a href="#how-it-works" className="transition-colors hover:text-primary">วิธีใช้งาน</a>
                            <a href="#pricing" className="transition-colors hover:text-primary">ราคา</a>
                            <Link href="/login" className="transition-colors hover:text-primary">เข้าสู่ระบบ</Link>
                        </div>
                    </div>
                    <div className="mt-8 text-center text-xs text-foreground/25">
                        <p>Cartoon Gen — เปลี่ยนรูปเป็นการ์ตูน AI | สร้างรูปการ์ตูนออนไลน์ | แปลงรูปเป็นการ์ตูน</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
