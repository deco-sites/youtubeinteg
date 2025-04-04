import { JSX } from "preact";
import { useRef, useState } from "preact/hooks";
import { invoke } from "site/runtime.ts";

interface ThumbEditorFormProps {
  videoId?: string;
}

export default function ThumbEditorForm({ videoId }: ThumbEditorFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // O YouTube recomenda thumbnails de 1280x720 pixels (16:9)
  const MIN_WIDTH = 640;
  const RECOMMENDED_WIDTH = 1280;
  const RECOMMENDED_HEIGHT = 720;
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB em bytes
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

  const validateFile = (file: File): Promise<boolean> => {
    setError(null);
    
    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("O formato do arquivo deve ser JPG, PNG ou GIF.");
      return Promise.resolve(false);
    }
    
    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      setError(`O tamanho máximo permitido é 2MB. Seu arquivo tem ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
      return Promise.resolve(false);
    }
    
    // Validar dimensões da imagem
    return new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        
        if (width < MIN_WIDTH) {
          setError(`A largura mínima da imagem deve ser ${MIN_WIDTH}px. Sua imagem tem ${width}px.`);
          resolve(false);
          return;
        }
        
        // Verificar proporção (16:9)
        const aspectRatio = width / height;
        const expectedRatio = RECOMMENDED_WIDTH / RECOMMENDED_HEIGHT;
        const tolerance = 0.1; // Tolerância para pequenas variações
        
        if (Math.abs(aspectRatio - expectedRatio) > tolerance) {
          setError(`A proporção da imagem deve ser 16:9. A proporção atual é ${aspectRatio.toFixed(2)}.`);
          resolve(false);
          return;
        }
        
        resolve(true);
      };
      
      img.onerror = () => {
        setError("Erro ao carregar a imagem. Verifique se o arquivo é válido.");
        resolve(false);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: JSX.TargetedEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    setSuccess(null);
    
    if (!files || files.length === 0) {
      return;
    }
    
    const selectedFile = files[0];
    const isValid = await validateFile(selectedFile);
    
    if (isValid) {
      setFile(selectedFile);
      setThumbnail(URL.createObjectURL(selectedFile));
      setError(null);
    } else {
      setFile(null);
      setThumbnail(null);
    }
  };

  const handleDragOver = (e: JSX.TargetedDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: JSX.TargetedDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setSuccess(null);
    
    const files = e.dataTransfer?.files;
    
    if (!files || files.length === 0) {
      return;
    }
    
    const droppedFile = files[0];
    const isValid = await validateFile(droppedFile);
    
    if (isValid) {
      setFile(droppedFile);
      setThumbnail(URL.createObjectURL(droppedFile));
      setError(null);
    } else {
      setFile(null);
      setThumbnail(null);
    }
  };

  const handleUpload = async () => {
    if (!videoId) {
      setError("ID do vídeo não fornecido");
      return;
    }
    
    if (!file) {
      setError("Nenhum arquivo selecionado");
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Converter a imagem para base64
      const base64Image = await fileToBase64(file);
      
      // Enviar com invoke - usando o parâmetro imageData conforme configuração
      // @ts-ignore - Ignorando erros de tipo temporariamente
      const result = await invoke.Youtube.actions.updateThumbnail({
        videoId,
        imageData: base64Image,
      });
      
      setSuccess("Thumbnail atualizado com sucesso!");
      setError(null);
    } catch (error) {
      setError(`Erro ao atualizar thumbnail: ${error.message || "Erro desconhecido"}`);
      console.error("Erro ao atualizar thumbnail:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Função para converter arquivo para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remover o prefixo "data:image/jpeg;base64," para obter apenas o conteúdo base64
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error("Falha ao converter imagem para base64"));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleClickSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="card bg-base-100 p-6 shadow-lg">
      <h3 className="text-xl font-medium mb-4">Atualizar Thumbnail</h3>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 ${
          error ? "border-error" : thumbnail ? "border-success" : "border-base-300"
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {thumbnail ? (
          <div className="flex flex-col items-center">
            <img 
              src={thumbnail} 
              alt="Thumbnail preview" 
              className="max-w-full max-h-[300px] object-contain mb-4 rounded-md"
            />
            <div className="flex gap-2">
              <button 
                className="btn btn-sm" 
                onClick={handleClickSelect}
              >
                Alterar imagem
              </button>
              <button 
                className="btn btn-sm btn-error" 
                onClick={() => {
                  setThumbnail(null);
                  setFile(null);
                  setError(null);
                  setSuccess(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                Remover
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-16 w-16 text-base-300 mb-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <p className="mb-4">Arraste e solte uma imagem aqui ou</p>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={handleClickSelect}
            >
              Selecionar Imagem
            </button>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      
      {error && (
        <div className="alert alert-error mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 flex-shrink-0" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 flex-shrink-0" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <span>{success}</span>
        </div>
      )}
      
      <div className="text-sm text-base-content/70 mb-6">
        <p>Requisitos para thumbnails do YouTube:</p>
        <ul className="list-disc ml-5 mt-2">
          <li>Tamanho recomendado: 1280 x 720 pixels (16:9)</li>
          <li>Largura mínima: 640 pixels</li>
          <li>Formatos aceitos: JPG, PNG, GIF</li>
          <li>Tamanho máximo do arquivo: 2MB</li>
        </ul>
      </div>
      
      <button 
        className={`btn btn-primary w-full ${isUploading ? "loading" : ""}`}
        disabled={!file || isUploading}
        onClick={handleUpload}
      >
        {isUploading ? "Enviando..." : "Atualizar Thumbnail"}
      </button>
    </div>
  );
} 