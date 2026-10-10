import { useEffect, useRef } from "react";

export type Photo = { src: string; name: string };

type Props = {
  photos: Photo[];
  /** Which photo is showing, or null when the viewer is closed. */
  index: number | null;
  /** The name of the photo the visitor has asked for, if any. */
  picked: string | null;
  onShow: (index: number | null) => void;
  onPick: (name: string | null) => void;
};

/** The full-size photo viewer. Arrow keys, the buttons, or a sideways swipe move between photos. */
export function PhotoViewer({ photos, index, picked, onShow, onPick }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const swipeFrom = useRef<number | null>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (index !== null && !el.open) el.showModal();
    if (index === null && el.open) el.close();
  }, [index]);

  const photo = index === null ? null : photos[index];
  const step = (by: number) => {
    if (index !== null) onShow((index + by + photos.length) % photos.length);
  };

  return (
    <dialog
      ref={dialog}
      className="lb"
      aria-label="Photo viewer"
      onClose={() => onShow(null)}
      onClick={(e) => {
        if (e.target === dialog.current) onShow(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "ArrowRight") step(1);
      }}
    >
      {photo && index !== null && (
        <div className="lb__in">
          <div
            className="lb__pic"
            onPointerDown={(e) => {
              swipeFrom.current = e.clientX;
            }}
            onPointerUp={(e) => {
              if (swipeFrom.current === null) return;
              const dx = e.clientX - swipeFrom.current;
              swipeFrom.current = null;
              if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
            }}
            onPointerCancel={() => {
              swipeFrom.current = null;
            }}
          >
            <img src={photo.src} alt={photo.name} width={887} height={1920} />
          </div>
          <p className="lb__cap">
            <b>{photo.name}</b>
            <span>
              {index + 1} of {photos.length}
            </span>
          </p>
          <div className="lb__btns">
            <button className="tool" type="button" onClick={() => step(-1)}>
              Back
            </button>
            <button
              className="btn btn--sm"
              type="button"
              onClick={() => onPick(picked === photo.name ? null : photo.name)}
            >
              {picked === photo.name ? "Picked. Tap to undo" : "Ask for this cut"}
            </button>
            <button className="tool" type="button" onClick={() => step(1)}>
              Next
            </button>
            <button className="tool" type="button" onClick={() => onShow(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
