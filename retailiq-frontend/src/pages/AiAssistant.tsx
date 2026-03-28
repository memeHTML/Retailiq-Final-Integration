import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Textarea } from '@/components/ui/Textarea';
import { normalizeApiError } from '@/utils/errors';
import { useAiV2QueryMutation, useAiV2RecommendMutation } from '@/hooks/aiTools';
import { useAiRecommendMutation, useNlpQueryMutation } from '@/hooks/nlp';
import type { AiRecommendation, NlpResponse } from '@/types/models';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  source?: 'v1' | 'v2' | 'fallback';
  meta?: NlpResponse | null;
}

const quickPrompts = [
  'What were my top products last week?',
  'How is my inventory looking?',
  'Show me revenue trend for the last 30 days',
  "Which customers haven't purchased in 30 days?",
];

const makeMessageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function formatAssistantReply(response: NlpResponse) {
  return [response.headline, response.detail, response.action].filter(Boolean).join('\n\n') || 'No response available.';
}

export default function AiAssistantPage() {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  const v2QueryMutation = useAiV2QueryMutation();
  const v1QueryMutation = useNlpQueryMutation();
  const v2RecommendMutation = useAiV2RecommendMutation();
  const v1RecommendMutation = useAiRecommendMutation();

  const assistantMessages = messages.filter((message) => message.role === 'assistant');
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];

  useEffect(() => {
    const anchor = scrollAnchorRef.current;
    if (anchor && typeof anchor.scrollIntoView === 'function') {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, assistantBusy]);

  const appendMessage = (message: Omit<ChatMessage, 'id' | 'createdAt'> & { createdAt?: string }) => {
    setMessages((current) => [
      ...current,
      {
        id: makeMessageId(),
        createdAt: message.createdAt ?? new Date().toISOString(),
        role: message.role,
        content: message.content,
        source: message.source,
        meta: message.meta ?? null,
      },
    ]);
  };

  const sendPrompt = async (value: string) => {
    const prompt = value.trim();
    if (!prompt || assistantBusy) {
      return;
    }

    setChatError(null);
    setAssistantBusy(true);
    appendMessage({ role: 'user', content: prompt, source: 'v2' });
    setDraft('');

    try {
      const v2Response = await v2QueryMutation.mutateAsync({ query: prompt });
      if (v2Response.response?.trim()) {
        appendMessage({
          role: 'assistant',
          content: v2Response.response,
          source: 'v2',
        });
        return;
      }

      throw new Error('Empty AI response');
    } catch (primaryError) {
      try {
        const fallback = await v1QueryMutation.mutateAsync({ query_text: prompt });
        appendMessage({
          role: 'assistant',
          content: formatAssistantReply(fallback),
          source: 'fallback',
          meta: fallback,
        });
      } catch (fallbackError) {
        const normalized = normalizeApiError(fallbackError);
        const fallbackMessage = normalizeApiError(primaryError).message || normalized.message;
        setChatError(fallbackMessage);
        appendMessage({
          role: 'assistant',
          content: `I couldn't complete that request right now. ${normalized.message}`,
          source: 'fallback',
        });
      }
    } finally {
      setAssistantBusy(false);
    }
  };

  const refreshRecommendations = async () => {
    try {
      const response = await v2RecommendMutation.mutateAsync({});
      setRecommendations(response.recommendations ?? []);
    } catch {
      const fallback = await v1RecommendMutation.mutateAsync({});
      setRecommendations(fallback.recommendations ?? []);
    }
  };

  return (
    <PageFrame title="AI Assistant" subtitle="Ask natural-language questions about sales, inventory, and customer trends.">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-4">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-600"
                onClick={() => {
                  void sendPrompt(prompt);
                }}
              >
                <Sparkles size={14} />
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex min-h-[560px] flex-col">
            <div className="flex-1 space-y-4 overflow-auto p-4">
              {messages.length === 0 ? (
                <EmptyState
                  title="Start a conversation"
                  body="Try asking about revenue, top products, customers, or inventory health."
                />
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-200 bg-gray-50 text-gray-900'
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide opacity-80">
                        {message.role === 'user' ? 'You' : 'RetailIQ AI'}
                        {message.source ? <Badge variant="secondary">{message.source}</Badge> : null}
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-6">{message.content}</div>
                      <div className="mt-2 text-xs opacity-70">{formatTime(message.createdAt)}</div>
                      {message.meta ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="info">{message.meta.intent}</Badge>
                          {message.meta.action ? <Badge variant="secondary">{message.meta.action}</Badge> : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
              {assistantBusy ? (
                <div className="flex items-start gap-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                  <Loader2 size={16} className="animate-spin" />
                  Thinking through the answer...
                </div>
              ) : null}
              <div ref={scrollAnchorRef} />
            </div>

            <div className="border-t border-gray-100 p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="ai-assistant-input">
                Ask RetailIQ
              </label>
              <Textarea
                id="ai-assistant-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendPrompt(draft);
                  }
                }}
                rows={4}
                placeholder="Ask about sales, products, customers, or opportunities..."
                className="min-h-[120px] resize-y"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500">Press Enter to send. Shift+Enter creates a new line.</p>
                <Button onClick={() => void sendPrompt(draft)} disabled={!draft.trim() || assistantBusy}>
                  <Send size={16} className="mr-2" />
                  Send
                </Button>
              </div>
              {chatError ? <p className="mt-3 text-sm text-red-600">{chatError}</p> : null}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bot size={18} />
                Assistant status
              </CardTitle>
              <Badge variant={assistantBusy ? 'warning' : 'success'}>{assistantBusy ? 'Thinking' : 'Ready'}</Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>The assistant tries the v2 AI NLP route first and falls back to the v1 NLP engine if needed.</p>
              {lastAssistantMessage ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Last reply</div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{lastAssistantMessage.content}</div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>AI Recommendations</CardTitle>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void refreshRecommendations()}
                disabled={v2RecommendMutation.isPending || v1RecommendMutation.isPending}
              >
                {v2RecommendMutation.isPending || v1RecommendMutation.isPending ? 'Loading...' : 'Refresh'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.length === 0 ? (
                <EmptyState
                  title="No recommendations yet"
                  body="Pull recommendations to surface optimization opportunities from the backend."
                />
              ) : (
                recommendations.map((rec) => (
                  <div key={`${rec.product_id}-${rec.product_name}`} className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm">{rec.product_name}</strong>
                      <Badge variant="info">{rec.score.toFixed(2)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{rec.reason}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageFrame>
  );
}
