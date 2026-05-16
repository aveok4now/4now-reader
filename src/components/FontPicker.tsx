import { useEffect, useRef, useState } from "react";

interface FontPickerProps {
  value: string;
  onChange: (font: string) => void;
  fonts: string[];
  placeholder?: string;
}

export function FontPicker({
  value,
  onChange,
  fonts,
  placeholder,
}: FontPickerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);
  const originalValueRef = useRef(value);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const filtered = !searchQuery
    ? fonts
    : fonts.filter((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0) {
      activeItemRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [isOpen, highlightedIndex]);

  const open = () => {
    if (isOpen) return;
    originalValueRef.current = value;
    setSearchQuery("");
    setHighlightedIndex(fonts.findIndex((f) => f === value));
    setIsOpen(true);
  };

  const commit = (font: string) => {
    onChange(font);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const cancel = () => {
    onChange(originalValueRef.current);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filtered.length === 0) return;
      const next =
        highlightedIndex < 0 ? 0 : (highlightedIndex + 1) % filtered.length;
      setHighlightedIndex(next);
      onChange(filtered[next]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filtered.length === 0) return;
      const next =
        highlightedIndex <= 0 ? filtered.length - 1 : highlightedIndex - 1;
      setHighlightedIndex(next);
      onChange(filtered[next]);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        commit(filtered[highlightedIndex]);
      } else if (filtered.length > 0) {
        commit(filtered[0]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  return (
    <div ref={wrapRef} className="fnr-font-picker">
      <input
        ref={inputRef}
        type="text"
        className="fnr-font-input"
        placeholder={placeholder}
        value={value}
        onFocus={open}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          const v = e.target.value;
          setSearchQuery(v);
          onChange(v);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
      />
      {isOpen && filtered.length > 0 && (
        <div className="fnr-font-dropdown" role="listbox">
          {filtered.map((font, idx) => {
            const isActive = idx === highlightedIndex;
            return (
              <div
                key={font}
                ref={isActive ? activeItemRef : undefined}
                className={`fnr-font-suggestion${isActive ? " is-active" : ""}`}
                role="option"
                aria-selected={isActive}
                style={{ fontFamily: font }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(font);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
              >
                {font}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
