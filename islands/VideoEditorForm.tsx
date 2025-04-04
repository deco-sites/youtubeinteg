import { JSX } from "preact";
import { useSignal } from "@preact/signals";
import { invoke } from "site/runtime.ts";
import { VideoType } from "site/components/youtube/VideoViewer.tsx";
import CommentManager from "site/components/youtube/CommentManager.tsx";

interface VideoEditorFormProps {
  videoId?: string;
  video: VideoType;
  updateResult?: {
    success: boolean;
    message: string;
  };
}

export default function VideoEditorForm({
  videoId,
  video,
}: VideoEditorFormProps) {
  const title = useSignal(video?.snippet?.title || "");
  const description = useSignal(video?.snippet?.description || "");
  const tags = useSignal(video?.snippet?.tags?.join(", ") || "");
  const privacyStatus = useSignal(video?.status?.privacyStatus || "private");
  

  const handleSave = async () => {
    console.log("Iniciando a atualização");

      if (!videoId) {
        throw new Error("ID do vídeo não fornecido");
      }
      const param = {
        videoId: videoId,
        title: title.value,
        description: description.value,
        tags: tags.value[0],
        categoryId: "1",
        privacyStatus: privacyStatus.value as "public" | "private" | "unlisted"
      }
      // Enviar com invoke
      await invoke.Youtube.actions.updateVideo(param);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div>
      <div className="card bg-base-100 p-6 shadow-lg">
        <div className="form-control mb-4">
          <label className="label" htmlFor="title">
            <span className="label-text font-medium">Título</span>
          </label>
          <input
            type="text"
            id="title"
            value={title.value}
            onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => 
              title.value = e.currentTarget.value
            }
            className="input input-bordered w-full"
            maxLength={100}
          />
        </div>

        <div className="form-control mb-4">
          <label className="label" htmlFor="description">
            <span className="label-text font-medium">Descrição</span>
          </label>
          <textarea
            id="description"
            value={description.value}
            onChange={(e: JSX.TargetedEvent<HTMLTextAreaElement>) => 
              description.value = e.currentTarget.value
            }
            className="textarea textarea-bordered w-full min-h-[150px]"
          />
        </div>

        <div className="form-control mb-4">
          <label className="label" htmlFor="tags">
            <span className="label-text font-medium">Tags (separadas por vírgula)</span>
          </label>
          <input
            type="text"
            id="tags"
            value={tags.value}
            onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => 
              tags.value = e.currentTarget.value
            }
            className="input input-bordered w-full"
          />
        </div>

        <div className="form-control mb-6">
          <label className="label" htmlFor="privacyStatus">
            <span className="label-text font-medium">Privacidade</span>
          </label>
          <select
            id="privacyStatus"
            value={privacyStatus.value}
            onChange={(e: JSX.TargetedEvent<HTMLSelectElement>) => 
              privacyStatus.value = e.currentTarget.value
            }
            className="select select-bordered w-full"
          >
            <option value="public">Público</option>
            <option value="unlisted">Não listado</option>
            <option value="private">Privado</option>
          </select>
        </div>

        <button 
          onClick={handleSave}
          className="btn btn-primary w-full"
        >
          Salvar Alterações
        </button>
      </div>
    </div>
  );
} 