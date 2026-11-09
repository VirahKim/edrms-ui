import { useEffect, useRef, useState } from "react";

// Canvas-based signature capture. Uses Pointer Events (not mouse/touch
// separately) so mouse, touchscreen finger input, and stylus/pen input on
// tablets/touch pads all drive the same code path, including pressure-less
// tools — pointer capture keeps the stroke locked to the canvas even if the
// finger/pen briefly leaves its bounds mid-stroke.
export default function SignaturePad({ onSave, saving, height = 160 }) {
    const canvasRef = useRef(null);
    const drawingRef = useRef(false);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ratio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        const ctx = canvas.getContext("2d");
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#1a1a2e";
    }, []);

    function getPos(e) {
        const rect = canvasRef.current.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function handlePointerDown(e) {
        e.preventDefault();
        canvasRef.current.setPointerCapture(e.pointerId);
        drawingRef.current = true;
        const ctx = canvasRef.current.getContext("2d");
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    function handlePointerMove(e) {
        if (!drawingRef.current) return;
        e.preventDefault();
        const ctx = canvasRef.current.getContext("2d");
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        if (isEmpty) setIsEmpty(false);
    }

    function handlePointerUp(e) {
        drawingRef.current = false;
        try { canvasRef.current.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    }

    function clear() {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
    }

    function save() {
        canvasRef.current.toBlob((blob) => {
            if (!blob) return;
            onSave(new File([blob], "signature.png", { type: "image/png" }));
        }, "image/png");
    }

    return (
        <div>
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height,
                    touchAction: "none",
                    border: "1px dashed #ced4da",
                    borderRadius: 6,
                    background: "#fff",
                    cursor: "crosshair"
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            />
            <div className="d-flex justify-content-between mt-2">
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={clear}
                    disabled={saving || isEmpty}
                >
                    <i className="ti ti-eraser me-1"></i>Clear
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={save}
                    disabled={saving || isEmpty}
                >
                    {saving
                        ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</>
                        : <><i className="ti ti-check me-1"></i>Use This Signature</>
                    }
                </button>
            </div>
        </div>
    );
}
