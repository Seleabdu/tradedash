import React, { useState, useRef, useEffect } from 'react';

export default function MultiSelectDropdown({
  label,
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select tags...',
  accentColor = 'var(--amber)',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((item) => item !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const clearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--bone-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 6,
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{label}</span>
          {selected.length > 0 && (
            <span style={{ fontSize: 10.5, color: accentColor }}>
              {selected.length} selected
            </span>
          )}
        </div>
      )}

      {/* Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          minHeight: 38,
          padding: '6px 10px',
          background: 'var(--ink-3)',
          border: `1px solid ${isOpen ? accentColor : 'var(--line)'}`,
          borderRadius: 4,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          gap: 8,
          transition: 'border-color 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1, minWidth: 0 }}>
          {selected.length === 0 ? (
            <span style={{ fontSize: 12.5, color: 'var(--bone-faint)' }}>{placeholder}</span>
          ) : (
            selected.map((item) => (
              <span
                key={item}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${accentColor}44`,
                  color: 'var(--bone)',
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 12,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {item}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(item);
                  }}
                  style={{
                    cursor: 'pointer',
                    color: 'var(--bone-faint)',
                    fontSize: 12,
                    lineHeight: 1,
                    marginLeft: 2,
                  }}
                  onMouseEnter={(e) => (e.target.style.color = 'var(--red)')}
                  onMouseLeave={(e) => (e.target.style.color = 'var(--bone-faint)')}
                >
                  ×
                </span>
              </span>
            ))
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--bone-faint)',
                fontSize: 11,
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Clear
            </button>
          )}
          <span style={{ color: 'var(--bone-faint)', fontSize: 10, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            ▼
          </span>
        </div>
      </div>

      {/* Popover List */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--ink-2)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            maxHeight: 240,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {options.length > 6 && (
            <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--line-soft)' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                style={{
                  width: '100%',
                  background: 'var(--ink-3)',
                  border: '1px solid var(--line)',
                  borderRadius: 3,
                  color: 'var(--bone)',
                  padding: '4px 8px',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>
          )}

          <div style={{ overflowY: 'auto', flex: 1, padding: 4 }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: 10, fontSize: 12, color: 'var(--bone-faint)', textAlign: 'center' }}>
                No options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selected.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => toggleOption(opt)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      fontSize: 12.5,
                      borderRadius: 4,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(232, 163, 61, 0.12)' : 'transparent',
                      color: isSelected ? accentColor : 'var(--bone)',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--ink-3)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent div onClick
                      style={{ accentColor: accentColor, cursor: 'pointer' }}
                    />
                    <span>{opt}</span>
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
