import { useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';

export default function QRModal({ shortUrl, linkId, onClose }) {
  const qrRef = useRef();
  const [size, setSize] = [128, 256, 384][1]; // medium by default

  const downloadQR = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `qr-${linkId}.png`;
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="glass-card p-8 max-w-sm w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">QR Code</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100"
          >
            ✕
          </button>
        </div>

        {/* QR Code */}
        <div ref={qrRef} className="flex justify-center mb-6 bg-white p-4 rounded-lg">
          <QRCode
            value={shortUrl}
            size={256}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* URL */}
        <p className="text-center text-sm text-slate-300 mb-6 break-all">
          {shortUrl}
        </p>

        {/* Download Button */}
        <button
          onClick={downloadQR}
          className="btn-primary w-full"
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}
