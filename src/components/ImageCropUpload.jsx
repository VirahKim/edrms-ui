import { useState, useRef, useCallback } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const OUTPUT_SIZE = 300;

function initCrop(w, h) {
    return centerCrop(
        makeAspectCrop({ unit: "%", width: 90 }, 1, w, h),
        w,
        h
    );
}

// value: base64 string or null/""
// onChange: (base64String | null) => void
export default function ImageCropUpload({ value, onChange }) {
    const [srcImg, setSrcImg] = useState(null);
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);
    const fileRef = useRef(null);

    const onFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setSrcImg(reader.result);
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        setCrop(initCrop(width, height));
    };

    const confirmCrop = useCallback(() => {
        if (!completedCrop || !imgRef.current) return;
        const img = imgRef.current;
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;
        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        canvas.getContext("2d").drawImage(
            img,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0, 0, OUTPUT_SIZE, OUTPUT_SIZE
        );
        onChange(canvas.toDataURL("image/jpeg", 0.92));
        setSrcImg(null);
        setCompletedCrop(null);
    }, [completedCrop, onChange]);

    const cancelCrop = () => { setSrcImg(null); setCompletedCrop(null); };

    return (
        <div className="text-center">
            {srcImg ? (
                <>
                    <p className="text-muted f-12 mb-2">Drag to adjust. Output will be 300 × 300 px.</p>
                    <div className="d-flex justify-content-center">
                        <ReactCrop
                            crop={crop}
                            onChange={(c) => setCrop(c)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1}
                            circularCrop
                            minWidth={50}
                        >
                            <img
                                ref={imgRef}
                                src={srcImg}
                                alt="Crop source"
                                style={{ maxHeight: 280, maxWidth: "100%", display: "block" }}
                                onLoad={onImageLoad}
                            />
                        </ReactCrop>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-3">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={cancelCrop}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={confirmCrop}
                            disabled={!completedCrop}
                        >
                            <i className="ti ti-crop" /> Crop & Use
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {value ? (
                        <img
                            src={value}
                            alt="Preview"
                            className="rounded-circle mb-2"
                            style={{ width: 96, height: 96, objectFit: "cover", border: "3px solid #e0e0e0" }}
                        />
                    ) : (
                        <div
                            className="rounded-circle bg-light-primary d-flex align-items-center justify-content-center mx-auto mb-2"
                            style={{ width: 96, height: 96 }}
                        >
                            <i className="ti ti-user f-36 text-primary" />
                        </div>
                    )}
                    <div className="d-flex gap-2 justify-content-center">
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => fileRef.current?.click()}>
                            <i className="ti ti-upload" /> {value ? "Change Photo" : "Upload Photo"}
                        </button>
                        {value && (
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onChange(null)}>
                                <i className="ti ti-trash" /> Clear
                            </button>
                        )}
                    </div>
                </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={onFile} />
        </div>
    );
}
