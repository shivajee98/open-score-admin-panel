/**
 * Utility to convert HEIC/HEIF images to JPEG on the client side.
 * This should be used before uploading images to the server to ensure compatibility.
 */

export async function convertHeicToJpeg(file: File): Promise<File> {
    const isHeic = 
        file.type === 'image/heic' || 
        file.type === 'image/heif' || 
        file.name.toLowerCase().endsWith('.heic') || 
        file.name.toLowerCase().endsWith('.heif');

    if (!isHeic) {
        return file;
    }

    try {
        // Dynamically import heic2any to keep initial bundle size small
        const heic2any = (await import('heic2any')).default;
        
        const blob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8
        });

        const convertedBlob = Array.isArray(blob) ? blob[0] : blob;
        
        return new File(
            [convertedBlob], 
            file.name.replace(/\.(heic|heif)$/i, '.jpg'), 
            { type: 'image/jpeg', lastModified: Date.now() }
        );
    } catch (error) {
        console.error('HEIC conversion failed:', error);
        // Fallback to original file if conversion fails
        return file;
    }
}
