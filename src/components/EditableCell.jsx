import { useState, useRef, useEffect } from 'react';

/**
 * Editable cell component — click to edit, Enter/Escape/Blur to confirm/cancel
 */
export default function EditableCell({ value, placeholder, onSave, prefix, isInteger }) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function startEditing() {
    setTempValue(value !== null && value !== undefined ? String(value) : '');
    setEditing(true);
  }

  function handleSave() {
    setEditing(false);
    if (tempValue.trim() === '') {
      onSave(null);
    } else {
      onSave(tempValue.trim());
    }
  }

  function handleCancel() {
    setEditing(false);
    setTempValue('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="editable-input"
        type="number"
        step={isInteger ? '1' : '0.01'}
        min="0"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
      />
    );
  }

  const hasValue = value !== null && value !== undefined;

  return (
    <div className="editable-cell" onClick={startEditing} title="Clique para editar">
      <span className={`display-value ${hasValue ? 'modified' : ''}`}>
        {hasValue ? (
          <>
            {prefix && <span style={{ fontSize: 11, opacity: 0.7, marginRight: 2 }}>{prefix} </span>}
            {isInteger ? value : Number(value).toFixed(2)}
          </>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
        )}
      </span>
      <span className="edit-icon">✏️</span>
    </div>
  );
}
