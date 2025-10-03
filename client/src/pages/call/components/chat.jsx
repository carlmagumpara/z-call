import { MdSend } from 'react-icons/md';

function Chat() {
  return (
    <div className="vc-chat-container">
      <div className="vc-chat-history"></div>
      <div className="vc-chat-input input-group">
        <input
          type="text"
          className="input px-3" 
          name="message" 
          placeholder="Write your message..." 
        />
        <button
          className="btn px-2"
        >
          <MdSend />
        </button>
      </div>
    </div>
  )
}

export default Chat;