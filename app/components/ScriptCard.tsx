"use client";
import { useState } from "react";
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

export default function ScriptCard({ script, onEdit, onDuplicate, onDelete, onRecord }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const words    = countWords(script.body);
  const isEmpty  = words === 0;
  const readTime = formatReadTime(readTimeSec(words, null));

  return (
    <div
      className="card animate-fade-in"
      style={{ cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}
      onClick={() => onEdit(script)}
    >
      {/* Title row */}
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

        {/* Action buttons — stopPropagation so card click doesn't also fire */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>

          {/* Quick record — only when there is content */}
          {!isEmpty && (
            <button
              className="btn btn-icon"
              style={{ width: 44, height: 44, borderRadius: 12, color: "var(--accent)", borderColor: "var(--accent)", opacity: 0.85 }}
              onClick={() => onRecord(script)}
              title="Record now"
            >
              <IconPlay size={16} />
            </button>
          )}

          <button
            className="btn btn-icon"
            style={{ width: 44, height: 44, borderRadius: 12 }}
            onClick={() => onDuplicate(script)}
            title="Duplicate"
          >
            <IconDuplicate />
          </button>

          {/* Inline delete — first tap shows confirm, second tap deletes */}
          {confirmDelete ? (
            <>
              <button
                className="btn btn-icon"
                style={{ height: 44, borderRadius: 12, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--accent)", borderColor: "var(--accent)", padding: "0 12px", width: "auto" }}
                onClick={() => onDelete(script.id)}
                title="Confirm delete"
              >
                Delete
              </button>
              <button
                className="btn btn-icon"
                style={{ width: 44, height: 44, borderRadius: 12, fontSize: 14 }}
                onClick={() => setConfirmDelete(false)}
                title="Cancel"
              >
                ✕
              </button>
            </>
          ) : (
            <button
              className="btn btn-icon"
              style={{ width: 44, height: 44, borderRadius: 12, color: "var(--accent)" }}
              onClick={() => setConfirmDelete(true)}
              title="Delete"
            >
              <IconTrash />
            </button>
          )}
        </div>
      </div>

      {/* Rich text preview — 2-line clamp */}
      {!isEmpty ? (
        <div
          className="script-card-preview"
          dangerouslySetInnerHTML={{ __html: script.body }}
        />
      ) : (
        <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>
          No content yet. Tap to edit.
        </p>
      )}
    </div>
  );
}
