import { toast } from 'react-hot-toast';

interface LogoValidationResult {
  isValid: boolean;
  error?: string;
}

interface LogoDimensions {
  width: number;
  height: number;
}

const getLogoDimensions = (file: File): Promise<LogoDimensions> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => {
      reject(new Error('Impossible de charger l\'image'));
    };
    img.src = URL.createObjectURL(file);
  });
};

export const validateLogo = async (file: File): Promise<LogoValidationResult> => {
  // Vérification du type de fichier
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Format de fichier non supporté. Formats acceptés : ${allowedTypes.join(', ')}`
    };
  }

  // Vérification de la taille du fichier (max 500KB)
  const maxSize = 500 * 1024; // 500KB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Le fichier est trop volumineux. Taille maximale : 500KB. Taille actuelle : ${(file.size / 1024).toFixed(1)}KB`
    };
  }

  try {
    // Vérification des dimensions
    const dimensions = await getLogoDimensions(file);

    // Dimensions minimales : 200x200
    if (dimensions.width < 200 || dimensions.height < 200) {
      return {
        isValid: false,
        error: `L'image est trop petite. Dimensions minimales : 200x200px. Dimensions actuelles : ${dimensions.width}x${dimensions.height}px`
      };
    }

    // Dimensions maximales : 1000x1000
    if (dimensions.width > 1000 || dimensions.height > 1000) {
      return {
        isValid: false,
        error: `L'image est trop grande. Dimensions maximales : 1000x1000px. Dimensions actuelles : ${dimensions.width}x${dimensions.height}px`
      };
    }

    // Vérification du ratio (carré ou proche du carré)
    const ratio = dimensions.width / dimensions.height;
    if (ratio < 0.9 || ratio > 1.1) {
      return {
        isValid: false,
        error: `Le ratio de l'image doit être proche du carré (1:1). Ratio actuel : ${ratio.toFixed(2)}:1`
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Erreur lors de l\'analyse de l\'image'
    };
  }
};