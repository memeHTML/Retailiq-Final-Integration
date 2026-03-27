import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { normalizeApiError } from '@/utils/errors';
import { useNlpQueryMutation, useAiAssistantMutation, useAiRecommendMutation } from '@/hooks/nlp';
import { useAiReceiptDigitizeMutation, useAiShelfScanMutation, useAiV2QueryMutation, useAiV2RecommendMutation } from '@/hooks/aiTools';
import type { NlpResponse } from '@/types/models';
import type { AiRecommendation } from '@/types/models';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  nlpData?: NlpResponse;
}

export default function AiAssistantPage() {
  const [queryText, setQueryText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [v2Response, setV2Response] = useState<string>('');
  const [v2Recommendations, setV2Recommendations] = useState<AiRecommendation[]>([]);
  const [shelfScanImageUrl, setShelfScanImageUrl] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [visionMessage, setVisionMessage] = useState('');

  const nlpMutation = useNlpQueryMutation();
  const aiMutation = useAiAssistantMutation();
  const recMutation = useAiRecommendMutation();
  const shelfScanMutation = useAiShelfScanMutation();
  const receiptDigitizeMutation = useAiReceiptDigitizeMutation();
  const v2QueryMutation = useAiV2QueryMutation();
  const v2RecMutation = useAiV2RecommendMutation();

  const quickQueries = [
    { label: 'Revenue', query: "What's my revenue today?" },
    { label: 'Inventory', query: 'Show me inventory status' },
    { label: 'Forecast', query: 'Give me the demand forecast' },
    { label: 'Top Products', query: 'What are my top selling products?' },
    { label: 'Profit', query: "What's my profit margin?" },
    { label: 'Loyalty', query: 'Show loyalty program summary' },
  ];

  const handleSend = () => {
    if (!queryText.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: queryText };
    setMessages((prev) => [...prev, userMsg]);
    const q = queryText;
    setQueryText('');

    nlpMutation.mutate({ query_text: q }, {
      onSuccess: (data) => {
        const nlpData = data as NlpResponse;
        setMessages((prev) => [...prev, {
          role: 'assistant',
          text: nlpData.detail || nlpData.headline || 'No response.',
          nlpData,
        }]);
      },
      onError: () => {
        aiMutation.mutate({ query: q }, {
          onSuccess: (data) => {
            setMessages((prev) => [...prev, { role: 'assistant', text: data.response }]);
          },
          onError: (err) => {
            setMessages((prev) => [...prev, { role: 'assistant', text: `Error: ${normalizeApiError(err).message}` }]);
          },
        });
      },
    });
  };

  const handleGetRecommendations = () => {
    recMutation.mutate({}, {
      onSuccess: (data) => setRecommendations(data.recommendations ?? []),
    });
  };

  const handleSendV2 = () => {
    if (!queryText.trim()) return;
    const q = queryText.trim();
    v2QueryMutation.mutate({ query: q }, {
      onSuccess: (data) => {
        setV2Response(data.response || 'No response.');
      },
    });
  };

  const handleGetV2Recommendations = () => {
    v2RecMutation.mutate({}, {
      onSuccess: (data) => setV2Recommendations(data.recommendations ?? []),
    });
  };

  const handleShelfScan = () => {
    const imageUrl = shelfScanImageUrl.trim();
    if (!imageUrl) {
      setVisionMessage('Shelf-scan image URL is required.');
      return;
    }

    setVisionMessage('');
    shelfScanMutation.mutate({ image_url: imageUrl }, {
      onSuccess: () => {
        setVisionMessage('Shelf-scan request submitted to the backend.');
      },
      onError: (error) => {
        setVisionMessage(normalizeApiError(error).message);
      },
    });
  };

  const handleReceiptDigitize = () => {
    const imageUrl = receiptImageUrl.trim();
    if (!imageUrl) {
      setVisionMessage('Receipt image URL is required.');
      return;
    }

    setVisionMessage('');
    receiptDigitizeMutation.mutate({ image_url: imageUrl }, {
      onSuccess: () => {
        setVisionMessage('Receipt digitization request submitted to the backend.');
      },
      onError: (error) => {
        setVisionMessage(normalizeApiError(error).message);
      },
    });
  };

  return (
    <PageFrame title="AI Assistant" subtitle="Ask questions about your store in natural language.">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Chat area */}
        <div>
          {/* Quick queries */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {quickQueries.map((q) => (
              <Button key={q.label} variant="secondary" onClick={() => { setQueryText(q.query); }}>
                {q.label}
              </Button>
            ))}
          </div>

          {/* Message history */}
          <Card className="mb-4">
            <CardContent>
              <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 200 }}>
                {messages.length === 0 && <p className="muted">Ask a question to get started...</p>}
                {messages.map((msg, i) => (
                  <div key={i} style={{ textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      maxWidth: '80%',
                      background: msg.role === 'user' ? '#3b82f6' : '#f3f4f6',
                      color: msg.role === 'user' ? 'white' : 'inherit',
                    }}>
                      <p style={{ margin: 0 }}>{msg.text}</p>
                      {msg.nlpData && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                          <Badge variant="info">{msg.nlpData.intent}</Badge>
                          {msg.nlpData.action && <p style={{ margin: '0.25rem 0 0' }} className="muted">{msg.nlpData.action}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Input */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Input
              placeholder="Ask about revenue, inventory, forecast, loyalty..."
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            />
            <Button onClick={handleSend} disabled={nlpMutation.isPending || aiMutation.isPending}>
              {nlpMutation.isPending || aiMutation.isPending ? '...' : 'Send'}
            </Button>
            <Button variant="secondary" onClick={handleSendV2} disabled={v2QueryMutation.isPending}>
              {v2QueryMutation.isPending ? '...' : 'Send v2'}
            </Button>
          </div>
        </div>

        {/* Recommendations panel */}
        <div>
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardTitle>AI Recommendations</CardTitle>
                <Button variant="secondary" onClick={handleGetRecommendations} disabled={recMutation.isPending}>
                  {recMutation.isPending ? '...' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <p className="muted">Click Refresh to get AI-powered product recommendations.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recommendations.map((rec, i) => (
                    <div key={i} style={{ padding: '0.5rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                      <strong>{rec.product_name}</strong>
                      <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>{rec.reason}</p>
                      <Badge variant="info" className="mt-1">Score: {rec.score.toFixed(2)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardTitle>AI v2 Explorer</CardTitle>
                <Button variant="secondary" onClick={handleGetV2Recommendations} disabled={v2RecMutation.isPending}>
                  {v2RecMutation.isPending ? '...' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="muted">This panel exercises the backend v2 AI routes directly so the contract stays visible in production.</p>
              <div className="mt-3 rounded-md border border-gray-200 p-3">
                <div className="text-sm font-medium">Latest v2 response</div>
                <div className="mt-2 text-sm">{v2Response || 'No v2 query yet.'}</div>
              </div>
              <div className="mt-4">
                {v2Recommendations.length === 0 ? (
                  <p className="muted">No v2 recommendations loaded yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {v2Recommendations.map((rec, i) => (
                      <div key={i} style={{ padding: '0.5rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                        <strong>{rec.product_name}</strong>
                        <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>{rec.reason}</p>
                        <Badge variant="info" className="mt-1">Score: {rec.score.toFixed(2)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>AI Vision Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="muted">These v2 tools stay separate from the v1 OCR workflow and use image URLs as the backend expects.</p>
              <div className="mt-4 grid gap-4">
                <div className="grid gap-2">
                  <div className="text-sm font-medium">Shelf scan image URL</div>
                  <Input value={shelfScanImageUrl} onChange={(e) => setShelfScanImageUrl(e.target.value)} placeholder="https://..." />
                  <Button variant="secondary" onClick={handleShelfScan} disabled={shelfScanMutation.isPending}>
                    {shelfScanMutation.isPending ? '...' : 'Run shelf scan'}
                  </Button>
                </div>
                <div className="grid gap-2">
                  <div className="text-sm font-medium">Receipt image URL</div>
                  <Input value={receiptImageUrl} onChange={(e) => setReceiptImageUrl(e.target.value)} placeholder="https://..." />
                  <Button variant="secondary" onClick={handleReceiptDigitize} disabled={receiptDigitizeMutation.isPending}>
                    {receiptDigitizeMutation.isPending ? '...' : 'Digitize receipt'}
                  </Button>
                </div>
              </div>
              {visionMessage ? <div className="mt-3 text-sm text-gray-600">{visionMessage}</div> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageFrame>
  );
}
