import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash } from 'react-icons/fa';

function Video({ index, item, count }) {

  const tileSize = (idx) => {
    if (count === 0) return "0%";
    if (count === 1) return "50%";
    if (count === 2) return "49%";
    if (count === 3) return idx === 2 ? "98%" : "49%";
    if (count === 4) return "49%";
    if (count === 5) return idx < 2 ? "48%" : "32%";
    return "32%";
  };

  const tileHeight = () => {
    if (count === 1) {
      return "50vh"
    };
    if (count <= 6) {
      return "50vh"
    };
    return "calc(100vh / 3)";
  };

  const tileWrapperStyle = (idx) => ({
    flex: `0 0 ${tileSize(idx)}`,
    maxWidth: tileSize(idx),
    minWidth: 120,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
    height: tileHeight(),
    backgroundColor: '#000000'
  });

  return (
    <div
      key={index}
      style={tileWrapperStyle(index)}
      className="rounded position-relative"
    >
      <video
        {...item}
        style={{
          width: '100%',
          height: '100%',
        }}
        className="object-fit-cover rounded"
      />
      <div 
        className="position-absolute p-2 w-100 d-flex justify-content-center align-items-center"
        style={{
          left: 0,
          bottom: 0,
        }}
     >
        <p className="text-white mb-0">{item.user?.username}</p>
        <p className="text-white mb-0 d-flex justify-content-center align-items-center gap-3">
          {item.media?.audio ? <FaMicrophone /> : <FaMicrophoneSlash />} 
          {item.media?.video ? <FaVideo /> : <FaVideoSlash />}
        </p>
      </div>
    </div>
  )
}

export default Video;