import { AppContext } from "site/apps/site.ts";
import VideoViewer, { VideoType } from "site/components/youtube/VideoViewer.tsx";
import VideoEditorForm from "site/islands/VideoEditorForm.tsx";
import ThumbEditorForm from "site/islands/ThumbEditorForm.tsx";
import CommentManager from "site/islands/CommentManeger.tsx";
import VideoDashboardIsland from "site/islands/VideoDashboardIsland.tsx";

interface Props {
  videoId?: string;
  video?: VideoType;
  updateResult?: {
    success: boolean;
    message: string;
  };
  accessToken?: string | null;
  authorizationUrl?: string;
  thumbnail?: {
    thumbnails: {
      default: { url: string };
      medium?: { url: string };
      high?: { url: string };
      standard?: { url: string };
      maxres?: { url: string };
    };
  };
  comments?: any[];
  engagement?: {
    viewsPerDay: number;
    likesPerView: number;
    commentsPerView: number;
    uploadDate: string;
    daysOnline: number;
  };
}

export async function loader(
  _props: unknown,
  req: Request,
  ctx: AppContext,
) {
  const urlParams = new URL(req.url).searchParams;
  const videoId = urlParams.get("videoId");
  const success = urlParams.get("success");
  const message = urlParams.get("message");

  // Obter dados de autenticação
  // @ts-ignore - Ignorar erro do Typescript para continuar
  const authData = await ctx.invoke.Youtube.loaders.authentication();
  const { accessToken, authorizationUrl } = authData;

  // Verificar resultado da operação de atualização, se houver
  let updateResult = null;
  if (success !== null && message) {
    updateResult = {
      success: success === "true",
      message,
    };
  }

  if (!accessToken) {
    return {
      accessToken,
      authorizationUrl,
      videoId,
      video: null,
      updateResult,
    };
  }

  if (!videoId) {
    return {
      accessToken,
      authorizationUrl,
      videoId: null,
      video: null,
      updateResult: updateResult || {
        success: false,
        message: "ID do vídeo não fornecido",
      },
    };
  }

  // @ts-ignore - Ignorar erro do Typescript para continuar
  const videoData = await ctx.invoke.Youtube.loaders.videos.details({
    videoId: videoId,
    parts: ["snippet", "status", "contentDetails", "statistics", "topicDetails"],
  });

  const { engagement } = await ctx.invoke.Youtube.loaders.videos.analyze({
    videoId: videoId,
    commentCount: 10,
    relatedVideosCount: 10,
    includeEngagement: true,
    parts: ["snippet", "status", "contentDetails", "statistics", "topicDetails"],
  });

  if (!videoData?.items || videoData.items.length === 0) {
    return {
      accessToken,
      authorizationUrl,
      videoId,
      video: null,
      updateResult: updateResult || {
        success: false,
        message: "Vídeo não encontrado na API do YouTube",
      },
    };
  }

  const video = videoData.items[0];

  // @ts-ignore - Ignorar erro do Typescript para continuar
  const comments = await ctx.invoke.Youtube.loaders.comments.list({
    parentId: videoId,
    maxResults: 20,
  });

  return {
    accessToken,
    authorizationUrl,
    videoId,
    video,
    updateResult,
    comments: comments?.items || [],
    engagement
  };
}

// Componente principal
export default function Section(
  { videoId, video, updateResult, comments, engagement }: Props,
) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Convertendo video undefined para null para compatibilidade com os componentes
  const videoForComponents = video === undefined ? null : video;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <VideoViewer video={videoForComponents} formatDate={formatDate} />
    
      <div className="flex flex-col md:flex-row gap-6 mt-6">
        <div className="md:w-2/3">
          <VideoEditorForm
            videoId={videoId}
            video={video!}
            updateResult={updateResult}
          />
        </div>
        <div className="md:w-1/3">
          <ThumbEditorForm videoId={videoId} />
        </div>
      </div>
      
      <VideoDashboardIsland
        video={videoForComponents} 
        comments={comments} 
        engagement={engagement} 
        formatDate={formatDate} 
      />
      
      <div className="mt-8">
        <CommentManager video={videoForComponents} formatDate={formatDate} />
      </div>
    </div>
  );
}
