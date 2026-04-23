import { useState, useRef, useEffect } from "react";

/**
 * Custom searchable dropdown / multi-select with zero external dependencies.
 * Keyboard accessible: ArrowUp/ArrowDown to navigate, Enter to select, Escape to close.
 *
 * Props:
 *   options      — array of { value, label }
 *   value        — single string (single mode) or array of strings (multi mode)
 *   onChange     — (newValue) => void
 *   placeholder  — string
 *   multiple     — boolean
 *   disabled     — boolean
 */
export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Search...",
  multiple = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  // Normalise current selection
  const selectedValues = multiple
    ? Array.isArray(value)
      ? value
      : []
    : value
      ? [value]
      : [];

  const selectedSet = new Set(selectedValues);

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(query.toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  const toggleOption = (opt) => {
    if (multiple) {
      const next = selectedSet.has(opt.value)
        ? selectedValues.filter((v) => v !== opt.value)
        : [...selectedValues, opt.value];
      onChange(next);
    } else {
      onChange(opt.value);
      setOpen(false);
    }
    setQuery("");
    setActiveIndex(-1);
  };

  const removeTag = (val, e) => {
    e.stopPropagation();
    if (multiple) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange("");
    }
  };

  const selectedLabels = selectedValues
    .map((v) => options.find((o) => o.value === v)?.label || v)
    .filter(Boolean);

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev + 1;
          return next >= filtered.length ? 0 : next;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? filtered.length - 1 : next;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filtered.length) {
          toggleOption(filtered[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(filtered.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? "searchable-select-list" : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 ? `select-option-${filtered[activeIndex]?.value}` : undefined
        }
        tabIndex={disabled ? -1 : 0}
        style={{
          ...styles.input,
          ...(disabled ? styles.disabled : {}),
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.35rem",
          alignItems: "center",
          minHeight: "40px",
          outline: open ? "2px solid #4F46E5" : "none",
        }}
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => !prev);
            setActiveIndex(-1);
          }
        }}
        onKeyDown={handleKeyDown}
      >
        {selectedLabels.length === 0 ? (
          <span style={{ color: "#9CA3AF" }}>{placeholder}</span>
        ) : (
          selectedLabels.map((label, idx) => (
            <span key={idx} style={styles.tag}>
              {label}
              <button
                type="button"
                style={styles.tagRemove}
                onClick={(e) => removeTag(selectedValues[idx], e)}
                aria-label={`Remove ${label}`}
              >
                ×
              </button>
            </span>
          ))
        )}
        <span style={{ marginLeft: "auto", color: "#9CA3AF", fontSize: "0.75rem" }}>
          {open ? "▲" : "▼"}
        </span>
      </div>

      {open && (
        <div id="searchable-select-list" role="listbox" style={styles.dropdown}>
          <input
            ref={searchRef}
            type="text"
            autoFocus
            placeholder="Type to search..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1); }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            style={styles.search}
            aria-autocomplete="list"
            aria-controls="searchable-select-list"
          />
          <div style={styles.list}>
            {filtered.length === 0 ? (
              <div style={styles.empty}>No results</div>
            ) : (
              filtered.map((opt, idx) => {
                const isSelected = selectedSet.has(opt.value);
                const isActive = idx === activeIndex;
                return (
                  <div
                    id={`select-option-${opt.value}`}
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    style={{
                      ...styles.item,
                      ...(isSelected ? styles.itemSelected : {}),
                      ...(isActive ? styles.itemActive : {}),
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(opt);
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <span style={styles.check}>✓</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  input: {
    border: "1px solid #e5e7eb",
    borderRadius: "0.375rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    background: "#fff",
    width: "100%",
  },
  disabled: {
    background: "#f3f4f6",
    opacity: 0.6,
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    background: "#EEF2FF",
    color: "#4F46E5",
    padding: "0.15rem 0.5rem",
    borderRadius: "0.25rem",
    fontSize: "0.8rem",
    fontWeight: 500,
  },
  tagRemove: {
    background: "none",
    border: "none",
    color: "#4F46E5",
    cursor: "pointer",
    fontSize: "0.9rem",
    padding: 0,
    lineHeight: 1,
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "0.375rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    zIndex: 50,
    maxHeight: "280px",
    display: "flex",
    flexDirection: "column",
  },
  search: {
    border: "none",
    borderBottom: "1px solid #e5e7eb",
    padding: "0.6rem 0.75rem",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
  },
  list: {
    overflowY: "auto",
    maxHeight: "220px",
  },
  item: {
    padding: "0.55rem 0.75rem",
    cursor: "pointer",
    fontSize: "0.85rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f3f4f6",
  },
  itemSelected: {
    background: "#EEF2FF",
    color: "#4F46E5",
    fontWeight: 500,
  },
  itemActive: {
    background: "#f3f4f6",
  },
  check: {
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  empty: {
    padding: "0.75rem",
    color: "#9CA3AF",
    fontSize: "0.8rem",
    textAlign: "center",
  },
};
