// 코스 설정 모달 — 코스명·시험일 수정 + 코스 삭제(재확인).
// 삭제는 Exam Radar의 코스 항목·파생 데이터만 지운다. Alt의 강의 녹음·전사는 그대로 남는다.
import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CourseMeta } from "@/lib/schemas";

export function CourseSettings({
  meta,
  onSave,
  onDelete,
  onClose,
}: {
  meta: CourseMeta;
  onSave: (name: string, examDate: string | null) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(meta.name);
  const [examDate, setExamDate] = useState(meta.examDate ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const field =
    "w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent-1)]";
  const dirty = name.trim() !== meta.name || (examDate || null) !== (meta.examDate ?? null);

  const save = () => {
    if (!name.trim()) return;
    onSave(name.trim(), examDate || null);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="glass anim-overlay absolute inset-0" />
      <div className="frost anim-panel relative w-[min(94%,440px)] overflow-auto rounded-2xl border p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">코스 설정</p>
            <p className="truncate text-xl font-normal">{meta.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
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
        </div>

        {/* 코스 삭제 — 재확인. Exam Radar 항목만 지우고 Alt 녹음·전사는 보존. */}
        <div className="mt-5 border-t pt-4">
          {confirmDelete ? (
            <div className="space-y-2.5">
              <p className="text-sm leading-relaxed">
                <span className="font-medium text-foreground">{meta.name}</span> 코스를 정말
                삭제할까요? 결정맵·평가·강의 연결이 Exam Radar에서 사라지고 되돌릴 수 없습니다.{" "}
                <span className="text-muted-foreground">
                  Alt의 강의 녹음과 전사는 그대로 남습니다.
                </span>
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:opacity-90"
                >
                  <Trash2 className="size-4" /> 영구 삭제
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="size-3.5" /> 코스 삭제
            </button>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" onClick={save} disabled={!name.trim() || !dirty}>
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}
