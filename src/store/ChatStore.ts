import { makeAutoObservable } from 'mobx';

interface Message {
  text: string;
  isBot: boolean;
  id?: string;
}

class ChatStore {
  messages: Message[] = [];
  isOpen: boolean = false;
  conversationId: string | null = null;
  isTyping: boolean = false;
  chunkTimeout: NodeJS.Timeout | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  toggleChat = () => {
    this.isOpen = !this.isOpen;
  }

  addMessage = (text: string, isBot: boolean, id?: string) => {
    this.messages.push({ text, isBot, id });
  }

  updateLastBotMessage = (text: string) => {
    const lastBotMessage = [...this.messages].reverse().find(m => m.isBot);
    if (lastBotMessage) {
      lastBotMessage.text = text;
    }
  }



  setIsTyping = (isTyping: boolean) => {
    // This can be used to show typing indicators
    this.isTyping = isTyping;
  }

  async sendMessage(message: string) {
    this.addMessage(message, false);
    
    try {
      if (!message || !message.trim()) {
        throw new Error('Please enter a message');
      }

      // Create a placeholder message for streaming
      const messageId = Date.now().toString();
      this.addMessage('', true, messageId); // Start with empty message
      this.setIsTyping(true);
      
      console.log('Sending request:', {
        message,
        conversationId: this.conversationId,
      });
      
      //const response = await fetch('http://localhost:8080/api/chat', {
      const response = await fetch('https://chatbot-vsqs.onrender.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          conversationId: this.conversationId,
          metadata: {
            name: 'Clark',
            email: 'cruzc@borgs.com.au'
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';
      let buffer = '';
      let hasStarted = false;
      let displayedText = '';

      const animateText = (newText: string) => {
        const words = newText.split(' ');
        const displayedWords = displayedText.split(' ');
        
        // Only animate new words
        if (words.length > displayedWords.length) {
          let wordIndex = displayedWords.length;
          
          const showNextWord = () => {
            if (wordIndex < words.length) {
              displayedText = words.slice(0, wordIndex + 1).join(' ');
              this.updateLastBotMessage(displayedText);
              wordIndex++;
              
              // Shorter delay for faster typing rhythm
              setTimeout(showNextWord, 30 + Math.random() * 20); // 30-50ms delay
            }
          };
          
          showNextWord();
        } else {
          // If no new words, just update immediately
          displayedText = newText;
          this.updateLastBotMessage(displayedText);
        }
      };

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            
            // Keep the last potentially incomplete line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonData = line.slice(6).trim();
                  if (jsonData) {
                    const data = JSON.parse(jsonData);
                    console.log('Received SSE event:', data);
                    
                    switch (data.type) {
                      case 'start':
                        this.conversationId = data.conversationId;
                        hasStarted = true; // Start immediately
                        accumulatedResponse = '';
                        console.log('Started streaming');
                        break;
                        
                      case 'chunk':
                        if (hasStarted) {
                          accumulatedResponse += data.content;
                          
                          // Batch chunks for smoother animation with reduced delay
                          if (this.chunkTimeout) clearTimeout(this.chunkTimeout);
                          this.chunkTimeout = setTimeout(() => {
                            animateText(accumulatedResponse);
                          }, 20); // Reduced delay for smoother batching
                        }
                        break;
                        
                      case 'sources':
                        console.log('Received sources:', data.sources);
                        break;
                        
                      case 'end':
                        console.log('Streaming complete');
                        // Ensure final text is displayed
                        if (accumulatedResponse) {
                          displayedText = accumulatedResponse;
                          this.updateLastBotMessage(accumulatedResponse);
                        }
                        break;
                        
                      case 'error':
                        throw new Error(data.error);
                    }
                  }
                } catch (parseError) {
                  console.error('Error parsing SSE data:', parseError, 'Line:', line);
                }
              }
            }
          }
        } finally {
          this.setIsTyping(false);
          if (this.chunkTimeout) clearTimeout(this.chunkTimeout);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.setIsTyping(false);
      this.updateLastBotMessage('Sorry, there was an error processing your message.');
    }
  }
}

export const chatStore = new ChatStore();
