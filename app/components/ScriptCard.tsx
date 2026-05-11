"use client";
import { useState, useRef, useCallback } from "react";
import { Script } from "../lib/types";
import { countWords, formatDate, readTimeSec, formatReadTime } from "../lib/utils";
import { IconTrash, IconDuplicate, IconPlay } from "./Icons";

interface Props {
  script: Script;
  onEdit: (s: Script) => void;
  onDuplicate: (s: Script) => void;
  onDelete: (id: string) => void;
  onRecord: (s: Script) => void;
}

const SWIPE_REVEAL = 128; // px revealed on full swipe
const SWIPE_COMMIT = 48;  // px drag needed to commit open/close

export default function ScriptCard({ script, onEdit, onDuplicate, onDelete, onRecord }: Props) {
  const [offset, setOffset]               = useState(0);
  const [isOpen, setIsOpen]               = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dragging, setDragging]           = useState(false);

  const startX   = useRef(0);
  const startY   = useRef(0);
  const axis     = useRef<"h" | "v" | null>(null); // determined on first move

  const words    = countWords(script.body);
  const isEmpty  = words === 0;
  const readTime = formatReadTime(readTimeSec(words, null));

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
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 16 }}>

      {/* ── Swipe action panel — only for touch/mobile ── */}
      <div
        style={{
          position: "absolute", right: 0, top: 0, bottom: 0,
          width: SWIPE_REVEAL, display: "flex",
          borderRadius: "0 16px 16px 0", overflow: "hidden",
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
            gap: 5, fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600,
          }}
        >
          <IconDuplicate /> Copy
        </button>

        {confirmDelete ? (
          <button
            onClick={() => { onDelete(script.id); close(); }}
            style={{
              flex: 1, border: "none", cursor: "pointer",
              background: "#dc2626", color: "white",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 5, fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700,
            }}
          >
            <IconTrash /> Sure?
          </button>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              flex: 1, border: "none", cursor: "pointer",
              background: "#fee2e2", color: "#dc2626",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 5, fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 600,
            }}
          >
            <IconTrash /> Delete
          </button>
        )}
      </div>

      {/* ── Card face ── */}
      <div
        className="card animate-fade-in"
        style={{
          cursor: "pointer",
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 0.25s cubic-bezier(0.25,1,0.5,1)",
          position: "relative", zIndex: 1, userSelect: "none", WebkitUserSelect: "none",
        }}
        onClick={handleCardClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17,
              color: "var(--text)", marginBottom: 2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {script.title || (
                <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>
                  {new Date(script.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} script
                </span>
              )}
            </h3>
            <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
              <span>{formatDate(script.updatedAt)}</span>
              <span>·</span>
              <span>{words} words</span>
              {!isEmpty && <><span>·</span><span>{readTime}</span></>}
            </div>
          </div>

          {/*
            Desktop: Play + Duplicate + Delete always visible.
            Mobile:  only the Play button visible (small, icon-only).
                     Duplicate + Delete are behind the swipe panel.
            Achieved with two separate action groups + CSS classes.
          */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>

            {/* Play — visible on both, but styled differently */}
            {!isEmpty && (
              <>
                {/* Mobile: small icon-only play button */}
                <button
                  className="mobile-only btn btn-icon"
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    color: "var(--accent)", borderColor: "var(--accent)",
                    background: "rgba(22,163,74,0.08)",
                  }}
                  onClick={() => onRecord(script)}
                  title="Record now"
                >
                  <IconPlay size={14} />
                </button>

                {/* Desktop: labelled button */}
                <button
                  className="desktop-only btn btn-icon"
                  style={{
                    height: 38, borderRadius: 10, padding: "0 14px", width: "auto",
                    gap: 6, fontSize: 12, fontWeight: 700,
                    color: "var(--accent)", borderColor: "var(--accent)",
                    background: "rgba(22,163,74,0.07)",
                    display: "inline-flex", alignItems: "center",
                  }}
                  onClick={() => onRecord(script)}
                  title="Record now"
                >
                  <IconPlay size={13} /> Record
                </button>
              </>
            )}

            {/* Duplicate + Delete — desktop only (mobile uses swipe) */}
            <button
              className="desktop-only btn btn-icon"
              style={{ width: 40, height: 40, borderRadius: 10 }}
              onClick={() => onDuplicate(script)}
              title="Duplicate"
            >
              <IconDuplicate />
            </button>

            {confirmDelete ? (
              <>
                <button
                  className="desktop-only btn btn-icon"
                  style={{ height: 40, borderRadius: 10, fontSize: 11, fontFamily: "var(--font-mono)", color: "#dc2626", borderColor: "#dc2626", padding: "0 12px", width: "auto" }}
                  onClick={() => { onDelete(script.id); setConfirmDelete(false); }}
                >
                  Delete
                </button>
                <button
                  className="desktop-only btn btn-icon"
                  style={{ width: 40, height: 40, borderRadius: 10, fontSize: 13 }}
                  onClick={() => setConfirmDelete(false)}
                >✕</button>
              </>
            ) : (
              <button
                className="desktop-only btn btn-icon"
                style={{ width: 40, height: 40, borderRadius: 10, color: "#dc2626" }}
                onClick={() => setConfirmDelete(true)}
                title="Delete"
              >
                <IconTrash />
              </button>
            )}
          </div>
        </div>

        {/* Preview */}
        {!isEmpty ? (
          <div className="script-card-preview" dangerouslySetInnerHTML={{ __html: script.body }} />
        ) : (
          <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>
            No content yet. Tap to edit.
          </p>
        )}

        {/* Swipe hint — only shown on touch, only when closed */}
        {!isOpen && !isEmpty && (
          <div
            className="swipe-hint mobile-only"
            style={{
              position: "absolute", right: 14, bottom: 12,
              fontSize: 9, color: "var(--text-3)", fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em", opacity: 0.6,
              pointerEvents: "none",
            }}
          >
            ← swipe
          </div>
        )}
      </div>
    </div>
  );
}
