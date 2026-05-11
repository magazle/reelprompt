"use client";
import { Script } from "../lib/types";
import { IconTrash, IconDuplicate } from "./Icons";

interface Props {
  script: Script;
  onEdit: (s: Script) => void;
  onDuplicate: (s: Script) => void;
  onDelete: (id: string) => void;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function countWords(html: string) {
  const plain = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return plain ? plain.split(" ").length : 0;
}

export default function ScriptCard({ script, onEdit, onDuplicate, onDelete }: Props) {
  const words   = countWords(script.body);
  // Plain text for word-count; rich HTML for preview
  const isEmpty = words === 0;

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
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
          }}>
            {script.title || <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>Untitled script</span>}
          </h3>
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
            <span>{formatDate(script.updatedAt)}</span>
            <span>·</span>
            <span>{words} words</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-icon"
            style={{ width: 36, height: 36, borderRadius: 10, fontSize: 14 }}
            onClick={() => onDuplicate(script)}
            title="Duplicate"
          ><IconDuplicate /></button>
          <button
            className="btn btn-icon"
            style={{ width: 36, height: 36, borderRadius: 10, fontSize: 14, color: "var(--accent)" }}
            onClick={() => { if (confirm("Delete this script?")) onDelete(script.id); }}
            title="Delete"
          ><IconTrash /></button>
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
