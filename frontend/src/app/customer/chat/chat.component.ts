import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-page">
      <header class="chat-header">
        <button class="back-btn" (click)="goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="chat-info">
          <h2 class="chat-name">{{ chatPartner() }}</h2>
          <p class="chat-sub">Booking #{{ bookingId }}</p>
        </div>
      </header>

      <div class="messages-container" #messagesContainer>
        @if (loadingMessages()) {
          <div class="loading-msg">Loading messages...</div>
        }
        @for (msg of messages(); track msg.id || $index) {
          <div class="message" [class.mine]="msg.sender_id === currentUserId" [class.theirs]="msg.sender_id !== currentUserId">
            <div class="message-bubble">
              <p class="message-text">{{ msg.content }}</p>
              <span class="message-time">{{ msg.created_at | date:'shortTime' }}</span>
            </div>
          </div>
        }
        @if (!loadingMessages() && messages().length === 0) {
          <div class="empty-chat">
            <p>No messages yet</p>
            <span>Send a message to start the conversation</span>
          </div>
        }
      </div>

      <div class="chat-input-bar">
        <input
          type="text"
          [(ngModel)]="newMessage"
          (keydown.enter)="sendMessage()"
          placeholder="Type a message..."
          class="chat-input"
        />
        <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }
    .chat-page {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      background: #000;
    }
    .chat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #0a0a0a;
      border-bottom: 1px solid #222;
      flex-shrink: 0;
    }
    .back-btn {
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      padding: 4px;
    }
    .chat-info { flex: 1; }
    .chat-name {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      margin: 0;
    }
    .chat-sub {
      font-size: 12px;
      color: #666;
      margin: 0;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      padding-bottom: calc(90px + env(safe-area-inset-bottom));
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .message {
      display: flex;
      max-width: 72%;
    }
    .message.mine {
      align-self: flex-end;
    }
    .message.theirs {
      align-self: flex-start;
    }
    .message-bubble {
      padding: 10px 14px;
      border-radius: 12px;
      max-width: 100%;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
    }
    .mine .message-bubble {
      background: linear-gradient(135deg, #00bfa6, #00796b);
      color: #000;
      border-bottom-right-radius: 4px;
    }
    .theirs .message-bubble {
      background: #1a1a1a;
      border: 1px solid #333;
      color: #ccc;
      border-bottom-left-radius: 4px;
    }
    .message-text {
      margin: 0;
      font-size: 14px;
      line-height: 1.4;
      word-break: break-word;
    }
    .message-time {
      font-size: 10px;
      opacity: 0.7;
      display: block;
      text-align: right;
      margin-top: 4px;
    }

    .empty-chat {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #555;
      text-align: center;
    }
    .empty-chat p {
      margin: 0 0 4px;
      font-size: 15px;
      font-weight: 600;
    }
    .empty-chat span { font-size: 13px; }
    .loading-msg {
      text-align: center;
      color: #555;
      font-size: 13px;
      padding: 20px;
    }

    .chat-input-bar {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      background: #0a0a0a;
      border-top: 1px solid #222;
      position: sticky;
      bottom: 0;
      z-index: 2;
      box-shadow: 0 -8px 20px rgba(0, 0, 0, 0.45);
      flex-shrink: 0;
      padding-bottom: calc(12px + env(safe-area-inset-bottom));
    }
    .chat-input {
      flex: 1;
      padding: 10px 14px;
      background: #111;
      border: 1px solid #333;
      border-radius: 20px;
      color: #fff;
      font-size: 14px;
      font-family: inherit;
      outline: none;
    }
    .chat-input::placeholder { color: #555; }
    .chat-input:focus { border-color: #00bfa6; }
    .send-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00bfa6, #00796b);
      border: none;
      color: #000;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 120ms;
    }
    .send-btn:active { transform: scale(0.92); }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  `],
})
export class ChatComponent implements OnInit, OnDestroy {
  messages = signal<any[]>([]);
  chatPartner = signal('Vendor');
  loadingMessages = signal(true);
  newMessage = '';
  bookingId = '';
  currentUserId = '';

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private pollInterval: any;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private auth: AuthService,
  ) { }

  ngOnInit() {
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') || '';
    this.currentUserId = this.auth.currentUser?.id || '';

    this.loadMessages();
    this.pollInterval = setInterval(() => this.pollMessages(), 3000);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  private loadMessages() {
    this.api.getChatMessages(this.bookingId).subscribe({
      next: (res: any) => {
        this.messages.set(res.data?.messages || []);
        if (res.data?.otherUser?.name) this.chatPartner.set(res.data.otherUser.name);
        this.loadingMessages.set(false);
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: () => this.loadingMessages.set(false),
    });
  }

  private pollMessages() {
    const msgs = this.messages();
    const since = msgs.length > 0 ? msgs[msgs.length - 1].created_at : '';

    this.api.pollChatMessages(this.bookingId, since).subscribe({
      next: (res: any) => {
        const newMsgs = res.data || [];
        if (newMsgs.length > 0) {
          this.messages.update(current => this.mergeMessages(current, newMsgs));
          setTimeout(() => this.scrollToBottom(), 50);
        }
      },
    });
  }

  sendMessage() {
    const content = this.newMessage.trim();
    if (!content) return;

    this.newMessage = '';
    this.api.sendChatMessage(this.bookingId, content).subscribe({
      next: (res: any) => {
        const msg = res.data;
        this.messages.update(current => this.mergeMessages(current, [msg]));
        setTimeout(() => this.scrollToBottom(), 50);
      },
    });
  }

  private mergeMessages(current: any[], incoming: any[]) {
    const byId = new Map<string, any>();
    for (const msg of current) {
      if (msg?.id) byId.set(msg.id, msg);
    }
    for (const msg of incoming) {
      if (msg?.id && !byId.has(msg.id)) {
        byId.set(msg.id, msg);
      }
    }
    return Array.from(byId.values()).sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return aTime - bTime;
    });
  }

  private scrollToBottom() {
    if (this.messagesContainer?.nativeElement) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  goBack() {
    history.back();
  }
}
