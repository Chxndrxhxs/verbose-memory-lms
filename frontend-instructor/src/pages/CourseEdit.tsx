import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Video, FileText, HelpCircle, LinkIcon, Music, AlignLeft, type LucideIcon, ArrowLeft, ArrowRight } from "@masterlms/shared";
import { InstructorHeader } from "../components/InstructorHeader";
import { StudentPreviewModal } from "../components/StudentPreviewModal";
import { api, uploadFile } from "../lib/api";

type Kind = "video" | "pdf" | "quiz" | "link" | "audio" | "text";
type QuizQ = { id: string; question: string; options: string[]; correct: number };
type Lesson = { id: string; title: string; kind: Kind; duration: string; resource_url: string; quiz_data?: QuizQ[] };
type Section = { id: string; title: string; lessons: Lesson[] };

const kindMeta: Record<Kind, { label: string; Icon: LucideIcon; color: string; placeholder: string; hint: string; accept?: string }> = {
  video: { label: "Video", Icon: Video, color: "bg-[#3478ff] text-white", placeholder: "https://youtu.be/... or https://...mp4 / embed link", hint: "YouTube, Vimeo, Loom or upload mp4 — auto-embedded", accept: "video/*" },
  pdf: { label: "PDF", Icon: FileText, color: "bg-zinc-900 text-white", placeholder: "https://...pdf or upload PDF", hint: "Upload PDF or paste URL — opens in viewer", accept: ".pdf,application/pdf" },
  quiz: { label: "Quiz", Icon: HelpCircle, color: "bg-yellow-400 text-zinc-900", placeholder: "Quiz title / link", hint: "Add questions & options below" },
  link: { label: "Link", Icon: LinkIcon, color: "bg-emerald-500 text-white", placeholder: "https://external.com", hint: "Any external resource" },
  audio: { label: "Audio", Icon: Music, color: "bg-violet-600 text-white", placeholder: "https://...mp3 or upload audio", hint: "Upload mp3/wav or paste URL", accept: "audio/*" },
  text: { label: "Text", Icon: AlignLeft, color: "bg-white border text-zinc-700", placeholder: "Write lesson in markdown…", hint: "Headings, lists, code — rendered for students" },
};

function toEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (u.hostname.includes("loom.com") && u.pathname.includes("/share/")) return url.replace("/share/", "/embed/");
    if (url.match(/\.(mp4|webm|mov)(\?|$)/)) return url;
    return url;
  } catch { return null; }
}

export default function CourseEdit() {
  const { id } = useParams();
  const [sections, setSections] = useState<Section[]>([
    { id: "s1", title: "Getting started", lessons: [{ id: "l1", title: "Welcome", kind: "video", duration: "03:12", resource_url: "" }, { id: "l2", title: "Setup guide (PDF)", kind: "pdf", duration: "—", resource_url: "" }] },
    { id: "s2", title: "Core concepts", lessons: [{ id: "l3", title: "Wireframing quiz", kind: "quiz", duration: "10 q", resource_url: "" }] },
  ]);
  const [course, setCourse] = useState<{ title: string; subtitle: string; description: string; what_you_will_learn: string; cover_image: string; category: string; level: string; price: string }>({ title: "", subtitle: "", description: "", what_you_will_learn: "", cover_image: "", category: "Engineering", level: "beginner", price: "Free" });
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await api<{ title: string; subtitle: string; description: string; what_you_will_learn: string[]; cover_image: string; category: string; level: string; price: string; status: string; sections?: { id: number; title: string; lessons: { id: number; title: string; kind: string; duration: string; resource_url: string; quiz_data: unknown }[] }[] }>(`/courses/${id}/`);
        if (cancelled) return;
        setPublished(c.status === "published");
        setCourse({ title: c.title ?? "", subtitle: c.subtitle ?? "", description: c.description ?? "", what_you_will_learn: (c.what_you_will_learn ?? []).join(". "), cover_image: c.cover_image ?? "", category: c.category ?? "Engineering", level: c.level ?? "beginner", price: Number(c.price) === 0 ? "Free" : `$${c.price}` });
        if (c.sections && c.sections.length > 0) {
          setSections(c.sections.map((s) => ({ id: String(s.id), title: s.title, lessons: s.lessons.map((l) => ({ id: String(l.id), title: l.title, kind: (l.kind as Kind) ?? "video", duration: l.duration ?? "", resource_url: l.resource_url ?? "", quiz_data: l.quiz_data as QuizQ[] | undefined })) })));
        }
      } catch {}
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const addSection = () => setSections((s) => [...s, { id: `s${Date.now()}`, title: "New section", lessons: [] }]);
  const removeSection = (sid: string) => setSections((s) => s.filter((x) => x.id !== sid));
  const addLesson = (sid: string, kind: Kind) => {
    const base: Lesson = { id: `l${Date.now()}`, title: `New ${kindMeta[kind].label}`, kind, duration: kind === "video" || kind === "audio" ? "05:00" : "—", resource_url: "" };
    if (kind === "quiz") base.quiz_data = [{ id: `q${Date.now()}`, question: "", options: ["", ""], correct: 0 }];
    setSections((s) => s.map((sec) => sec.id === sid ? { ...sec, lessons: [...sec.lessons, base] } : sec));
    setPickerFor(null);
  };
  const updateLesson = (sid: string, lid: string, patch: Partial<Lesson>) => setSections((s) => s.map((sec) => sec.id === sid ? { ...sec, lessons: sec.lessons.map((l) => l.id === lid ? { ...l, ...patch } : l) } : sec));
  const removeLesson = (sid: string, lid: string) => setSections((s) => s.map((sec) => sec.id === sid ? { ...sec, lessons: sec.lessons.filter((l) => l.id !== lid) } : sec));

  const save = async () => {
    setSaving(true);
    try {
      const nextStatus = published ? "published" : "draft";
      try {
        const priceNum = course.price === "Free" ? 0 : Number(course.price.replace("$", ""));
        const learn = course.what_you_will_learn.split(".").map((s) => s.trim()).filter(Boolean);
        await api(`/courses/${id}/`, { method: "PATCH", body: JSON.stringify({ title: course.title, subtitle: course.subtitle, description: course.description, what_you_will_learn: learn, cover_image: course.cover_image, category: course.category, level: course.level, price: priceNum }) });
        if (published) await api(`/courses/${id}/publish/`, { method: "POST" });
        else await api(`/courses/${id}/`, { method: "PATCH", body: JSON.stringify({ status: "draft" }) });
      } catch {}
      try { await api(`/courses/${id}/curriculum/`, { method: "PUT", body: JSON.stringify({ sections }) }); } catch {}
      setToast(nextStatus === "published" ? "Published ✓ — visible to learners" : "Saved ✓");
      setTimeout(() => setToast(null), 2200);
    } catch (e) { setToast(String(e)); setTimeout(()=>setToast(null),2200); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className="mx-auto max-w-[1080px] px-3 py-6 sm:px-4">
        <div className="flex items-center justify-between">
          <Link to="/courses" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900"><ArrowLeft size={14} strokeWidth={2.5} /> Back to courses</Link>
          <button onClick={() => setPublished((p) => !p)} className={`rounded-full px-4 py-1.5 text-xs font-bold ${published ? "bg-emerald-500 text-white" : "bg-yellow-400 text-zinc-900"}`}>{published ? "Published" : "Draft"} • {published ? "Live" : "tap to publish"}</button>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <div className="rounded-[20px] bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold">Course details</h2>
              <p className="text-xs text-zinc-500">Edit What you’ll learn and Description — dot-separated for learn.</p>
              {loading ? <p className="mt-4 text-sm text-zinc-500">Loading…</p> : (
                <div className="mt-4 grid gap-3">
                  <div><label className="text-xs font-semibold">Title</label><input value={course.title} onChange={(e)=> setCourse((c)=> ({...c, title: e.target.value}))} className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2 text-sm outline-none focus:bg-white" /></div>
                  <div><label className="text-xs font-semibold">Subtitle</label><input value={course.subtitle} onChange={(e)=> setCourse((c)=> ({...c, subtitle: e.target.value}))} className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2 text-sm outline-none focus:bg-white" /></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className="text-xs font-semibold">Category</label><select value={course.category} onChange={(e)=> setCourse((c)=> ({...c, category: e.target.value}))} className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2 text-sm"><option>Design</option><option>Engineering</option><option>Business</option><option>Marketing</option></select></div>
                    <div><label className="text-xs font-semibold">Level</label><select value={course.level} onChange={(e)=> setCourse((c)=> ({...c, level: e.target.value}))} className="mt-1 w-full rounded-xl border bg-zinc-50 px-3 py-2 text-sm"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold">Cover image</label>
                    <div className="mt-1 flex gap-2">
                      <input value={course.cover_image} onChange={(e)=> setCourse((c)=> ({...c, cover_image: e.target.value}))} placeholder="https://... or upload" className="flex-1 rounded-xl border bg-zinc-50 px-3 py-2 text-sm outline-none focus:bg-white" />
                      <label className="shrink-0 inline-flex items-center rounded-xl bg-[#0f172a] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer hover:bg-black">
                        {uploadingId === "cover" ? "Uploading…" : "Upload"}
                        <input type="file" accept="image/*" className="hidden" onChange={async (e)=>{
                          const f = e.target.files?.[0]; if (!f) return;
                          setUploadingId("cover");
                          try { const { url } = await uploadFile(f); setCourse((c)=> ({...c, cover_image: url})); }
                          catch (err) { alert(`Upload failed: ${err}`); }
                          finally { setUploadingId(null); e.target.value = ""; }
                        }} />
                      </label>
                    </div>
                    {course.cover_image && <img src={course.cover_image} alt="" onError={(e)=>((e.target as HTMLImageElement).style.display="none")} className="mt-2 h-32 w-full rounded-xl object-cover border" />}
                  </div>
                  <div><label className="text-xs font-semibold">What you’ll learn <span className="font-normal text-zinc-400">(dot separated — each sentence becomes a bullet)</span></label><textarea value={course.what_you_will_learn} onChange={(e)=> setCourse((c)=> ({...c, what_you_will_learn: e.target.value}))} rows={3} placeholder="Build frontends with React. Create backends with Django. Design MySQL schemas" className="mt-1 w-full rounded-xl border bg-zinc-50 p-3 text-sm outline-none focus:bg-white" /></div>
                  <div><label className="text-xs font-semibold">Description</label><textarea value={course.description} onChange={(e)=> setCourse((c)=> ({...c, description: e.target.value}))} rows={4} className="mt-1 w-full rounded-xl border bg-zinc-50 p-3 text-sm outline-none focus:bg-white" /></div>
                </div>
              )}
            </div>
            <div className="rounded-[20px] bg-white p-6 shadow-sm">
              <h1 className="text-xl font-bold">Curriculum — {id}</h1>
              <p className="text-sm text-zinc-500">Choose lesson type per item — video, PDF, quiz, link, audio or text.</p>
              {loading ? <p className="mt-6 text-sm text-zinc-500">Loading course…</p> : <div className="mt-6 space-y-4">
                {sections.map((sec) => (
                  <div key={sec.id} className="rounded-2xl border bg-zinc-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <input value={sec.title} onChange={(e)=> setSections((s)=> s.map((x)=> x.id===sec.id ? {...x, title: e.target.value} : x))} className="bg-transparent text-sm font-bold outline-none w-full" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">{sec.lessons.length} lessons</span>
                        <button onClick={()=> removeSection(sec.id)} className="flex h-6 w-6 items-center justify-center rounded-full bg-white border text-xs hover:text-red-500">✕</button>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {sec.lessons.map((l) => (
                        <li key={l.id} className="rounded-xl bg-white border p-3">
                          <div className="flex items-start gap-2">
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${kindMeta[l.kind].color}`}>{(() => { const I = kindMeta[l.kind].Icon; return <I size={14} strokeWidth={2.5} />; })()}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <input value={l.title} onChange={(e)=> updateLesson(sec.id, l.id, { title: e.target.value })} className="flex-1 bg-transparent text-sm font-medium outline-none" />
                                <select value={l.kind} onChange={(e)=> updateLesson(sec.id, l.id, { kind: e.target.value as Kind })} className="rounded-full border bg-zinc-50 px-2 py-1 text-xs">
                                  {(Object.keys(kindMeta) as Kind[]).map((k)=><option key={k} value={k}>{kindMeta[k].label}</option>)}
                                </select>
                              </div>
                              {l.kind === "text" ? (
                                <>
                                  <textarea value={l.resource_url} onChange={(e)=> updateLesson(sec.id, l.id, { resource_url: e.target.value })} placeholder={kindMeta[l.kind].placeholder} rows={4} className="mt-2 w-full rounded-lg border bg-zinc-50 p-2 text-xs outline-none font-mono" />
                                  <p className="mt-1 text-[10px] text-zinc-400">{kindMeta[l.kind].hint}</p>
                                  {l.resource_url && <div className="mt-2 rounded-xl border bg-white p-3 text-xs leading-relaxed whitespace-pre-wrap">{l.resource_url.slice(0, 400)}</div>}
                                </>
                              ) : l.kind === "quiz" ? (
                                <div className="mt-2 space-y-3">
                                  {(l.quiz_data ?? []).map((q, qi) => (
                                    <div key={q.id} className="rounded-xl bg-zinc-50 border p-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-zinc-500">Q{qi + 1}</span>
                                        <input value={q.question} onChange={(e)=> {
                                          const nd = [...(l.quiz_data ?? [])];
                                          nd[qi] = { ...q, question: e.target.value };
                                          updateLesson(sec.id, l.id, { quiz_data: nd });
                                        }} placeholder={`Question ${qi + 1}`} className="flex-1 rounded-lg border bg-white px-2 py-1.5 text-xs outline-none" />
                                        <button onClick={()=>{
                                          const nd = (l.quiz_data ?? []).filter((_,i)=> i!==qi);
                                          updateLesson(sec.id, l.id, { quiz_data: nd });
                                        }} className="text-xs text-zinc-400 hover:text-red-500">✕</button>
                                      </div>
                                      <div className="mt-2 grid gap-1.5">
                                        {q.options.map((opt, oi)=>(
                                          <div key={oi} className="flex items-center gap-2">
                                            <input type="radio" name={`correct-${l.id}-${q.id}`} checked={q.correct===oi} onChange={()=>{
                                              const nd = [...(l.quiz_data ?? [])];
                                              nd[qi] = { ...q, correct: oi };
                                              updateLesson(sec.id, l.id, { quiz_data: nd });
                                            }} />
                                            <input value={opt} onChange={(e)=>{
                                              const nd = [...(l.quiz_data ?? [])];
                                              const opts = [...q.options];
                                              opts[oi] = e.target.value;
                                              nd[qi] = { ...q, options: opts };
                                              updateLesson(sec.id, l.id, { quiz_data: nd });
                                            }} placeholder={`Option ${oi + 1}`} className="flex-1 rounded-lg border bg-white px-2 py-1 text-xs outline-none" />
                                            <button onClick={()=>{
                                              const nd = [...(l.quiz_data ?? [])];
                                              nd[qi] = { ...q, options: q.options.filter((_,i)=> i!==oi), correct: q.correct >= oi && q.correct >0 ? q.correct-1 : q.correct };
                                              updateLesson(sec.id, l.id, { quiz_data: nd });
                                            }} className="text-xs text-zinc-400">✕</button>
                                          </div>
                                        ))}
                                        <button onClick={()=>{
                                          const nd = [...(l.quiz_data ?? [])];
                                          nd[qi] = { ...q, options: [...q.options, ""] };
                                          updateLesson(sec.id, l.id, { quiz_data: nd });
                                        }} className="rounded-lg border bg-white py-1 text-xs">+ Option</button>
                                      </div>
                                    </div>
                                  ))}
                                  <button onClick={()=>{
                                    const nd = [...(l.quiz_data ?? []), { id: `q${Date.now()}`, question: "", options: ["",""], correct: 0 }];
                                    updateLesson(sec.id, l.id, { quiz_data: nd });
                                  }} className="w-full rounded-lg bg-white border py-1.5 text-xs font-semibold">+ Add question</button>
                                </div>
                              ) : (
                                <>
                                  <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_90px]">
                                    <div className="flex gap-1.5">
                                      <input value={l.resource_url} onChange={(e)=> updateLesson(sec.id, l.id, { resource_url: e.target.value })} placeholder={kindMeta[l.kind].placeholder} className="flex-1 rounded-lg border bg-zinc-50 px-2 py-1.5 text-xs outline-none min-w-0" />
                                      {(l.kind === "video" || l.kind === "pdf" || l.kind === "audio") && (
                                        <label className="shrink-0 rounded-lg bg-[#0f172a] px-2.5 py-1.5 text-xs font-semibold text-white cursor-pointer hover:bg-black">
                                          {uploadingId === l.id ? "Uploading…" : "Upload"}
                                          <input type="file" accept={kindMeta[l.kind].accept} className="hidden" onChange={async (e)=>{
                                            const f = e.target.files?.[0];
                                            if (!f) return;
                                            setUploadingId(l.id);
                                            try {
                                              const { url } = await uploadFile(f);
                                              updateLesson(sec.id, l.id, { resource_url: url });
                                            } catch (err) {
                                              alert(`Upload failed: ${err}`);
                                            } finally {
                                              setUploadingId(null);
                                              e.target.value = "";
                                            }
                                          }} />
                                        </label>
                                      )}
                                    </div>
                                    <input value={l.duration} onChange={(e)=> updateLesson(sec.id, l.id, { duration: e.target.value })} placeholder="05:00" className="rounded-lg border bg-zinc-50 px-2 py-1.5 text-xs outline-none" />
                                  </div>
                                  <p className="mt-1 text-[10px] text-zinc-400">{kindMeta[l.kind].hint}</p>
                                  {l.kind === "video" && l.resource_url && (
                                    <div className="mt-2 overflow-hidden rounded-xl border">
                                      {toEmbed(l.resource_url) ? (
                                        <iframe src={toEmbed(l.resource_url)!} title={l.title} className="h-32 w-full" allowFullScreen />
                                      ) : (
                                        <video src={l.resource_url} controls className="h-32 w-full object-contain bg-black" />
                                      )}
                                    </div>
                                  )}
                                  {(l.kind === "pdf" || l.kind === "audio") && l.resource_url && (
                                    <div className="mt-2 rounded-lg border bg-zinc-50 px-2 py-1.5 text-xs truncate">
                                      {l.resource_url}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            <button onClick={()=> removeLesson(sec.id, l.id)} className="text-xs text-zinc-400 hover:text-red-500">✕</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3">
                      {pickerFor === sec.id ? (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 rounded-xl bg-white border p-2">
                          {(Object.keys(kindMeta) as Kind[]).map((k)=>(
                            <button key={k} onClick={()=> addLesson(sec.id, k)} className="flex flex-col items-center gap-1 rounded-xl border py-2 hover:bg-zinc-50">
                              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${kindMeta[k].color}`}>{(() => { const I = kindMeta[k].Icon; return <I size={14} strokeWidth={2.5} />; })()}</span>
                              <span className="text-[11px] font-semibold">{kindMeta[k].label}</span>
                            </button>
                          ))}
                          <button onClick={()=> setPickerFor(null)} className="col-span-3 sm:col-span-6 mt-1 text-xs text-zinc-500">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setPickerFor(sec.id)} className="w-full rounded-full bg-white border py-2 text-xs font-semibold hover:bg-zinc-50">+ Add lesson</button>
                      )}
                    </div>
                  </div>
                ))}
                <button onClick={addSection} className="w-full rounded-xl border-2 border-dashed bg-white py-3 text-sm font-semibold hover:bg-zinc-50">+ Add section</button>
              </div>}
            </div>
          </div>
          <div className="rounded-[20px] bg-white p-6 shadow-sm h-fit lg:sticky lg:top-[72px]">
            <h3 className="text-sm font-bold">Settings</h3>
            <div className="mt-4 space-y-3 text-sm">
              <label className="flex items-center justify-between">Publish <input type="checkbox" checked={published} onChange={() => setPublished((p) => !p)} /></label>
              <button onClick={save} disabled={saving} className="w-full rounded-full bg-[#0f172a] py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving…" : "Save changes"}</button>
              <button onClick={() => setIsPreviewOpen(true)} className="inline-flex items-center justify-center gap-2 w-full rounded-full border py-2.5 text-center text-sm font-medium hover:bg-zinc-50">Preview as student <ArrowRight size={14} strokeWidth={2.5} /></button>
              {isPreviewOpen && id && <StudentPreviewModal courseId={id} onClose={() => setIsPreviewOpen(false)} />}
              <p className="text-xs text-zinc-400 text-center">Opens a student-facing preview of your course.</p>
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl">{toast}</div>}
    </div>
  );
}
