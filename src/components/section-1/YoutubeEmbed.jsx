
const YoutubeEmbed = () => {
  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl">
      <iframe
        className="w-full aspect-video"
        src="https://www.youtube.com/embed/c1IQEbl25Tw?si=z4wS4qgwd5DDve5O"
        title="Music Video"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default YoutubeEmbed;
