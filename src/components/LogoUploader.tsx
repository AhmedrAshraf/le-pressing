import React, { useState } from 'react';
import { validateLogo } from '../lib/logoValidation';
import { toast } from 'react-hot-toast';
import { Upload, X } from 'lucide-react';

interface LogoUploaderProps {
  onLogoChange: (file: File | null) => void;
  currentLogo?: string;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ onLogoChange, currentLogo }) => {
  const [preview, setPreview] = useState<string | null>(currentLogo || null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const validation = await validateLogo(file);
      
      if (!validation.isValid) {
        toast.error(validation.error);
        event.target.value = '';
        return;
      }

      // Créer l'aperçu
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      onLogoChange(file);
    } catch (error) {
      toast.error('Erreur lors de la validation du logo');
      console.error(error);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onLogoChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="relative cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
          />
          <div className="flex items-center gap-2 bg-comedy-orange text-white px-4 py-2 rounded-md hover:bg-opacity-90">
            <Upload className="w-5 h-5" />
            <span>Choisir un logo</span>
          </div>
        </label>
        {preview && (
          <button
            onClick={handleRemove}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <X className="w-5 h-5" />
            <span>Supprimer</span>
          </button>
        )}
      </div>

      {preview && (
        <div className="relative w-40 h-40">
          <img
            src={preview}
            alt="Aperçu du logo"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p>Exigences pour le logo :</p>
        <ul className="list-disc list-inside">
          <li>Format : PNG, JPEG ou WebP</li>
          <li>Taille maximale : 500KB</li>
          <li>Dimensions : entre 200x200px et 1000x1000px</li>
          <li>Ratio : proche du carré (1:1)</li>
        </ul>
      </div>
    </div>
  );
};

export default LogoUploader;