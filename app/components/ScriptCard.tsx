"use client";
import { Script } from "../lib/types";
import { IconTrash, IconDuplicate, IconEdit } from "./Icons";

interface Props {
  script: Script;
  onEdit: (s: Script) => void;
  onDuplicate: (s: Script) => void;
  onDelete: (id: string) => void;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function ScriptCard({ script, onEdit, onDuplicate, onDelete }: Props) {
  const words = wordCount(script.body);
  const preview = script.body.slice(0, 100).trim();

  return (
    <div
      className="card animate-fade-in"
      style={{ cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}
      onClick={() => onEdit(script)}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 17,
            color: "var(--text)",
            marginBottom: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {script.title || <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>Untitled script</span>}
          </h3>
          <div style={{
            display: "flex",
            gap: 12,
            fontSize: 12,
            color: "var(--text-3)",
            fontFamily: "var(--font-mono)"
          }}>
            <span>{formatDate(script.updatedAt)}</span>
            <span>·</span>
            <span>{words} words</span>
          </div>
        </div>
        <div
          style={{ display: "flex", gap: 6 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="btn btn-icon"
            style={{ width: 36, height: 36, borderRadius: 10, fontSize: 14 }}
            onClick={() => onDuplicate(script)}
            title="Duplicate"
          >
            <IconDuplicate />
          </button>
          <button
            className="btn btn-icon"
            style={{ width: 36, height: 36, borderRadius: 10, fontSize: 14, color: "var(--accent)" }}
            onClick={() => {
              if (confirm("Delete this script?")) onDelete(script.id);
            }}
            title="Delete"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      {preview && (
        <p style={{
          fontSize: 13,
          color: "var(--text-2)",
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>
          {preview}{script.body.length > 100 ? "…" : ""}
        </p>
      )}

      {!preview && (
        <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>
          No content yet. Tap to edit.
        </p>
      )}
    </div>
  );
}
