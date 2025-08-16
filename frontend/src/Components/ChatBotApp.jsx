import { useEffect, useRef, useState } from 'react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import './ChatBotApp.css'

export const ChatBotApp = ({onGoBack, chats, setChats, activeChat, setActiveChat, onNewChat}) => {

    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState(chats[0]?.messages || []);
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showChatList, setShowChatList] = useState(false);
    const chatsEndRef = useRef(null);

    useEffect(() => {
        const activeChatObj = chats.find((chat) => chat.id === activeChat);
        setMessages(activeChatObj ? activeChatObj.messages : []); 
    }, [activeChat,chats]);

    useEffect(() => {
        if(activeChat){
            const storedMessages = JSON.parse(localStorage.getItem(activeChat)) || [];
            setMessages(storedMessages);
        }
    }, [activeChat]);

    useEffect(() => {
    fetch("https://chat-bot-ia.onrender.com/ping")
        .then(res => res.text())
        .then(data => console.log("Respuesta del backend:", data))
        .catch(err => console.error("Error al hacer ping:", err));
}, []);

    const handleEmojiSelect = (emoji) => {
        setInputValue((prevInput) => prevInput + emoji.native);
        setShowEmojiPicker(false);
    }

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

    const sendMessage = async () => {
        if (!inputValue.trim()) return;

        const newMessages = [...messages, { role: "user", 
                                            content: inputValue, 
                                            timestamp: new Date().toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' }) }];
        setMessages(newMessages);
        setInputValue("");
        setIsTyping(true);

        try {
            const response = await fetch("https://chat-bot-ia.onrender.com/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: newMessages }) // importante: enviar historial
            });

            const data = await response.json();

            const updatedMessages = [
            ...newMessages,
            { role: "assistant", 
                content: data.reply || "Error al obtener respuesta." ,
                timestamp: new Date().toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' })
            }

            ];

            setMessages(updatedMessages);
            localStorage.setItem(activeChat, JSON.stringify(updatedMessages));
            setIsTyping(false);

            // 🔄 Actualizar el chat activo en el array de chats
            const updatedChats = chats.map(chat =>
            chat.id === activeChat
                ? { ...chat, messages: updatedMessages }
                : chat
            );
            setChats(updatedChats);
            localStorage.setItem("chats", JSON.stringify(updatedChats));

        } catch (error) {
            console.error(error);
            const errorMessage = { role: "assistant", content: "Error de conexión con el servidor.", timestamp: new Date().toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' }) };
            const updatedMessages = [...newMessages, errorMessage];
            setMessages(updatedMessages);
            localStorage.setItem(activeChat, JSON.stringify(updatedMessages));
            setIsTyping(false);

            const updatedChats = chats.map(chat =>
            chat.id === activeChat
                ? { ...chat, messages: updatedMessages }
                : chat
            );
            setChats(updatedChats);
            localStorage.setItem("chats", JSON.stringify(updatedChats));
        }
    };


    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    };

    const handleSelectChat = (chatId) => {
        setActiveChat(chatId);
    };

    const handleDeleteChat = (chatId) => {
        const updatedChats = chats.filter((chat) => chat.id !== chatId);
        setChats(updatedChats);
        localStorage.setItem("chats", JSON.stringify(updatedChats));
        localStorage.removeItem(chatId);

        if(chatId === activeChat){
            const newActiveChat = updatedChats.length > 0 ? updatedChats[0].id : null;
            setActiveChat(newActiveChat);
        }
    };

    useEffect(() => {
        chatsEndRef.current?.scrollIntoView({ behavior: "smooth" }); //usa el ref para hacer scroll al final del chat
    }, [messages]);

    // Ping automático para no dejar que duerma el servicio de render
    useEffect(() => {
        const pingInterval = setInterval(() => {
            fetch("https://chat-bot-ia.onrender.com/ping")
                .then(() => console.log("Ping enviado"))
                .catch((err) => console.error("Error al hacer ping:", err));
        }, 1000 * 60 * 10);

        return () => clearInterval(pingInterval);
    }, []);


    return (
        <div className='chat-app'>
            <div className={`chat-list ${showChatList ? 'show' : ''}`}>
                <div className="chat-list-header">
                    <h2> Chats </h2>
                    <div>
                        <i className="bx bx-edit-alt new-chat" onClick={onNewChat}></i>
                        <i className="bx bx-x-circle close-list" onClick={() => setShowChatList(false)}></i>
                    </div>
                    
                </div>
                {chats.map((chat) => (
                    <div key={chat.id} className={`chat-list-item ${chat.id === activeChat ? 'active' : ''}`}
                        onClick={() => handleSelectChat(chat.id)}>
                        <h4> {chat.displayId} </h4>
                        <i className="bx bx-x-circle" onClick={(e) => {e.stopPropagation(); handleDeleteChat(chat.id)}}></i>
                    </div>
                ))}
                
            </div>
            <div className="chat-window">
                <div className="chat-title">
                    <h3> Chat con IA </h3>
                    <i className="bx bx-menu" onClick={() => setShowChatList(true)}></i>
                    <i className="bx bx-arrow-back arrow" onClick={onGoBack}></i>
                </div>
                <div className="chat">
                    {messages.map((message, index) => (
                        <div key={index} className={message.role === "user" ? "prompt" : "response"}>
                            {message.content}
                            {message.timestamp && (
                                <div className="msg-time">{message.timestamp}</div>
                            )}

                        </div>
                    ))}
                    
                    {isTyping &&
                        <div className="typing">
                            Escribiendo...
                        </div>
                    }
                    <div ref={chatsEndRef}></div>
                    
                </div>
                <form className='msg-form' onSubmit={(e) => e.preventDefault()}>
                    <i className="fa-solid fa-face-smile emoji" onClick={() => setShowEmojiPicker((prev) => !prev)}></i>
                    {showEmojiPicker && (
                        <div className="picker">
                            <Picker data={data} onEmojiSelect={handleEmojiSelect} />
                        </div>
                    )}
                    <input type="text" className='msg-input'
                        placeholder='Escribe un mensaje...'
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowEmojiPicker(false)}
                    />
                    <i className="fa-solid fa-paper-plane" onClick={sendMessage}></i>
                </form>
            </div>

        </div>
    )
}

