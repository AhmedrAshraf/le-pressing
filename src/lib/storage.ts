import { supabase } from './supabase';

interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    current: string | number;
    expected: string;
  };
}

interface ImageDimensions {
  width: number;
  height: number;
}

const getImageDimensions = (file: File): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
};

const validateImage = async (file: File): Promise<ImageValidationResult> => {
  // Check file type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return {
      isValid: false,
      error: 'Format de fichier non supporté',
      details: {
        current: file.type,
        expected: 'JPG, PNG ou WebP'
      }
    };
  }

  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Fichier trop volumineux',
      details: {
        current: `${(file.size / (1024 * 1024)).toFixed(2)}Mo`,
        expected: '5Mo maximum'
      }
    };
  }

  try {
    // Check dimensions
    const dimensions = await getImageDimensions(file);

    // Width validation (200px - 2000px)
    if (dimensions.width < 200 || dimensions.width > 2000) {
      return {
        isValid: false,
        error: 'Largeur non conforme',
        details: {
          current: `${dimensions.width}px`,
          expected: 'entre 200px et 2000px'
        }
      };
    }

    // Height validation (200px - 2000px)
    if (dimensions.height < 200 || dimensions.height > 2000) {
      return {
        isValid: false,
        error: 'Hauteur non conforme',
        details: {
          current: `${dimensions.height}px`,
          expected: 'entre 200px et 2000px'
        }
      };
    }

    // Aspect ratio validation (between 4:3 and 16:9)
    const ratio = dimensions.width / dimensions.height;
    const minRatio = 4 / 3;
    const maxRatio = 16 / 9;

    if (ratio < minRatio || ratio > maxRatio) {
      return {
        isValid: false,
        error: 'Ratio d\'aspect non conforme',
        details: {
          current: `${ratio.toFixed(2)}:1`,
          expected: 'entre 4:3 et 16:9'
        }
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Erreur lors de l\'analyse de l\'image',
      details: {
        current: 'Erreur',
        expected: 'Image valide'
      }
    };
  }
};

export async function uploadEventImage(file: File) {
  try {
    // Validate image before upload
    const validation = await validateImage(file);
    if (!validation.isValid) {
      throw new Error(
        `${validation.error}\n` +
        `Valeur actuelle : ${validation.details?.current}\n` +
        `Valeur attendue : ${validation.details?.expected}`
      );
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `events/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('events')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    throw error;
  }
}

export async function deleteEventImage(url: string) {
  try {
    const path = url.split('/').pop();
    if (!path) return;

    const { error } = await supabase.storage
      .from('events')
      .remove([`events/${path}`]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    throw error;
  }
}