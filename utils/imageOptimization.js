/**
 * Image Optimization Utilities
 * Transform Cloudinary URLs for optimal loading
 */

// Max dimensions for different use cases
const IMAGE_SIZES = {
    thumbnail: { width: 150, height: 150 },
    card: { width: 400, height: 400 },
    detail: { width: 800, height: 800 },
    full: { width: 1200, height: 1200 }
};

/**
 * Transform a Cloudinary URL to add optimization parameters
 * @param {string} url - Original Cloudinary URL
 * @param {object} options - Transformation options
 * @returns {string} - Optimized URL
 */
export const optimizeImageUrl = (url, options = {}) => {
    if (!url || !url.includes('cloudinary.com')) {
        return url; // Return as-is if not Cloudinary
    }

    const {
        width = null,
        height = null,
        quality = 'auto:good',
        format = 'auto',
        crop = 'limit'
    } = options;

    // Build transformation string
    const transforms = [];

    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    transforms.push(`q_${quality}`);
    transforms.push(`f_${format}`);
    if (width || height) transforms.push(`c_${crop}`);

    const transformString = transforms.join(',');

    // Insert transformations into Cloudinary URL
    // Format: .../upload/TRANSFORMS/...
    return url.replace('/upload/', `/upload/${transformString}/`);
};

/**
 * Get thumbnail version of image
 */
export const getThumbnail = (url) => {
    return optimizeImageUrl(url, {
        width: IMAGE_SIZES.thumbnail.width,
        height: IMAGE_SIZES.thumbnail.height,
        crop: 'thumb'
    });
};

/**
 * Get card-sized version of image (for product cards, category cards)
 */
export const getCardImage = (url) => {
    return optimizeImageUrl(url, {
        width: IMAGE_SIZES.card.width,
        quality: 'auto:good'
    });
};

/**
 * Get detail view version of image
 */
export const getDetailImage = (url) => {
    return optimizeImageUrl(url, {
        width: IMAGE_SIZES.detail.width,
        quality: 'auto:best'
    });
};

/**
 * Check if an image file exceeds size limits
 * @param {File|Blob} file - Image file to check
 * @param {number} maxSizeKB - Maximum size in KB (default 500KB)
 * @returns {boolean} - True if file is too large
 */
export const isImageTooLarge = (file, maxSizeKB = 500) => {
    if (!file) return false;
    const sizeKB = file.size / 1024;
    return sizeKB > maxSizeKB;
};

/**
 * Check if image dimensions exceed limits
 * @param {string} imageUri - Image URI/URL
 * @param {number} maxWidth - Maximum width (default 1200)
 * @param {number} maxHeight - Maximum height (default 1200)
 * @returns {Promise<{ tooLarge: boolean, width: number, height: number }>}
 */
export const checkImageDimensions = (imageUri, maxWidth = 1200, maxHeight = 1200) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                tooLarge: img.width > maxWidth || img.height > maxHeight,
                width: img.width,
                height: img.height
            });
        };
        img.onerror = () => {
            resolve({ tooLarge: false, width: 0, height: 0 });
        };
        img.src = imageUri;
    });
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
