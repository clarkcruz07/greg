import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { marked } from "marked";
import { chatStore } from '../store/ChatStore';
import { useConversation } from '@elevenlabs/react';

marked.setOptions({ async: false });

// Custom renderer for links to open in new tab
const renderer = new marked.Renderer();
const originalLink = renderer.link;
renderer.link = ({ href, text }: any) => {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
};
marked.setOptions({ renderer });

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 420px;
  height: 650px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  background-color: #fff;
  font-family: Arial, sans-serif;
  position: fixed;
  bottom: 20px;
  right: 20px;
  overflow: hidden;
  transition: 0.5s;

  @media (max-width: 768px) {
    width: calc(100% - 40px);
    height: calc(100% - 40px);
    bottom: 20px;
    right: 20px;
    border-radius: 12px;
    transition: 0.5s;
  }
`;

const ChatButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: none;
  border: none;
  cursor: pointer;

  img {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1rem;
  background-color: #fff;
`;

const Logo = styled.img`
  height: 26px;
  width: auto;
`;

const CloseButton = styled.button`
  border: none;
  background: none;
  font-size: 1.5rem;
  font-weight: bold;
  color: #666;
  cursor: pointer;
  line-height: 1;

  &:hover {
    color: #c22445;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 1.2rem;
  }
`;

const IntroSection = styled.div`
  text-align: center;
  
  .greg-icon {
    width: 60px;
    height: 60px;
    margin-bottom: 1rem;
  }
`;

const HeaderTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #111;
  font-family: 'Sora';

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const HeaderSubtitle = styled.p`
  margin-bottom: 0.5rem;
  color: #444;
  font-size: 0.8rem;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const PromptLabel = styled.p`
  margin-top: 1rem;
  font-size: 0.7rem;
  
`;

const QuickPrompts = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1rem;
`;

const PromptButton = styled.button`
  padding: 0.6rem 1rem;
  border-radius: 20px;
  border: 1px solid #c22445;
  background-color: #fff;
  color: #c22445;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  font-family: 'Sora';

  &:hover {
    background-color: #F9FAF2;
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

interface MessageProps {
  $isBot: boolean;
}

const Message = styled.div<MessageProps>`
  max-width: ${props => props.$isBot ? '100%' : '50%'};
  
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;
  align-self: ${props => props.$isBot ? 'flex-start' : 'flex-end'};
  color: ${props => props.$isBot ? '#333' : '#c22445'};
  justify-content: ${props => props.$isBot ? 'flex-start' : 'flex-end'};
  background-color: ${props => props.$isBot ? '#fff' : '#F9FAF2'};
  width: ${props => props.$isBot ? '' : '50%'};
  text-align: left;
  position: relative;
  
  div:first-child {
  padding: 0.8rem;
  }
  p {
    margin: 0.6rem 0;
    &:first-child {
      margin-top: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }

  h1 {
  font-size: 1em; /* ~14px */
  font-weight: 400;
  margin: 0.8em 0 0.4em;
}

h2 {
  font-size: 1em;
  font-weight: 400;
  margin: 0.7em 0 0.4em;
}

h3 {
  font-size: 1em;
  font-weight: 400;
  margin: 0.6em 0 0.3em;
}

h4, h5, h6 {
  font-size: 1em;
  font-weight: 400;
  margin: 0.5em 0 0.3em;
}
ol li::before,
ul li::before {
  font-weight: 400;
  
}


  ul, ol {
  margin: 1.5rem 0 0.8rem 0;
  padding-left: 0.75rem;
  a {
    color: #000;
  }
}

ol {
  counter-reset: item;
}

  li {
    margin: 0.8rem 0;
    line-height: 1.6;
    color: #444;
    display: block;
    padding-left: 1.8rem;
    position: relative;
  }


  ol li::before {
    content: counter(item) ". ";
    counter-increment: item;
    position: absolute;
    left: 0;
  }

  ul {
  list-style: disc;
  }
  ul li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #000;
  }

  strong {
    color: #222;
    font-weight: 500;
  }

  blockquote {
    margin: 1rem 0;
    padding: 0.8rem 1rem;
    border-left: 3px solid #ddd;
    background-color: #f9f9f9;
    color: #555;
    
    p {
      margin: 0;
    }
    
    ul, ol {
      margin: 0.5rem 0;
    }
  }

  ${props => !props.$isBot && `
    img {
      width: 100%;
      height: 200px;
    }
  `}
`;

const FeedbackContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.8rem;
`;

const FeedbackButton = styled.button<{ isActive?: boolean }>`
  background: none;
  border: 1px solid #ddd;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
  color: #666;

  &:hover {
    background-color: #f5f5f5;
    border-color: #c22445;
  }

  ${props => props.isActive && `
    background-color: #c22445;
    color: #fff;
    border-color: #c22445;
  `}
`;

const DisclaimerNotice = styled.div`
  margin: 0 auto;
  text-align: left;
  font-size: 0.65rem;
  color: #666;
  line-height: 1.4;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0 10px;
  p {
    margin: 0;
    padding: 5px 0px;
  }

  a {
    color: #c22445;
    text-decoration: underline;
  }
`;

const DisclaimerCloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  font-size: 1.2rem;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;

  &:hover {
    color: #c22445;
  }
`;

const InputForm = styled.form`
  display: flex;
  flex-direction: column;
  padding: 0.6rem;
  border-top: 1px solid #eee;
  background-color: #fff;
  
`;

const ChatInputBar = styled.div`
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 0.4rem 0.6rem;
  background: #fff;
  margin: 0.6rem;
  
`;

const Input = styled.input`
  flex: 1 1;
  border: none;
  outline: none;
  font-size: 0.9rem;
  padding: 0.4rem 0;
  width: 100%;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const ChatInputActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 0.4rem;
`;

const Footer = styled.div`
  padding: 0.6rem;
  border-top: 1px solid #eee;
  background-color: #f9f9f9;
  font-size: 0.75rem;
  color: #666;
  line-height: 1.4;

  p {
    margin: 0.3rem 0;
  }

  a {
    color: #c22445;
    text-decoration: underline;
  }
`;

const IconButton = styled.button<{ $variant?: 'destructive' }>`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 20px;
    height: 20px;
  }
`;

const RightIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  color: #666;
  font-style: italic;
  font-size: 0.85rem;

  &::after {
    content: '';
    display: inline-block;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background-color: #666;
    animation: blink 1.4s infinite;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
`;

interface QuickPrompt {
  text: string;
  action: () => void;
}

interface InitialMessage {
  text: string;
  action: () => void;
}

export const ChatWidget = observer(() => {
  const [input, setInput] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  //voice call
  const [hasPermission, setHasPermission] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const conversation = useConversation();
const {status, isSpeaking} = conversation;
const startConversation = async () => {
const conversationID = await conversation.startSession({
  agentId: 'agent_5701keer085aegja27hf56tbfmqk',
  connectionType: 'websocket',
});
console.log('Conversation has started with ID:', conversationID);
}

const endConversation = async () => {
  await conversation.endSession();
  console.log('Conversation has ended');
}

const muteConversation = async () => {

}

useEffect(() => {
  const askMicPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
    } catch (error) {
      console.error('Error asking for mic permission:', error);
      setErrorMessage((error as Error).message);
    }
  };
  askMicPermission();
},[])
  // Create dynamic quick prompts from config
  const getQuickPrompts = (): QuickPrompt[] => {
    if (!chatStore.config?.suggestedMessages) {
      return [];
    }
    return chatStore.config.suggestedMessages.map((text) => ({
      text,
      action: () => chatStore.sendMessage(text)
    }));
  };
    const getInitialMessage = (): QuickPrompt[] => {
    if (!chatStore.config?.initialMessages) {
      return [];
    }
    return chatStore.config.initialMessages.map((text) => ({
      text,
      action: () => chatStore.sendMessage(text)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      chatStore.sendMessage(input.trim());
      setInput('');
    }
  };

const normalizeMarkdown = (text: string) => {
  return text
    // Headings must start on a new line
    .replace(/(#+)([^\n])/g, '\n$1 $2')

    // Numbered lists
    .replace(/(\n|^)(\d+\.)\s+/g, '\n$2 ')

    // Bullet lists
    .replace(/(\n|^)-\s+/g, '\n- ')

    // Preserve paragraphs WITHOUT breaking sentences
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

  return (
    <>
      {chatStore.isOpen ? (
        <ChatContainer>
          <ChatHeader>
            <Logo src="/logo.png" alt="Porta Logo" />
            <CloseButton onClick={chatStore.toggleChat}>×</CloseButton>
          </ChatHeader>

          {chatStore.messages.length === 0 && chatStore.configLoaded && (
            <MessagesContainer>
              <IntroSection>
                <img className="greg-icon" src="/greg.png" alt={chatStore.config?.displayName || "Greg"} />
                {getInitialMessage().length > 0 && (
                  <>
                    <HeaderTitle>{getInitialMessage()[0].text}</HeaderTitle>
                    <HeaderSubtitle>{getInitialMessage()[1].text}</HeaderSubtitle>
                  </>
                )}
              
                <PromptLabel>You Could Try These Quick Prompts</PromptLabel>
                <QuickPrompts>
                  {getQuickPrompts().map((prompt, index) => (
                    <PromptButton key={index} onClick={prompt.action}>
                      {prompt.text}
                    </PromptButton>
                  ))}
                </QuickPrompts>
              </IntroSection>
            </MessagesContainer>
          )}

          {chatStore.messages.length > 0 && (
            <MessagesContainer>
              {chatStore.messages.map((message, index) => {
                const isLastBotMessage = message.isBot && index === chatStore.messages.length - 1;
                const showFeedback = isLastBotMessage && message.text && !chatStore.isTyping && !message.isFeedbackResponse;
                
                return (
                  <div key={index}>
                    <Message $isBot={message.isBot}>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(normalizeMarkdown(message.text || "")) as string
                          //__html: normalizeMarkdown(message.text || "") as string
                        }}
                      />
                      {showFeedback && (
                        <FeedbackContainer>
                          <FeedbackButton 
                            isActive={message.feedback === 'like'}
                            onClick={() => chatStore.handleLike(message.id || '')}
                          >
                            👍 Like
                          </FeedbackButton>
                          <FeedbackButton 
                            isActive={message.feedback === 'dislike'}
                            onClick={() => chatStore.handleDislike(message.id || '')}
                          >
                            👎 Dislike
                          </FeedbackButton>
                        </FeedbackContainer>
                      )}
                    </Message>
                  </div>
                );
              })}
              {chatStore.isTyping && (
                <Message $isBot={true}>
                  <TypingIndicator>Greg is typing</TypingIndicator>
                </Message>
              )}
            </MessagesContainer>
          )}

          <InputForm onSubmit={handleSubmit}>
            {chatStore.config?.dismissableNotice && showDisclaimer && (
              <DisclaimerNotice>
                <div
                  dangerouslySetInnerHTML={{
                    __html: chatStore.config.dismissableNotice
                  }}
                />
                <DisclaimerCloseButton onClick={() => setShowDisclaimer(false)}>
                  ×
                </DisclaimerCloseButton>
              </DisclaimerNotice>
            )}
            <ChatInputBar>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={chatStore.config?.messagePlaceholder || "Ask me any question..."}
              />
              <ChatInputActions>
                <RightIcons>
                  { status === "connected" ? (
                     <IconButton type="button" onClick={endConversation}>
                     On Call
                   </IconButton>
                  ) : (
                    <IconButton type="button" onClick={startConversation}>
                    <img src="/mic.png" alt="Voice input" />
                  </IconButton>
                  ) }
                 
                 
                  
                  <IconButton type="submit">
                    <img src="/send.png" alt="Send message" />
                  </IconButton>
                </RightIcons>
              </ChatInputActions>
            </ChatInputBar>
          </InputForm>

          {chatStore.config?.footer && (
            <Footer
              dangerouslySetInnerHTML={{
                __html: chatStore.config.footer
              }}
            />
          )}
        </ChatContainer>
      ) : (
        <ChatButton onClick={chatStore.toggleChat}>
          <img src="/toggle.png" alt="Chat" />
        </ChatButton>
      )}
    </>
  );
});