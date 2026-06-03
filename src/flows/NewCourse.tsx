// New Course 마법사 (plan.md §3.5① · §8) — 이름 + 시험일 + (Alt) 강의 노트 연결.
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { alt, hasAltRuntime } from "@/alt/client";
import type { Lecture } from "@/lib/schemas";

type NoteOpt = { noteId: number; title: string };

export function NewCourse({
  onCreate,
  onClose,
}: {
  onCreate: (name: string, examDate: string | null, lectures: Lecture[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [notes, setNotes] = useState<NoteOpt[]>([]);
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());

  useEffect(() => {
    if (!hasAltRuntime()) return;
    void (async () => {
      try {
        const list = await alt.notes.list({ limit: 200 });
        setNotes(list.map((n) => ({ noteId: n.id, title: n.title })));
      } catch {
        /* noop */
      }
    })();
  }, []);

  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const submit = () => {
    if (!name.trim()) return;
    const lectures: Lecture[] = notes
      .filter((n) => selected.has(n.noteId))
      .map((n) => ({ noteId: n.noteId, title: n.title, status: "pending" as const, ingestedAt: null }));
    onCreate(name.trim(), examDate || null, lectures);
  };

  const field = "w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent-1)]";

  return (
    <div className="absolute inset-0 z-40 grid place-items-center p-4">
      <div className="glass anim-overlay absolute inset-0" />
      <div className="frost anim-panel relative max-h-[92%] w-[min(94%,520px)] overflow-auto rounded-2xl border p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">새 코스</p>
            <p className="text-xl font-normal">무엇을 준비하나요</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">코스 이름</label>
            <input
              className={field}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 선형대수"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">시험일</label>
            <input
              className={field}
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">강의 녹음 연결</label>
            {hasAltRuntime() ? (
              notes.length > 0 ? (
                <div className="max-h-44 space-y-1 overflow-auto rounded-lg border p-2">
                  {notes.map((n) => (
                    <label
                      key={n.noteId}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-[var(--cod-700)]"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(n.noteId)}
                        onChange={() => toggle(n.noteId)}
                        style={{ accentColor: "var(--accent-1)" }}
                      />
                      <span className="truncate">{n.title || `노트 #${n.noteId}`}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  노트를 불러오는 중이거나 아직 없습니다. 나중에 연결할 수 있습니다.
                </p>
              )
            ) : (
              <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                Alt 안에서 강의 녹음을 연결할 수 있습니다.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" onClick={submit} disabled={!name.trim()}>
            만들기
          </Button>
        </div>
      </div>
    </div>
  );
}
