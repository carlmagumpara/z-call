import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash } from 'react-icons/fa';

function Video({ index, item, count }) {
  return (
    <div
      className="peer-tile"
    >
      <video
        {...item}
        className="peer-video"
      />
      <div className="peer-name">
        <p>{item.myself ? 'You' : item.user?.username}</p>
        <p>{item.media?.audio ? <FaMicrophone /> : <FaMicrophoneSlash />}</p>
        <p>{item.media?.video ? <FaVideo /> : <FaVideoSlash />}</p>
      </div>
    </div>
  )
}

export default Video;