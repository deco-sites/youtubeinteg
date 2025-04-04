import { useEffect, useRef, useState } from "preact/hooks";
import VideoDashboard from "../components/youtube/VideoDashboard.tsx";

// Importando o tipo VideoWithStats do componente de dashboard
interface VideoWithStats {
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

interface VideoDashboardIslandProps {
  video: VideoWithStats | null;
  comments?: CommentThread[];
  engagement?: EngagementData;
  
}

export default function VideoDashboardIsland(props: VideoDashboardIslandProps) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  const { video, engagement } = props;
  const [chartLoaded, setChartLoaded] = useState(false);
  const chartScriptRef = useRef<HTMLScriptElement | null>(null);
  
  // Calcular os valores para exibição
  const viewCount = parseInt(video?.statistics?.viewCount || "0");
  const likeCount = parseInt(video?.statistics?.likeCount || "0");
  const commentCount = parseInt(video?.statistics?.commentCount || "0");
  
  const viewsPerDay = engagement?.viewsPerDay || 0;
  const likesPerView = engagement?.likesPerView || 0;
  const commentsPerView = engagement?.commentsPerView || 0;

  // Gerar IDs únicos para os elementos canvas
  const viewChartId = `view-chart-${video?.id || 'default'}`;
  const engagementChartId = `engagement-chart-${video?.id || 'default'}`;

  useEffect(() => {
    if (!video || !engagement) return;
    
    // Só carrega o script uma vez
    if (!chartScriptRef.current) {
      // Verificar se o Chart.js já está carregado
      // @ts-ignore - Chart pode estar definido globalmente
      if (typeof window !== 'undefined' && window.Chart) {
        setChartLoaded(true);
        return;
      }
      
      // Primeiro carregamos a biblioteca Chart.js
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.async = true;
      
      script.onload = () => {
        setChartLoaded(true);
      };
      
      document.body.appendChild(script);
      chartScriptRef.current = script;
    }
  }, [video, engagement]);
  
  useEffect(() => {
    if (!chartLoaded || !video || !engagement) return;
    
    // Função para renderizar os gráficos quando Chart.js estiver carregado
    const renderCharts = () => {
      try {
        // @ts-ignore - Chart será definido globalmente pelo script
        if (typeof Chart === 'undefined') return;
        
        // Gráfico de visualizações/likes/comentários
        const viewCtx = document.getElementById(viewChartId) as HTMLCanvasElement;
        if (viewCtx) {
          // Limpar qualquer gráfico existente
          const existingChart = getExistingChart(viewCtx);
          if (existingChart) existingChart.destroy();
          
          // @ts-ignore - Chart é definido globalmente
          new Chart(viewCtx, {
            type: 'pie',
            data: {
              labels: ['Visualizações', 'Likes', 'Comentários'],
              datasets: [{
                data: [viewCount, likeCount, commentCount],
                backgroundColor: [
                  'rgba(54, 162, 235, 0.7)',
                  'rgba(255, 99, 132, 0.7)',
                  'rgba(255, 206, 86, 0.7)'
                ],
                borderColor: [
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 99, 132, 1)',
                  'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom'
                },
                tooltip: {
                  callbacks: {
                    label: function(context: { dataIndex: number, formattedValue: string, label: string }) {
                      return `${context.label}: ${parseInt(context.formattedValue).toLocaleString('pt-BR')}`;
                    }
                  }
                }
              }
            }
          });
        }
        
        // Gráfico de métricas de engajamento
        const engagementCtx = document.getElementById(engagementChartId) as HTMLCanvasElement;
        if (engagementCtx) {
          // Limpar qualquer gráfico existente
          const existingChart = getExistingChart(engagementCtx);
          if (existingChart) existingChart.destroy();
          
          const labels = ["Visualizações/dia", "Likes/visualização", "Comentários/visualização"];
          const data = [viewsPerDay, likesPerView, commentsPerView];
          const maxValue = Math.max(...data);
          const normalizedData = data.map(v => v === 0 ? 0 : (v / maxValue) * 100);
          
          // @ts-ignore - Chart é definido globalmente
          new Chart(engagementCtx, {
            type: 'bar',
            data: {
              labels,
              datasets: [{
                label: 'Métricas de Engajamento (normalizado)',
                data: normalizedData,
                backgroundColor: [
                  'rgba(54, 162, 235, 0.7)',
                  'rgba(255, 99, 132, 0.7)',
                  'rgba(255, 206, 86, 0.7)'
                ],
                borderColor: [
                  'rgba(54, 162, 235, 1)',
                  'rgba(255, 99, 132, 1)',
                  'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: function(value: number) {
                      if (value === 0) return '0';
                      if (value === 100) {
                        if (data[0] === viewsPerDay) return viewsPerDay.toFixed(2);
                        if (data[1] === likesPerView) return likesPerView.toFixed(4);
                        if (data[2] === commentsPerView) return commentsPerView.toFixed(4);
                      }
                      return '';
                    }
                  }
                }
              },
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  callbacks: {
                    label: function(context: { dataIndex: number }) {
                      const index = context.dataIndex;
                      const value = data[index];
                      if (index === 0) return `Visualizações/dia: ${value.toFixed(2)}`;
                      if (index === 1) return `Likes/visualização: ${(value * 100).toFixed(2)}%`;
                      if (index === 2) return `Comentários/visualização: ${(value * 100).toFixed(2)}%`;
                      return '';
                    }
                  }
                }
              }
            }
          });
        }
      } catch (error) {
        console.error("Erro ao renderizar gráficos:", error);
      }
    };
    
    // Função auxiliar para obter um gráfico existente
    function getExistingChart(canvas: HTMLCanvasElement) {
      // @ts-ignore - Chart.js adiciona esta propriedade
      return canvas.__chart__;
    }
    
    // Renderizar os gráficos
    setTimeout(() => {
      renderCharts();
    }, 300); // Pequeno delay para garantir que o DOM esteja pronto
    
    // Cleanup
    return () => {
      try {
        const viewCtx = document.getElementById(viewChartId) as HTMLCanvasElement;
        if (viewCtx) {
          const existingChart = getExistingChart(viewCtx);
          if (existingChart) existingChart.destroy();
        }
        
        const engagementCtx = document.getElementById(engagementChartId) as HTMLCanvasElement;
        if (engagementCtx) {
          const existingChart = getExistingChart(engagementCtx);
          if (existingChart) existingChart.destroy();
        }
      } catch (e) {
        console.error("Erro ao limpar gráficos:", e);
      }
    };
  }, [chartLoaded, video, engagement, viewChartId, engagementChartId]);

  return (
    <div>
      <VideoDashboard {...props} />
      
      {video && engagement && (
        <div className="card bg-base-100 shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Análise Visual</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-base-200 rounded-box p-4">
              <h3 className="font-semibold mb-4 text-center">Métricas do Vídeo</h3>
              <div className="h-64">
                <canvas id={viewChartId}></canvas>
              </div>
            </div>
            
            <div className="bg-base-200 rounded-box p-4">
              <h3 className="font-semibold mb-4 text-center">Métricas de Engajamento</h3>
              <div className="h-64">
                <canvas id={engagementChartId}></canvas>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-base-200 rounded-box p-4">
            <h3 className="font-semibold mb-2">Análise de Desempenho</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>
                {viewsPerDay < 1 
                  ? "Este vídeo tem um número baixo de visualizações diárias. Considere melhorar as tags e a otimização para SEO." 
                  : "O vídeo está obtendo um bom número de visualizações diárias."}
              </li>
              <li>
                {likesPerView < 0.01 
                  ? "A taxa de likes por visualização está abaixo da média. Considere melhorar o conteúdo para aumentar o engajamento." 
                  : "O vídeo está recebendo uma boa taxa de likes por visualização."}
              </li>
              <li>
                {commentsPerView < 0.01 
                  ? "A taxa de comentários está abaixo da média. Incentive os espectadores a comentar com perguntas ou call-to-actions." 
                  : "O vídeo está gerando uma boa discussão nos comentários."}
              </li>
              <li>
                {engagement.daysOnline > 365 
                  ? "Este é um conteúdo mais antigo. Considere atualizá-lo ou criar um novo vídeo sobre o assunto." 
                  : "Este é um conteúdo relativamente recente."}
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 