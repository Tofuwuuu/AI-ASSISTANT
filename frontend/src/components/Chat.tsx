import React, { useState } from "react";

type Message = {
	role: "user" | "assistant";
	content: string;
};

interface ChatProps {
	pdfId: string;
}

const Chat: React.FC<ChatProps> = ({ pdfId }) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);

	const sendMessage = async () => {
		if (!input.trim()) return;
		const userMessage: Message = { role: "user", content: input };
		setMessages((prev) => [...prev, userMessage]);
		setLoading(true);
		try {
			const response = await fetch("http://localhost:8080/query", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ pdf_id: pdfId, question: input }),
			});
			const data = await response.json();
			setMessages((prev) => [
				...prev,
				{ role: "assistant", content: data.answer || data.error || "No response" },
			]);
		} catch (err) {
			setMessages((prev) => [...prev, { role: "assistant", content: "Error fetching answer." }]);
		} finally {
			setLoading(false);
			setInput("");
		}
	};

	return (
		<div className="chat-ui">
			<div className="chat-messages">
				{messages.map((msg, idx) => (
					<div
						key={idx}
						className={`chat-bubble ${msg.role === "user" ? "chat-user" : "chat-assistant"}`}
					>
						{msg.role === "assistant" && <div className="chat-label">AI Assistant</div>}
						{msg.content}
					</div>
				))}
				{loading && <div className="chat-processing">Processing...</div>}
			</div>
			<form
				className="chat-input-row"
				onSubmit={e => { e.preventDefault(); sendMessage(); }}
			>
				<input
					type="text"
					className="chat-input"
					placeholder="Type a message..."
					value={input}
					onChange={e => setInput(e.target.value)}
					disabled={loading}
				/>
				<button
					type="submit"
					className="chat-send-btn"
					disabled={loading || !input.trim()}
				>
					Send
				</button>
			</form>
		</div>
	);
};

export default Chat;
