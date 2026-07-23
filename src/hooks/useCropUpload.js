import { useState, useRef, useCallback } from "react";

/**
 * Wires "pick file(s) -> crop each one -> upload" into a single call.
 * uploadFn: (File) => Promise<url>
 * aspectDefault: number|null passed to ImageCropModal (null = free / natural image aspect)
 *
 * Returns { open, cropProps } — render <ImageCropModal {...cropProps}/> when cropProps is not null.
 */
export function useCropUpload(uploadFn, aspectDefault = null) {
  const [current, setCurrent] = useState(null); // { file, url }
  const [remaining, setRemaining] = useState(0);
  const queueRef = useRef([]);
  const resultsRef = useRef([]);
  const doneRef = useRef(null);
  const uploadFnRef = useRef(uploadFn);
  uploadFnRef.current = uploadFn;

  const advance = useCallback(() => {
    if (queueRef.current.length === 0) {
      setCurrent(c => { if (c) URL.revokeObjectURL(c.url); return null; });
      const results = resultsRef.current;
      resultsRef.current = [];
      const cb = doneRef.current;
      doneRef.current = null;
      cb?.(results);
      return;
    }
    const next = queueRef.current.shift();
    setRemaining(queueRef.current.length);
    setCurrent(c => { if (c) URL.revokeObjectURL(c.url); return { file: next, url: URL.createObjectURL(next) }; });
  }, []);

  const open = useCallback((files, onComplete) => {
    const arr = Array.from(files || []);
    if (arr.length === 0) return;
    queueRef.current = arr;
    resultsRef.current = [];
    doneRef.current = onComplete;
    advance();
  }, [advance]);

  const handleCropped = useCallback(async (blob) => {
    const name = (current?.file?.name || "image").replace(/\.\w+$/, "") + ".jpg";
    const file = new File([blob], name, { type: "image/jpeg" });
    try {
      const url = await uploadFnRef.current(file);
      resultsRef.current.push(url);
    } catch (err) {
      alert(err.message || "Upload failed");
    }
    advance();
  }, [current, advance]);

  const handleCancel = useCallback(() => {
    const results = resultsRef.current;
    resultsRef.current = [];
    queueRef.current = [];
    const cb = doneRef.current;
    doneRef.current = null;
    setCurrent(c => { if (c) URL.revokeObjectURL(c.url); return null; });
    cb?.(results);
  }, []);

  const cropProps = current ? {
    imageSrc: current.url,
    aspectDefault,
    remaining,
    onCropped: handleCropped,
    onCancel: handleCancel,
  } : null;

  return { open, cropProps };
}
