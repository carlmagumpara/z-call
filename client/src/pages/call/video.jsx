import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash } from 'react-icons/fa';

function Video({ index, item, count }) {

  const tileSize = (idx) => {
    if (count === 0) return "0%";
    if (count === 1) return "50%";
    if (count === 2) return "50%";
    if (count === 3) return "50%";
    if (count === 4) return "50%";
    if (count === 5) return idx < 2 ? "50%" : "33.3333333333%";
    return "33.3333333333%";
  };

  const tileHeight = () => {
    if (count === 1) {
      return "50%"
    };
    if (count <= 6) {
      return "50%"
    };

    return "calc(100vh / 3)";
  };

  const tileWrapperStyle = (idx) => ({
    flex: `0 0 ${tileSize(idx)}`,
    maxWidth: tileSize(idx),
    minWidth: 120,
    height: tileHeight(),
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
  });

  return (
    <div
      style={tileWrapperStyle(index)}
      className="rounded p-3"
    >
      <div 
        className="position-relative"
          style={{
            width: '100%',
            height: '100%',
          }}
      >
        {!item.media?.video ? (
          <div
            className="w-100 h-100 text-center position-absolute d-flex justify-content-center align-items-center"
          >
            <h1 className="text-white mb-0">{item.user?.username}</h1>
          </div>
        ) : null}
        <video
          {...item}
          style={{
            width: '100%',
            height: '100%',
          }}
          className="w-100 h-100 object-fit-cover rounded bg-secondary"
        />
        <div 
          className="position-absolute p-3 w-100 d-flex justify-content-between align-items-center"
          style={{
            left: 0,
            bottom: 0,
            height: 30,
          }}
       >
          {item.media?.video ? <p className="text-white mb-0">{item.user?.username}</p> : <div />}
          <p className="text-white mb-0 d-flex justify-content-center align-items-center gap-3">
            {item.media?.audio ? <FaMicrophone /> : <FaMicrophoneSlash />} 
            {item.media?.video ? <FaVideo /> : <FaVideoSlash />}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Video;