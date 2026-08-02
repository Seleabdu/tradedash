import React from 'react';

export default function LightboxModal({ images = [], currentIndex = 0, onClose, onNavigate }) {
  if (!images || images.length === 0) return null;

  const currentImg = images[currentIndex];

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justify: 'center',
        padding: 20,
      }}
    >
      {/* Header */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 16,
          left: 24,
          right: 24,
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          color: 'var(--bone)',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--bone-dim)', fontWeight: 500 }}>
          Screenshot {currentIndex + 1} of {images.length}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'var(--bone)',
            width: 36,
            height: 36,
            borderRadius: '50%',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Main Image View */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '82vh',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
        }}
      >
        <img
          src={currentImg}
          alt={`Trade Screenshot ${currentIndex + 1}`}
          style={{
            maxWidth: '100%',
            maxHeight: '82vh',
            objectFit: 'contain',
            borderRadius: 6,
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            border: '1px solid var(--line)',
          }}
        />

        {/* Prev Button */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: -50,
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid var(--line)',
              color: 'white',
              width: 40,
              height: 40,
              borderRadius: '50%',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ‹
          </button>
        )}

        {/* Next Button */}
        {currentIndex < images.length - 1 && (
          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: -50,
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid var(--line)',
              color: 'white',
              width: 40,
              height: 40,
              borderRadius: '50%',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}
