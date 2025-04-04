export interface VideoType {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      high: { url: string };
      medium: { url: string };
      default: { url: string };
    };
  };
  status?: {
    privacyStatus: string;
  };
}

interface VideoViewerProps {
  video: VideoType | null;
  formatDate: (dateString: string) => string;
}

export default function VideoViewer({ video, formatDate }: VideoViewerProps) {
  if (!video) {
    return <div>Vídeo não encontrado</div>;
  }
  return (
    <div className="card bg-base-200 p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <img
            src={video.snippet.thumbnails.high?.url ||
              video.snippet.thumbnails.medium?.url ||
              video.snippet.thumbnails.default.url}
            alt={video.snippet.title}
            className="w-full rounded-lg"
          />
        </div>
        <div className="md:w-2/3">
          <h3 className="text-xl font-bold mb-2">{video.snippet.title}</h3>
          <div className="space-y-1">
            <p><span className="badge badge-neutral mr-2">ID:</span> {video.id}</p>
            <p><span className="badge badge-neutral mr-2">Canal:</span> {video.snippet.channelTitle}</p>
            <p><span className="badge badge-neutral mr-2">Publicado em:</span> {formatDate(video.snippet.publishedAt)}</p>
            <p>
              <span className="badge badge-neutral mr-2">Status:</span>
              <span className={`badge ${video.status?.privacyStatus === "public" ? "badge-success" : 
                video.status?.privacyStatus === "unlisted" ? "badge-warning" : "badge-error"}`}>
                {video.status?.privacyStatus === "public"
                  ? "Público"
                  : video.status?.privacyStatus === "unlisted"
                  ? "Não listado"
                  : "Privado"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 