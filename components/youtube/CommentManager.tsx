import { useState, useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import type { VideoType } from "./VideoViewer.tsx";
import { invoke } from "site/runtime.ts";

export interface YouTubeCommentThread {
    kind: "youtube#commentThread";
    etag: string;
    id: string;
    snippet: {
      videoId: string;
      topLevelComment: {
        kind: "youtube#comment";
        etag: string;
        id: string;
        snippet: {
          authorDisplayName: string;
          authorProfileImageUrl: string;
          authorChannelUrl: string;
          textOriginal: string;
          likeCount: number;
          publishedAt: string;
          updatedAt: string;
        };
      };
      totalReplyCount: number;
    };
  }
  
  export interface YouTubeCommentThreadListResponse {
    kind: "youtube#commentThreadListResponse";
    etag: string;
    items: YouTubeCommentThread[];
  }

interface CommentManagerProps {
  video: VideoType | null;
  formatDate: (dateString: string) => string;
}

export default function CommentManager({ video, formatDate }: CommentManagerProps) {
    if (!video) return null;
  const [commentThreads, setCommentThreads] = useState<YouTubeCommentThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  // Carregar comentários do vídeo
  useEffect(() => {
    if (video?.id) {
      loadComments();
    }
  }, [video?.id]);

  const loadComments = async () => {
    if (!video?.id) return;
    
    setLoading(true);
    setError(null);
    
        console.log("video.id", video.id);
      const response = await invoke.Youtube.loaders.comments.list({
        parentId: video.id,
        maxResults: 20,
        pageToken: nextPageToken,
      }) as YouTubeCommentThreadListResponse
      console.log("response list comments", response);
      
      const data = response
      setCommentThreads([...new Set([...newComment, ...(data?.items || [])])]);

      setLoading(false);
      setError(null);
  }

  const handleSendComment = async (e: Event) => {
    e.preventDefault();
    const comentFromForm = (e.currentTarget as HTMLFormElement).querySelector("textarea")?.value;
    if (!newComment.trim() || !video?.id) return;
    
    try {
      const response = await invoke.Youtube.actions.comments.send({
        videoId: video.id,
        text: comentFromForm,
      });
      console.log("response send comment", response);
      
      // Limpar o campo e recarregar comentários
      setNewComment(response.comment.snippet.topLevelComment.snippet.textOriginal);
      setCommentThreads([...new Set([response.comment,...commentThreads])]);
      setNextPageToken(null);
      loadComments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    
    try {
      const response = await fetch("/api/comments/responder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentId,
          text: replyText,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Falha ao responder comentário");
      }
      
      // Limpar o campo e redefinir estado
      setReplyText("");
      setReplyingTo(null);
      
      // Expandir respostas e recarregar comentários
      setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
      // Recarregar comentários do início para ver a nova resposta
      setNextPageToken(null);
      loadComments();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleReplies = (threadId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [threadId]: !prev[threadId]
    }));
  };

  if (!video) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">Comentários</h3>
      
      {/* Formulário para novo comentário */}
      <form onSubmit={handleSendComment} className="mb-6">
        <div className="flex flex-col space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.currentTarget.value)}
            className="textarea textarea-bordered w-full"
            placeholder="Adicione um comentário..."
            rows={3}
          />
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={!newComment.trim()}>
              Comentar
            </button>
          </div>
        </div>
      </form>
      
      {/* Mensagem de erro */}
      {error && (
        <div className="alert alert-error mb-4">
          <div>{error}</div>
        </div>
      )}
      
      {/* Lista de comentários */}
      <div className="space-y-6">
        {commentThreads.map((thread) => (
          <div key={thread.id + "comment" + thread.snippet.topLevelComment.snippet.textOriginal + "reply" + thread.snippet.totalReplyCount + "expanded" + expandedReplies[thread.id]+Math.random()} className="flex flex-row gap-2 border-b border-gray-200 pb-2">
            <img src={thread.snippet.topLevelComment.snippet.authorProfileImageUrl} alt="Avatar" className="w-10 h-10 rounded-full" />
            <div className="flex flex-col">
              <div>{thread.snippet.topLevelComment.snippet.authorDisplayName}</div>
              <div className="flex flex-row gap-2">
                <div className="bg-gray-200 rounded-full p-2"> {thread.snippet.topLevelComment.snippet.textOriginal}</div>
                <div>
                  <button className="btn btn-sm btn-outline">Responder</button>
                </div>
              </div>

              <div>{thread.snippet.topLevelComment.snippet.publishedAt}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Botão de carregar mais */}
      {nextPageToken && (
        <div className="flex justify-center mt-4">
          <button
            onClick={loadComments}
            className="btn btn-outline"
            disabled={loading}
          >
            {loading ? "Carregando..." : "Carregar mais comentários"}
          </button>
        </div>
      )}
    </div>
  );
} 