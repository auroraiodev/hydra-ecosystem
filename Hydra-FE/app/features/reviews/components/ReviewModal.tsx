'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { submitReview } from '@/lib/api/reviews';
import { tokenStore } from '@/lib/utils/tokenStore';
import { useToastContext } from '@/features/shared/components/ToastProvider';

import { RATING_LABELS } from '../constants';
import { type ReviewModalProps } from '../types';

export function ReviewModal({ orderId, isOpen, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success: showSuccess, error: showError } = useToastContext();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenStore.get();
    if (!token) {
      showError('Debes iniciar sesión para dejar una reseña');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitReview(
        {
          rating,
          comment,
          order_id: orderId,
        },
        token
      );

      if (result.success) {
        showSuccess('Â¡Gracias! Tu reseña ha sido enviada para moderación.');
        onSuccess();
        onClose();
      } else {
        showError(result.message || 'Error al enviar la reseña');
      }
    } catch {
      showError('Error de red');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
      onKeyDown={handleBackdropKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Cerrar modal"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
        >
          <X className="size-5" />
        </button>

        <div className="p-8 lg:p-10">
          <div className="text-center mb-8">
            <span className="text-primary font-black tracking-[0.2em] text-[10px] uppercase mb-2 block">
              Voces de la Comunidad
            </span>
            <h2
              id="review-modal-title"
              className="text-2xl font-semibold text-zinc-900 tracking-tight uppercase"
            >
              Tu Experiencia <span className="text-primary">Importa</span>
            </h2>
            <p className="text-zinc-500 text-sm mt-2">
              Â¿Cómo fue tu experiencia con esta orden? Tus palabras ayudan a otros coleccionistas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="gap-y-6">
            <div className="flex flex-col items-center">
              <div role="radiogroup" aria-label="Calificación" className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} de 5 estrellas`}
                    className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                  >
                    <Star
                      className={`size-10 transition-colors ${
                        star <= (hover || rating)
                          ? 'fill-gold text-gold scale-110'
                          : 'text-zinc-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-bold text-zinc-400 mt-2 uppercase tracking-widest">
                {RATING_LABELS[rating]}
              </span>
            </div>

            <div className="gap-y-2">
              <label
                htmlFor="review-comment"
                className="text-xs font-black text-zinc-900 uppercase tracking-widest"
              >
                Tu Comentario
              </label>
              <textarea
                id="review-comment"
                required
                className="w-full h-32 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                placeholder="Cuéntanos qué te pareció el servicio, la protección de las cartas o el tiempo de envío..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : 'Enviar Testimonio'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
