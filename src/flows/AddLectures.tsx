// 강의 추가 (#2) — 기존 코스에 '나중에 생긴' 강의 녹음 노트를 연결(재임포트).
// 이미 연결된 노트는 목록에서 제외. 선택 후 호출부가 addLectures + 자동 수집.
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { alt, hasAltRuntime } from "@/alt/client";
import type { Lecture } from "@/lib/schemas";

type NoteOpt = { noteId: number; title: string };

export function AddLectures({
  existingNoteIds,
  onAdd,
  onClose,
}: {
  existingNoteIds: number[];
  onAdd: (lectures: Lecture[]) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState<NoteOpt[]>([]);
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const linked = new Set(existingNoteIds);

  useEffect(() => {
    if (!hasAltRuntime()) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const list = await alt.notes.list({ limit: 200 });
        setNotes(list.map((n) => ({ noteId: n.id, title: n.title })));
      } catch {
        /* noop */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const available = notes.filter((n) => !linked.has(n.noteId));

  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const submit = () => {
    const lectures: Lecture[] = available
      .filter((n) => selected.has(n.noteId))
      .map((n) => ({
        noteId: n.noteId,
        title: n.title,
        status: "pending" as const,
        ingestedAt: null,
      }));
    if (lectures.length > 0) onAdd(lectures);
  };

  return (
    <div className="absolute inset-0 z-40 grid place-items-center p-4">
      <div className="glass anim-overlay absolute inset-0" onClick={onClose} />
      <div className="frost anim-panel relative max-h-[92%] w-[min(94%,520px)] overflow-auto rounded-2xl border p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">강의 추가</p>
            <p className="text-xl font-normal">강의 녹음 연결</p>
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

        {!hasAltRuntime() ? (
          <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            Alt 안에서만 강의 녹음을 연결할 수 있습니다.
          </p>
        ) : loading ? (
          <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            노트를 불러오는 중…
          </p>
        ) : available.length === 0 ? (
          <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            추가할 새 강의가 없습니다. 모든 노트가 이미 연결돼 있습니다.
          </p>
        ) : (
          <div className="max-h-72 space-y-1 overflow-auto rounded-lg border p-2">
            {available.map((n) => (
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
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" onClick={submit} disabled={selected.size === 0}>
            추가하고 수집
          </Button>
        </div>
      </div>
    </div>
  );
}
