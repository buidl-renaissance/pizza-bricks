import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled from 'styled-components';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SiteEditorProps {
  siteId: string;
  siteUrl: string | null;
  prospectName: string;
}

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 0;
  height: calc(100vh - 80px);
  min-height: 400px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 350px;
  }
`;

const PreviewPanel = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.backgroundAlt};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  overflow: hidden;
`;

const PreviewHeader = styled.div`
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const PreviewFrame = styled.iframe`
  flex: 1;
  width: 100%;
  min-height: 300px;
  border: none;
  background: white;
`;

const ChatPanel = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.surface};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  margin-left: 1rem;

  @media (max-width: 900px) {
    margin-left: 0;
    margin-top: 1rem;
  }
`;

const ChatHeader = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageBubble = styled.div<{ $role: 'user' | 'assistant' }>`
  max-width: 90%;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  line-height: 1.5;
  align-self: ${({ $role }) => ($role === 'user' ? 'flex-end' : 'flex-start')};
  background: ${({ theme, $role }) =>
    $role === 'user' ? theme.accent : theme.backgroundAlt};
  color: ${({ theme, $role }) =>
    $role === 'user' ? theme.background : theme.text};
  border: 1px solid ${({ theme, $role }) =>
    $role === 'user' ? 'transparent' : theme.border};
`;

const InputRow = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid ${({ theme }) => theme.border};
`;

const Input = styled.textarea`
  flex: 1;
  min-height: 44px;
  max-height: 120px;
  padding: 0.65rem 1rem;
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.text};
  font-size: 0.9rem;
  resize: none;
  transition: border-color 0.15s ease;

  &::placeholder {
    color: ${({ theme }) => theme.textMuted};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent};
  }
`;

const SendButton = styled.button<{ $loading?: boolean }>`
  padding: 0.65rem 1.25rem;
  background: ${({ theme, $loading }) =>
    $loading ? theme.accentMuted : theme.accent};
  color: ${({ theme }) => theme.background};
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: ${({ $loading }) => ($loading ? 'not-allowed' : 'pointer')};
  transition: background 0.15s ease;
  align-self: flex-end;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.accentHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.textMuted};
  padding: 1rem;
  text-align: center;
  margin: 0;
`;

const OpenInNewLink = styled.a`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.accent};
  margin-left: 0.5rem;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export function SiteEditor({ siteId, siteUrl, prospectName }: SiteEditorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(siteUrl);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPreviewUrl(siteUrl);
  }, [siteUrl]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/ops/sites/${siteId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        url?: string;
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      const reply = data.message
        ? `Site updated. ${data.message}`
        : 'Site updated successfully. The preview will refresh shortly.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);

      if (data.url) {
        setPreviewUrl(data.url);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Update failed';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${errorMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, siteId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Layout>
      <PreviewPanel>
        <PreviewHeader>
          Preview
          {previewUrl && (
            <OpenInNewLink href={previewUrl} target="_blank" rel="noopener noreferrer">
              Open in new tab ↗
            </OpenInNewLink>
          )}
        </PreviewHeader>
        {previewUrl ? (
          <PreviewFrame
            ref={iframeRef}
            src={previewUrl}
            title={`Preview: ${prospectName}`}
          />
        ) : (
          <EmptyState>
            No preview URL yet. Deploy the site first.
          </EmptyState>
        )}
      </PreviewPanel>

      <ChatPanel>
        <ChatHeader>Edit with prompts</ChatHeader>
        <MessageList>
          {messages.length === 0 && (
            <EmptyState>
              Describe changes you want (e.g. &quot;Change the hero headline to Welcome to our kitchen&quot;). Updates deploy to Vercel.
            </EmptyState>
          )}
          {messages.map((m, i) => (
            <MessageBubble key={i} $role={m.role}>
              {m.content}
            </MessageBubble>
          ))}
          <div ref={messagesEndRef} />
        </MessageList>
        <InputRow>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the changes you want..."
            disabled={loading}
            rows={2}
          />
          <SendButton
            type="button"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            $loading={loading}
          >
            {loading ? 'Updating…' : 'Send'}
          </SendButton>
        </InputRow>
      </ChatPanel>
    </Layout>
  );
}
