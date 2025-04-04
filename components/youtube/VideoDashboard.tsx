import { VideoType } from "./VideoViewer.tsx";

interface VideoWithStats extends VideoType {
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
    favoriteCount?: string;
    dislikeCount?: string;
  };
}

interface EngagementData {
  viewsPerDay: number;
  likesPerView: number;
  commentsPerView: number;
  uploadDate: string;
  daysOnline: number;
}

interface CommentThread {
  id: string;
  snippet: {
    videoId: string;
    topLevelComment: {
      id: string;
      snippet: {
        authorDisplayName: string;
        authorProfileImageUrl: string;
        textOriginal: string;
        likeCount: number;
        publishedAt: string;
      };
    };
    totalReplyCount: number;
  };
}

interface VideoDashboardProps {
  video: VideoWithStats | null;
  comments?: CommentThread[];
  engagement?: EngagementData;
}

export default function VideoDashboard({ video, comments, engagement,  }: VideoDashboardProps) {
  if (!video) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  const viewCount = parseInt(video.statistics?.viewCount || "0");
  const likeCount = parseInt(video.statistics?.likeCount || "0");
  const commentCount = parseInt(video.statistics?.commentCount || "0");

  return (
    <div className="card bg-base-100 shadow-lg p-6 mt-6">
      <h2 className="text-xl font-bold mb-4">Dashboard do Vídeo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat bg-base-200 rounded-box p-4">
          <div className="stat-title">Visualizações</div>
          <div className="stat-value text-primary">{viewCount.toLocaleString('pt-BR')}</div>
          {engagement && (
            <div className="stat-desc">
              {engagement.viewsPerDay.toFixed(2)} visualizações/dia
            </div>
          )}
        </div>
        
        <div className="stat bg-base-200 rounded-box p-4">
          <div className="stat-title">Likes</div>
          <div className="stat-value text-secondary">{likeCount.toLocaleString('pt-BR')}</div>
          {engagement && (
            <div className="stat-desc">
              Taxa de {(engagement.likesPerView * 100).toFixed(2)}% por visualização
            </div>
          )}
        </div>
        
        <div className="stat bg-base-200 rounded-box p-4">
          <div className="stat-title">Comentários</div>
          <div className="stat-value text-accent">{commentCount.toLocaleString('pt-BR')}</div>
          {engagement && (
            <div className="stat-desc">
              {(engagement.commentsPerView * 100).toFixed(2)}% dos espectadores comentam
            </div>
          )}
        </div>
      </div>
      
      {engagement && (
        <div className="bg-base-200 rounded-box p-4 mb-6">
          <h3 className="font-semibold mb-2">Informações de Engajamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><span className="font-medium">Data de upload:</span> {formatDate(engagement.uploadDate)}</p>
              <p><span className="font-medium">Dias online:</span> {engagement.daysOnline}</p>
            </div>
            <div>
              <p><span className="font-medium">Média de visualizações por dia:</span> {engagement.viewsPerDay.toFixed(2)}</p>
              <p><span className="font-medium">Taxa de engajamento:</span> {((engagement.likesPerView + engagement.commentsPerView) * 100).toFixed(2)}%</p>
            </div>
          </div>
        </div>
      )}
      
      {comments && comments.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Comentários Recentes</h3>
          <div className="space-y-4 max-h-60 overflow-y-auto">
            {comments.slice(0, 5).map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-base-200 rounded-box">
                <img 
                  src={comment.snippet.topLevelComment.snippet.authorProfileImageUrl} 
                  alt={comment.snippet.topLevelComment.snippet.authorDisplayName}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{comment.snippet.topLevelComment.snippet.authorDisplayName}</p>
                    <p className="text-xs text-gray-500">{formatDate(comment.snippet.topLevelComment.snippet.publishedAt)}</p>
                  </div>
                  <p className="text-sm mt-1">{comment.snippet.topLevelComment.snippet.textOriginal}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>👍 {comment.snippet.topLevelComment.snippet.likeCount}</span>
                    {comment.snippet.totalReplyCount > 0 && (
                      <span>💬 {comment.snippet.totalReplyCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 