"use client";
import { useState, useRef, useCallback } from "react";
import { Script } from "../lib/types";
import { countWords, formatDate, readTimeSec, formatClock } from "../lib/utils";
import { IconTrash, IconDuplicate } from "./Icons";

interface Props {
  script: Script;
  onEdit: (s: Script) => void;
  onDuplicate: (s: Script) => void;
  onDelete: (id: string) => void;
  onRecord: (s: Script) => void;
  highlight?: boolean; // most recent script gets the yellow "slate" card
}

const SWIPE_REVEAL = 128; // px revealed on full swipe
const SWIPE_COMMIT = 48;  // px drag needed to commit open/close

export default function ScriptCard({ script, onEdit, onDuplicate, onDelete, onRecord, highlight = false }: Props) {
  const [offset, setOffset]               = useState(0);
  const [isOpen, setIsOpen]               = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dragging, setDragging]           = useState(false);

  const startX   = useRef(0);
  const startY   = useRef(0);
  const axis     = useRef<"h" | "v" | null>(null); // determined on first move

  const words    = countWords(script.body);
  const isEmpty  = words === 0;
  const clock    = formatClock(readTimeSec(words, null));

  // ── Swipe handlers ────────────────────────────────────────────────────

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    axis.current   = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (axis.current === null) {
      axis.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
    }
    if (axis.current === "v") return;

    e.preventDefault();
    setDragging(true);

    const base    = isOpen ? -SWIPE_REVEAL : 0;
    const clamped = Math.min(0, Math.max(-(SWIPE_REVEAL + 10), base + dx));
    setOffset(clamped);
  };

  const onTouchEnd = () => {
    if (!dragging) return;
    setDragging(false);

    if (!isOpen && offset < -SWIPE_COMMIT) {
      setOffset(-SWIPE_REVEAL); setIsOpen(true);
    } else if (isOpen && offset > -(SWIPE_REVEAL - SWIPE_COMMIT)) {
      setOffset(0); setIsOpen(false); setConfirmDelete(false);
    } else {
      setOffset(isOpen ? -SWIPE_REVEAL : 0);
    }
  };

  const close = useCallback(() => {
    setOffset(0); setIsOpen(false); setConfirmDelete(false);
  }, []);

  const handleCardClick = () => {
    if (isOpen) { close(); return; }
    onEdit(script);
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 20 }}>

      {/* ── Swipe action panel — only for touch/mobile ── */}
      <div
        style={{
          position: "absolute", right: 0, top: 0, bottom: 0,
          width: SWIPE_REVEAL, display: "flex",
          borderRadius: "0 20px 20px 0", overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { onDuplicate(script); close(); }}
          style={{
            flex: 1, border: "none", cursor: "pointer",
            background: "var(--bg-3)", color: "var(--text-2)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 5, fontSize: 11, fontWeight: 600,
          }}
        >
          <IconDuplicate /> Copy
        </button>

        {confirmDelete ? (
          <button
            onClick={() => { onDelete(script.id); close(); }}
            style={{
              flex: 1, border: "none", cursor: "pointer",
              background: "var(--danger)", color: "white",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 5, fontSize: 11, fontWeight: 700,
            }}
          >
            <IconTrash /> Sure?
          </button>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              flex: 1, border: "none", cursor: "pointer",
              background: "#FDE8E6", color: "var(--danger)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 5, fontSize: 11, fontWeight: 600,
            }}
          >
            <IconTrash /> Delete
          </button>
        )}
      </div>

      {/* ── Card face ── */}
      <div
        className="animate-fade-in"
        style={{
          cursor: "pointer",
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 0.25s cubic-bezier(0.25,1,0.5,1)",
          position: "relative", zIndex: 1, userSelect: "none", WebkitUserSelect: "none",
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 14px 14px 18px", borderRadius: 20,
          background: highlight ? "var(--highlight)" : "var(--surface)",
          border: "2px solid var(--ink)",
        }}
        onClick={handleCardClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Reading time — the number that matters for a reel */}
        <div style={{
          fontFamily: "var(--font-headline)", fontWeight: 800, fontSize: 32,
          letterSpacing: "-0.03em", lineHeight: 1, width: 72, flexShrink: 0,
          color: isEmpty ? "var(--text-3)" : "var(--ink)", fontVariantNumeric: "tabular-nums",
        }}>
          {isEmpty ? "0:00" : clock}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <h3 style={{
            fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, lineHeight: 1.25,
            color: "var(--ink)", margin: 0,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {script.title || (
              <span style={{ color: "var(--text-2)", fontStyle: "italic", fontWeight: 500 }}>
                Untitled script
              </span>
            )}
          </h3>
          <div style={{ fontSize: 12, color: highlight ? "var(--ink)" : "var(--text-2)" }}>
            {isEmpty ? "Empty · tap to write" : `${words} words · ${formatDate(script.updatedAt)}`}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
          {!isEmpty && (
            <button
              onClick={() => onRecord(script)}
              aria-label={`Record ${script.title || "script"}`}
              title="Record"
              style={{
                width: 48, height: 48, borderRadius: "50%", border: "none", cursor: "pointer",
                background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--rec)" }} />
            </button>
          )}

          {/* Duplicate + Delete — desktop only (mobile uses swipe) */}
          <button
            className="desktop-only card-extra btn btn-icon"
            style={{ width: 40, height: 40, borderRadius: "50%" }}
            onClick={() => onDuplicate(script)}
            aria-label="Duplicate" title="Duplicate"
          >
            <IconDuplicate />
          </button>

          {confirmDelete ? (
            <>
              <button
                className="desktop-only card-extra btn btn-icon"
                style={{ height: 40, borderRadius: 20, fontSize: 12, color: "var(--danger)", borderColor: "var(--danger)", padding: "0 12px", width: "auto" }}
                onClick={() => { onDelete(script.id); setConfirmDelete(false); }}
              >
                Delete
              </button>
              <button
                className="desktop-only card-extra btn btn-icon"
                style={{ width: 40, height: 40, borderRadius: "50%", fontSize: 13 }}
                onClick={() => setConfirmDelete(false)}
                aria-label="Cancel"
              >✕</button>
            </>
          ) : (
            <button
              className="desktop-only card-extra btn btn-icon"
              style={{ width: 40, height: 40, borderRadius: "50%", color: "var(--danger)" }}
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete" title="Delete"
            >
              <IconTrash />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
