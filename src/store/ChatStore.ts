import { makeAutoObservable } from 'mobx';
import { v4 as uuidv4 } from "uuid";
const URL = 'https://chatbot-vsqs.onrender.com';
//const URL = 'http://localhost:8080';
interface Message {
  text: string;
  isBot: boolean;
  id?: string;
  feedback?: 'like' | 'dislike' | null;
  isFeedbackResponse?: boolean;
}

interface BotConfig {
  displayName: string;
  initialMessages: string[];
  suggestedMessages: string[];
  messagePlaceholder: string;
  dismissableNotice: string;
  footer: string;
  model: string;
}

class ChatStore {
  messages: Message[] = [];
  isOpen = false;
  conversationId: string | null = null;
  isTyping = false;
  chunkTimeout: NodeJS.Timeout | null = null;
  config: BotConfig | null = null;
  configLoaded = false;

  constructor() {
    makeAutoObservable(this);
    this.loadConfig();
  }
  async loadConfig() {
    try {
      const response = await fetch(`${URL}/api/config`);
      if (response.ok) {
        this.config = await response.json();
      }
    } catch (err) {
      console.error("Failed to load config:", err);
    }
    this.configLoaded = true;
  }

  toggleChat = () => {
    this.isOpen = !this.isOpen;
  };

  addMessage = (text: string, isBot: boolean, id?: string, isFeedbackResponse?: boolean) => {
    this.messages.push({ text, isBot, id, isFeedbackResponse });
  };

  updateLastBotMessage = (text: string) => {
    const last = [...this.messages].reverse().find(m => m.isBot);
    if (last) last.text = text;
  };

  setIsTyping = (v: boolean) => {
    this.isTyping = v;
  };

  setMessageFeedback = (messageId: string, feedback: 'like' | 'dislike' | null) => {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.feedback = feedback;
    }
  };

  async sendFeedback(messageId: string, feedback: 'like' | 'dislike') {
    try {
      await fetch(`${URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: this.conversationId,
          messageId,
          feedback,
        }),
      });
    } catch (err) {
      console.error("Failed to send feedback:", err);
    }
  }

  async handleLike(messageId: string) {
    this.setMessageFeedback(messageId, 'like');
    await this.sendFeedback(messageId, 'like');
    
    // Fetch a fresh response from Chatbase for the like feedback
    this.setIsTyping(true);
    const feedbackMessageId = uuidv4();
    this.addMessage("", true, feedbackMessageId, true); // Mark as feedback response

    try {
      const response = await fetch(`${URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "[USER FEEDBACK: Like] - The user found the response helpful.",
          conversationId: this.conversationId,
          isFeedback: true,
        }),
      });

      if (!response.ok) {
        this.updateLastBotMessage("Thank you for your feedback!");
        this.setIsTyping(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let displayedText = "";

      const animateText = (text: string) => {
        const words = text.split(" ");
        let index = displayedText.split(" ").length;

        const tick = () => {
          if (index < words.length) {
            displayedText = words.slice(0, index + 1).join(" ");
            this.updateLastBotMessage(displayedText);
            index++;
            setTimeout(tick, 30 + Math.random() * 20);
          }
        };

        tick();
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const evt of events) {
          const lines = evt.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;

            const payload = line.replace("data:", "").trim();
            if (!payload) continue;

            let data;

            try {
              data = JSON.parse(payload);
            } catch {
              continue;
            }

            switch (data.type) {
              case "chunk":
                accumulated += data.content;

                if (this.chunkTimeout) clearTimeout(this.chunkTimeout);
                this.chunkTimeout = setTimeout(() => {
                  animateText(accumulated);
                }, 20);
                break;

              case "end":
                this.updateLastBotMessage(accumulated);
                break;

              case "error":
                this.updateLastBotMessage("Thank you for your feedback!");
                break;
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      this.updateLastBotMessage("Thank you for your feedback!");
    }

    this.setIsTyping(false);
  }

  async handleDislike(messageId: string) {
    this.setMessageFeedback(messageId, 'dislike');
    await this.sendFeedback(messageId, 'dislike');
    // Trigger regeneration after dislike
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      // Find the previous user message
      const messageIndex = this.messages.indexOf(message);
      if (messageIndex > 0) {
        const previousMessage = this.messages[messageIndex - 1];
        if (!previousMessage.isBot) {
          // Resend the previous user message
          this.messages.splice(messageIndex, 1); // Remove the disliked message
          this.setIsTyping(true);
          await this.fetchNewResponse(previousMessage.text);
        }
      }
    }
  }

  private async fetchNewResponse(userMessage: string) {
    try {
      const messageId = uuidv4();
      this.addMessage("", true, messageId);

      const response = await fetch(`${URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId: this.conversationId,
          regenerate: true,
        }),
      });

      if (!response.ok) {
        this.updateLastBotMessage("Server error.");
        this.setIsTyping(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let displayedText = "";
      let started = false;

      const animateText = (text: string) => {
        const words = text.split(" ");
        let index = displayedText.split(" ").length;

        const tick = () => {
          if (index < words.length) {
            displayedText = words.slice(0, index + 1).join(" ");
            this.updateLastBotMessage(displayedText);
            index++;
            setTimeout(tick, 30 + Math.random() * 20);
          }
        };

        tick();
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const evt of events) {
          const lines = evt.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;

            const payload = line.replace("data:", "").trim();
            if (!payload) continue;

            let data;

            try {
              data = JSON.parse(payload);
            } catch {
              continue;
            }

            switch (data.type) {
              case "chunk":
                accumulated += data.content;

                if (this.chunkTimeout) clearTimeout(this.chunkTimeout);
                this.chunkTimeout = setTimeout(() => {
                  animateText(accumulated);
                }, 20);
                break;

              case "end":
                this.updateLastBotMessage(accumulated);
                break;

              case "error":
                this.updateLastBotMessage("Sorry, an error occurred.");
                break;
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      this.updateLastBotMessage("Network error.");
    }

    this.setIsTyping(false);
  }

  async sendMessage(message: string) {
    this.addMessage(message, false);

    if (!message.trim()) return;

  if (!this.conversationId) {
    this.conversationId = uuidv4();
  }

  // Placeholder bot message
  const messageId = uuidv4();
  this.addMessage("", true, messageId);
    this.setIsTyping(true);

    try {
      const response = await fetch(`${URL}/api/chat`, {
      // const response = await fetch("YOUR_DEPLOYED_URL/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationId: this.conversationId
        }),
      });

      if (!response.ok) {
        this.updateLastBotMessage("Server error.");
        this.setIsTyping(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let displayedText = "";
      let started = false;

      const animateText = (text: string) => {
        const words = text.split(" ");
        let index = displayedText.split(" ").length;

        const tick = () => {
          if (index < words.length) {
            displayedText = words.slice(0, index + 1).join(" ");
            this.updateLastBotMessage(displayedText);
            index++;
            setTimeout(tick, 30 + Math.random() * 20);
          }
        };

        tick();
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const evt of events) {
          const lines = evt.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;

            const payload = line.replace("data:", "").trim();
            if (!payload) continue;

            let data;

            // Safely parse JSON
            try {
              data = JSON.parse(payload);
            } catch {
              continue;
            }

            switch (data.type) {
              case "start":
                this.conversationId = data.conversationId;
                started = true;
                break;

              case "chunk":
                if (!started) continue;

                // content is already safe string from backend
                accumulated += data.content;

                if (this.chunkTimeout) clearTimeout(this.chunkTimeout);
                this.chunkTimeout = setTimeout(() => {
                  animateText(accumulated);
                }, 20);
                break;

              case "end":
                this.updateLastBotMessage(accumulated);
                break;

              case "error":
                this.updateLastBotMessage("Sorry, an error occurred.");
                break;
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      this.updateLastBotMessage("Network error.");
    }

    this.setIsTyping(false);
  }
}

export const chatStore = new ChatStore();
