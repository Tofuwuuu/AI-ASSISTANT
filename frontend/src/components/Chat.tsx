import React, { useState, useRef, useEffect } from "react";

type Message = {
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
};

interface ChatProps {
	pdfId: string;
}

const Chat: React.FC<ChatProps> = ({ pdfId }) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const sendMessage = async () => {
		if (!input.trim() || loading) return;
		
		const userMessage: Message = { 
			role: "user", 
			content: input.trim(),
			timestamp: new Date()
		};
		setMessages((prev) => [...prev, userMessage]);
		setLoading(true);
		
		try {
			const response = await fetch("http://localhost:8080/query", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ pdf_id: pdfId, question: input.trim() }),
			});
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			
			const data = await response.json();
			const assistantMessage: Message = {
				role: "assistant",
				content: data.answer || data.error || "I couldn't process your request. Please try again.",
				timestamp: new Date()
			};
			
			setMessages((prev) => [...prev, assistantMessage]);
		} catch (err) {
			const errorMessage: Message = {
				role: "assistant",
				content: "Sorry, I encountered an error while processing your request. Please check your connection and try again.",
				timestamp: new Date()
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setLoading(false);
			setInput("");
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	return (
		<div className="chat-container">
			<div className="chat-header">
				<div className="chat-title">
					<div className="chat-icon">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
						</svg>
					</div>
					<h3>Chat with your PDF</h3>
				</div>
				<p className="chat-subtitle">Ask questions about your document</p>
			</div>

			<div className="chat-messages">
				{messages.length === 0 ? (
					<div className="empty-state">
						<div className="empty-icon">
							<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
								<path d="M13 8H7"/>
								<path d="M17 12H7"/>
							</svg>
						</div>
						<h4>Start a conversation</h4>
						<p>Ask questions about your PDF document to get instant answers powered by AI.</p>
						<div className="suggestion-chips">
							<button 
								className="suggestion-chip"
								onClick={() => setInput("What is this document about?")}
							>
								What is this document about?
							</button>
							<button 
								className="suggestion-chip"
								onClick={() => setInput("Summarize the main points")}
							>
								Summarize the main points
							</button>
							<button 
								className="suggestion-chip"
								onClick={() => setInput("What are the key findings?")}
							>
								What are the key findings?
							</button>
						</div>
					</div>
				) : (
					<>
						{messages.map((msg, idx) => (
							<div
								key={idx}
								className={`message ${msg.role === "user" ? "user-message" : "assistant-message"}`}
							>
								<div className="message-avatar">
									{msg.role === "user" ? (
										<div className="user-avatar">
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
												<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
												<circle cx="12" cy="7" r="4"/>
											</svg>
										</div>
									) : (
										<div className="assistant-avatar">
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
												<path d="M12 2L2 7l10 5 10-5-10-5z"/>
												<path d="M2 17l10 5 10-5"/>
												<path d="M2 12l10 5 10-5"/>
											</svg>
										</div>
									)}
								</div>
								<div className="message-content">
									<div className="message-header">
										<span className="message-role">
											{msg.role === "user" ? "You" : "AI Assistant"}
										</span>
										<span className="message-time">{formatTime(msg.timestamp)}</span>
									</div>
									<div className="message-text">{msg.content}</div>
								</div>
							</div>
						))}
						{loading && (
							<div className="message assistant-message">
								<div className="message-avatar">
									<div className="assistant-avatar">
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<path d="M12 2L2 7l10 5 10-5-10-5z"/>
											<path d="M2 17l10 5 10-5"/>
											<path d="M2 12l10 5 10-5"/>
										</svg>
									</div>
								</div>
								<div className="message-content">
									<div className="message-header">
										<span className="message-role">AI Assistant</span>
									</div>
									<div className="typing-indicator">
										<div className="typing-dots">
											<span></span>
											<span></span>
											<span></span>
										</div>
										<span className="typing-text">Thinking...</span>
									</div>
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</>
				)}
			</div>

			<div className="chat-input-container">
				<form className="chat-input-form" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
					<div className="input-wrapper">
						<input
							ref={inputRef}
							type="text"
							className="chat-input"
							placeholder="Ask a question about your PDF..."
							value={input}
							onChange={e => setInput(e.target.value)}
							onKeyPress={handleKeyPress}
							disabled={loading}
						/>
						<button
							type="submit"
							className="send-button"
							disabled={loading || !input.trim()}
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<line x1="22" y1="2" x2="11" y2="13"/>
								<polygon points="22,2 15,22 11,13 2,9 22,2"/>
							</svg>
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Chat;
