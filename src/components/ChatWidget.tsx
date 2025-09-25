import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { chatStore } from '../store/ChatStore';

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
  font-size: 0.9rem;
  font-family: 'Sora-Light';

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const PromptLabel = styled.p`
  margin-top: 1rem;
  font-size: 0.8rem;
  font-family: 'Sora-Light';
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
  padding: 1rem 1.2rem;
  border-radius: 10px;
  font-size: 0.9rem;
  line-height: 1.6;
  align-self: ${props => props.$isBot ? 'flex-start' : 'flex-end'};
  color: ${props => props.$isBot ? '#333' : '#c22445'};
  justify-content: ${props => props.$isBot ? 'flex-start' : 'flex-end'};
  background-color: ${props => props.$isBot ? '#fff' : '#F9FAF2'};
  width: ${props => props.$isBot ? '' : '50%'};
  text-align: left;

  p {
    margin: 0.8rem 0;
    &:first-child {
      margin-top: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }

  h2 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 1.5rem 0 1rem 0;
    color: #222;
    &:first-child {
      margin-top: 0.8rem;
    }
  }

  ul, ol {
    margin: 1rem 0;
    padding-left: 1.4rem;
  }

  li {
    margin: 0.5rem 0;
    line-height: 1.5;
  }

  strong {
    color: #222;
    font-weight: 600;
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

const InputForm = styled.form`
  display: flex;
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
  width: 100%;
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

const IconButton = styled.button`
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

interface QuickPrompt {
  text: string;
  action: () => void;
}

export const ChatWidget = observer(() => {
  const [input, setInput] = useState('');

  const quickPrompts: QuickPrompt[] = [
    {
      text: "What's best for subfloors on 600mm joists?",
      action: () => chatStore.sendMessage("What's best for subfloors on 600mm joists?")
    },
    {
      text: "Is Yellow Tongue OK for wet areas?",
      action: () => chatStore.sendMessage("Is Yellow Tongue OK for wet areas?")
    },
    {
      text: "How do I install STRUCTAflor?",
      action: () => chatStore.sendMessage("How do I install STRUCTAflor?")
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      chatStore.sendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <>
      {chatStore.isOpen ? (
        <ChatContainer>
          <ChatHeader>
            <Logo src="/logo.png" alt="Porta Logo" />
            <CloseButton onClick={chatStore.toggleChat}>×</CloseButton>
          </ChatHeader>

          {chatStore.messages.length === 0 && (
            <MessagesContainer>
              <IntroSection>
                <img className="greg-icon" src="/greg.png" alt="Greg" />
                <HeaderTitle>Hi, I'm Greg — your product assistant at Porta.</HeaderTitle>
                <HeaderSubtitle>
                  Ask me anything about timber products, specs, installation, or finding the right solution for your build.
                </HeaderSubtitle>
                <PromptLabel>You Could Try These Quick Prompts</PromptLabel>
                <QuickPrompts>
                  {quickPrompts.map((prompt, index) => (
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
              {chatStore.messages.map((message, index) => (
                <Message key={index} $isBot={message.isBot}>
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                </Message>
              ))}
            </MessagesContainer>
          )}

          <InputForm onSubmit={handleSubmit}>
            <ChatInputBar>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me any question..."
              />
              <ChatInputActions>
                <RightIcons>
                  <IconButton type="button">
                    <img src="/mic.png" alt="Voice input" />
                  </IconButton>
                  <IconButton type="submit">
                    <img src="/send.png" alt="Send message" />
                  </IconButton>
                </RightIcons>
              </ChatInputActions>
            </ChatInputBar>
          </InputForm>
        </ChatContainer>
      ) : (
        <ChatButton onClick={chatStore.toggleChat}>
          <img src="/toggle.png" alt="Chat" />
        </ChatButton>
      )}
    </>
  );
});