import jsQR from 'jsqr';

/**
 * Decode the QRIS payload string from an uploaded image of a QR code.
 * Returns the raw QR text (e.g. "000201...6304xx") or null when unreadable.
 */
export async function decodeQrImage(file: File | Blob): Promise<string | null> {
    const bitmap = await createImageBitmap(file);

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
            return null;
        }

        // try native size first, then 2x upscale — small QR images often
        // only decode after upsampling
        for (const factor of [1, 2]) {
            canvas.width = bitmap.width * factor;
            canvas.height = bitmap.height * factor;
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const result = jsQR(frame.data, frame.width, frame.height, {
                inversionAttempts: 'attemptBoth',
            });

            if (result?.data) {
                return result.data;
            }
        }

        return null;
    } finally {
        bitmap.close();
    }
}
