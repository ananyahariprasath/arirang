
const YoutubeEmbed = () => {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl relative w-full aspect-[16/16]">
      <iframe
        className="absolute top-0 left-0 w-full h-full border-0"
        src="https://www.youtube.com/embed/c1IQEbl25Tw?si=z4wS4qgwd5DDve5O"
        title="Music Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default YoutubeEmbed;
