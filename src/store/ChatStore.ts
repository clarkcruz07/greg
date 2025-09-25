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

  async sendMessage(message: string) {
    this.addMessage(message, false);
    
    try {
      if (!message || !message.trim()) {
        throw new Error('Please enter a message');
      }

      // Create a placeholder message for streaming
      const messageId = Date.now().toString();
      this.addMessage('', true, messageId);
      
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
          metadata: {
            name: 'Clark',
            email: 'cruzc@borgs.com.au'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error from server:', errorData);
        throw new Error(errorData.error || 'Failed to get response from server');
      }
      
      const data = await response.json();
      if (data.error) {
        console.error('Error in response:', data.error);
        throw new Error(data.error);
      }
      
      this.updateLastBotMessage(data.response || '');
      this.conversationId = data.conversationId;
    } catch (error) {
      console.error('Error sending message:', error);
      this.addMessage('Sorry, there was an error processing your message.', true);
    }
  }
}

export const chatStore = new ChatStore();