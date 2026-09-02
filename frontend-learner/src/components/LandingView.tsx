import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Hexagon, Sparkles, CircleDot, AlignLeft, Play, Edit3, Plus, Minus } from "@masterlms/shared";
import { CourseCard } from "./CourseCard";
import { Header } from "./Header";
import type { Course } from "../types/course";

// HERO image commented out — soft gradient blur used instead
// const HERO = "https://images.pexels.com/photos/31206089/pexels-photo-31206089.jpeg";
const TESTIMONIAL_BG = "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1600&auto=format&fit=crop&q=80";

function Pill({ children, color }: { children: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white ${color} whitespace-nowrap`}>
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20"><Sparkles size={10} strokeWidth={2.5} /></span>
      {children}
    </span>
  );
}

export function LandingView({ courses }: { courses: Course[] }) {
  const [faq, setFaq] = useState<number | null>(0);
  const featured = courses.slice(0, 4);
  return (
    <>
      <Header />
      {/* HERO */}
      <div className="px-3 pt-3 sm:px-4">
        <div className="relative overflow-hidden rounded-[28px] bg-[#f8f7ff]">
          {/* HERO image commented out — replaced with soft gradient blur */}
          {/* <img src={HERO} alt="" className="h-[620px] w-full object-cover sm:h-[700px] lg:h-[760px]" /> */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#eef2ff] via-[#fdf2ff] to-[#fff7ed]" />
          <div className="absolute -left-24 -top-24 h-[520px] w-[520px] rounded-full bg-[#c7d2fe]/50 blur-[90px]" />
          <div className="absolute -bottom-32 -right-24 h-[560px] w-[560px] rounded-full bg-[#fbcfe8]/40 blur-[100px]" />
          <div className="absolute left-1/2 top-1/2 h-[700px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#dbeafe]/30 blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(52,120,255,0.08),transparent_60%)]" />

          <div className="relative flex min-h-[620px] flex-col items-center justify-center px-4 py-20 text-center sm:min-h-[700px] lg:min-h-[760px]">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> New courses every week • Free to start
            </span>
            <h1 className="max-w-[760px] leading-[0.88] tracking-[-0.04em]">
              <span className="block font-news text-[34px] font-light tracking-[-0.03em] text-zinc-900 sm:text-[54px] lg:text-[62px]">Learn skills that</span>
              <span className="block font-serif text-[42px] font-normal italic tracking-[-0.03em] text-zinc-900 sm:text-[66px] lg:text-[74px]"><span className="relative inline-block px-1.5"><span className="relative z-10">actually</span><span className="absolute inset-x-0 bottom-1.5 h-[10px] bg-yellow-400 -rotate-1 sm:h-[14px] lg:h-[16px]" /></span></span>
              <span className="block font-sans text-[36px] font-black tracking-[-0.05em] text-zinc-900 sm:text-[58px] lg:text-[64px]">move you forward.</span>
            </h1>
            <p className="mt-4 max-w-[640px] text-[13px] font-light leading-relaxed tracking-wide text-zinc-600 sm:text-[15px]">Practical skills <span className="font-semibold text-zinc-900">•</span> calm focus sessions <span className="font-semibold text-zinc-900">•</span> follow your own rhythm and finish what you start.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/courses" className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:translate-y-[-1px] hover:bg-black">Get Started <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-zinc-900"><ArrowRight size={12} strokeWidth={3} /></span></Link>
              <a href="#explore" className="inline-flex items-center gap-2 rounded-full border bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"><Play size={12} strokeWidth={2.5} className="fill-zinc-700" /> Watch 30s tour</a>
            </div>
            <div className="mt-5 flex items-center gap-3 text-[11px] font-medium text-zinc-500">
              <span className="flex items-center gap-1.5"><span className="text-amber-400">★★★★★</span> 4.9/5</span><span className="h-3 w-px bg-zinc-200" /><span>No credit card needed</span><span className="h-3 w-px bg-zinc-200" /><span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-3 py-10 sm:px-4 sm:py-12">
        <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Our learners work at leading companies</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-6 text-sm font-bold tracking-tight text-zinc-500 sm:gap-10"><span className="text-zinc-400">GOODSCOMPANY</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-zinc-400" /> Spotify</span><span className="text-zinc-600">Google</span><span className="text-zinc-500">∞ Meta</span><span className="text-zinc-500">SQUARE ENIX</span></div>
      </div>

      <section id="explore" className="w-full px-3 pb-10 sm:px-4 sm:pb-12">
        <div className="rounded-[28px] bg-white p-8 shadow-sm sm:p-12 lg:p-14">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Explore our most<br/>loved classes</h2>
          <p className="mx-auto mt-2 max-w-md text-center text-xs text-zinc-500">Curated choices chosen by learners to help you grow faster.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c) => (<CourseCard key={c.id} {...c} />))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <Link to="/courses" className="rounded-full bg-[#0f172a] px-4 py-1.5 text-xs font-semibold text-white">All</Link>
            {["Design","Business","Engineering","Marketing","Product"].map((f)=>(<Link key={f} to={`/courses?cat=${f}`} className="rounded-full border bg-white px-4 py-1.5 text-xs font-medium text-zinc-600">{f}</Link>))}
          </div>
        </div>
      </section>

      <div className="bg-[#f6f5f1] py-8 sm:py-10">
        <div className="relative overflow-hidden"><div className="flex w-max animate-[marquee_28s_linear_infinite] items-center gap-3 will-change-transform">
          {[["Growth oriented","bg-yellow-400 text-zinc-900"],["Curious","bg-[#3478ff] text-white"],["Practical skills","bg-yellow-400 text-zinc-900"],["Calm","bg-zinc-900 text-white"],["Motivated","bg-yellow-400 text-zinc-900"],["Focused sessions","bg-[#3478ff] text-white"],["Self driven","bg-white text-zinc-700 border border-zinc-200"],["Curious minds","bg-emerald-500 text-white"],["Real progress","bg-white text-zinc-700 border border-zinc-200"],["Consistent focus","bg-white text-zinc-700 border border-zinc-200"],["Growth oriented","bg-yellow-400 text-zinc-900"],["Curious","bg-[#3478ff] text-white"],["Practical skills","bg-yellow-400 text-zinc-900"],["Calm","bg-zinc-900 text-white"],["Motivated","bg-yellow-400 text-zinc-900"],["Focused sessions","bg-[#3478ff] text-white"],["Self driven","bg-white text-zinc-700 border border-zinc-200"],["Curious minds","bg-emerald-500 text-white"],["Real progress","bg-white text-zinc-700 border border-zinc-200"],["Consistent focus","bg-white text-zinc-700 border border-zinc-200"]].map(([label,cls],i)=>(<span key={`${label}-${i}`} className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold leading-none ${cls}`}>✦ {label}</span>))}
        </div></div>
        <div className="relative mt-3 overflow-hidden"><div className="flex w-max animate-[marquee-reverse_30s_linear_infinite] items-center gap-3 will-change-transform">
          {[["Consistent focus","bg-white text-zinc-700 border border-zinc-200"],["Calm","bg-zinc-900 text-white"],["Motivated","bg-yellow-400 text-zinc-900"],["Focused sessions","bg-[#3478ff] text-white"],["Self driven","bg-emerald-600 text-white"],["Curious minds","bg-white text-zinc-700 border border-zinc-200"],["Growth oriented","bg-yellow-400 text-zinc-900"],["Practical skills","bg-yellow-400 text-zinc-900"],["Consistent focus","bg-white text-zinc-700 border border-zinc-200"],["Calm","bg-zinc-900 text-white"],["Motivated","bg-yellow-400 text-zinc-900"],["Focused sessions","bg-[#3478ff] text-white"],["Self driven","bg-emerald-600 text-white"],["Curious minds","bg-white text-zinc-700 border border-zinc-200"],["Growth oriented","bg-yellow-400 text-zinc-900"],["Practical skills","bg-yellow-400 text-zinc-900"]].map(([label,cls],i)=>(<span key={`${label}-${i}-r`} className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold leading-none ${cls}`}>✦ {label}</span>))}
        </div></div>
      </div>

      <section className="w-full px-3 py-10 sm:px-4 sm:py-12">
        <div className="relative rounded-[28px] bg-white px-6 py-16 text-center shadow-sm sm:px-10 sm:py-20 lg:py-24">
          <div className="absolute left-6 top-6 sm:left-10"><Pill color="bg-[#3478ff]">Calm</Pill></div>
          <div className="absolute right-6 top-6 sm:right-10"><Pill color="bg-yellow-400 !text-zinc-900">Motivated</Pill></div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2"><Pill color="bg-emerald-600">Focused sessions</Pill></div>
          <h2 className="mx-auto max-w-[620px] text-[26px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[36px]">From focused sessions<br/>to practical skills, we <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white align-middle"><CheckCircle2 size={14} strokeWidth={3} /></span> helps you learn with<br/>clarity and confidence. <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#3478ff] text-white align-middle"><Sparkles size={12} strokeWidth={2.5} /></span></h2>
          <p className="mx-auto mt-3 max-w-md text-xs text-zinc-500">Growth oriented. Our approach keeps you steady and motivated.</p>
        </div>
      </section>

      <section className="w-full px-3 py-6 sm:px-4 sm:py-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Practical skills that matter", desc: "Our lessons focus on skills you can use right away at work or in life, taught by people who work in the real world.", Icon: Edit3 },
          { title: "Learn without pressure", desc: "More of your own self chosen designed to help you stay calm, focused and steady while you learn, effectively.", Icon: CircleDot },
          { title: "Clear learning paths", desc: "Follow flexible, step by step paths that guide you from the basics to confident, real world use. No guesswork.", Icon: Hexagon },
          { title: "Real progress", desc: "Learning that shows physical progress. Every time you finish a lesson, you will feel momentum and clarity.", Icon: AlignLeft },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm sm:p-7">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white"><f.Icon size={16} strokeWidth={2.5} /></div>
            <h3 className="mt-3 text-sm font-bold leading-tight">{f.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{f.desc}</p>
          </div>
        ))}
        </div>
        <div className="flex justify-center py-6"><Link to="/courses" className="rounded-full bg-[#0f172a] px-5 py-2 text-xs font-semibold text-white">Learn more →</Link></div>
      </section>

      <section className="w-full px-3 pt-10 sm:px-4 sm:pt-12">
        <div className="relative w-full overflow-hidden rounded-[28px]">
          <img src={TESTIMONIAL_BG} alt="" className="h-[480px] w-full object-cover sm:h-[520px]" />
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-6 left-1/2 w-[92%] max-w-[520px] -translate-x-1/2 rounded-2xl bg-white p-5 shadow-xl sm:left-8 sm:translate-x-0">
            <div className="text-amber-400 text-xs">★★★★★</div>
            <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-800">“QTNXT completely changed how I approach learning. I feel more focused, less pressured, and I actually finish the courses I start.”</p>
            <div className="mt-3 flex items-center gap-2"><img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80" alt="" className="h-7 w-7 rounded-full object-cover" /><div><p className="text-xs font-semibold">Maya Chen</p><p className="text-[10px] text-zinc-500">Product Designer • Self taught learner</p></div></div>
          </div>
        </div>
      </section>

      <section id="faq" className="w-full px-3 py-14 sm:px-4 sm:py-20">
        <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-bold tracking-tight">Frequently asked<br/>questions</h2>
        <div className="mt-6 space-y-3">
          {[{q:"Who is QTNXT for?",a:"QTNXT is for curious, self-driven learners who want to build practical skills at their own pace without pressure or rigid systems."},{q:"How is QTNXT different from other learning platforms?",a:"We focus on calm, focused learning with real-world projects and mentor support instead of endless video playlists."},{q:"Can I learn at my own pace?",a:"Yes — all courses are self-paced. Learn anytime, anywhere."},{q:"Do I get a certificate after completing a course?",a:"Yes, you receive a verified certificate you can share on LinkedIn."}].map((item,i)=>(
            <div key={item.q} className="rounded-2xl bg-white px-5 py-4 shadow-sm">
              <button onClick={()=>setFaq(faq===i?null:i)} className="flex w-full items-center justify-between text-left"><span className="text-sm font-semibold">{item.q}</span><span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${faq===i?"bg-[#3478ff] text-white":"bg-zinc-100"}`}>{faq===i?<Minus size={12} strokeWidth={2.5}/>:<Plus size={12} strokeWidth={2.5}/>}</span></button>
              {faq===i&&<p className="mt-2 text-xs leading-relaxed text-zinc-500">{item.a}</p>}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center"><a href="#" className="rounded-full bg-[#0f172a] px-5 py-2 text-xs font-semibold text-white">See more questions →</a></div>
        </div>
      </section>

      <section className="w-full px-3 py-6 sm:px-4 sm:py-8">
        <div className="w-full rounded-[28px] bg-[#0f172a] px-6 py-20 text-center text-white sm:py-24 lg:py-28">
          <h2 className="mx-auto max-w-xl text-[26px] font-bold leading-tight tracking-tight sm:text-4xl">Start learning in a way<br/>that feels right for you.</h2>
          <Link to="/courses" className="mt-6 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-zinc-900">Get started for free</Link>
          <div className="mx-auto mt-8 flex h-10 w-10 items-center justify-center rounded-xl bg-white font-black text-[#0f172a]">K.</div>
        </div>
      </section>

      <footer className="w-full px-6 py-12 text-sm text-zinc-500 sm:px-8 sm:py-16">
        <div className="grid gap-8 sm:grid-cols-4">
          <div><div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">K</div><p className="mt-3 text-xs leading-relaxed text-zinc-500">Learn practical skills with calm, focused sessions.</p></div>
          {[{title:"Explore",links:["Courses","Learning Paths","Instructors","Categories","Certificates"]},{title:"Resources",links:["FAQ","Help Center","Learning Guide","Community"]},{title:"Company",links:["About QTNXT","Careers","Blog","Press","Privacy Policy","Terms of Service"]}].map((col)=>(
            <div key={col.title}><p className="font-semibold text-zinc-900">{col.title}</p><ul className="mt-2 space-y-1 text-xs">{col.links.map((l)=>(<li key={l}><a href="#" className="hover:text-zinc-900">{l}</a></li>))}</ul></div>
          ))}
        </div>
        <p className="mt-8 border-t pt-6 text-center text-xs text-zinc-400">© 2026 QTNXT. All rights reserved.</p>
      </footer>
    </>
  );
}
