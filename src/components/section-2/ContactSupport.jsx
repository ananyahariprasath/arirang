import { useState } from "react";
import { useToast } from "../../context/ToastContext";

function ContactSupport({ isInsideDrawer = false }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    socialMedia: "",
    id: "",
    query: "",
  });

  const socialMediaOptions = [
    "X (Twitter)",
    "Instagram",
    "Weverse",
    "Facebook",
    "Telegram",
    "TikTok",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.socialMedia || !formData.id || !formData.query) {
      toast.show("Please fill in all fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socialMedia: formData.socialMedia,
          userId: formData.id,
          query: formData.query,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit support request");
      }

      toast.show("Support request submitted!", "success");
      setFormData({ socialMedia: "", id: "", query: "" });
    } catch (error) {
      toast.show(error.message || "Failed to submit support request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className={isInsideDrawer ? "" : "sticky top-28"}>
      <div
        className="bg-[var(--card-bg)]/40
                      backdrop-blur-xl
                      border border-[var(--accent)]/40
                      rounded-3xl
                      p-5 shadow-2xl"
      >
        <h3 className="text-lg font-bold mb-4 text-center">Contact Support</h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <select
            name="socialMedia"
            value={formData.socialMedia}
            onChange={handleChange}
            className="w-full py-3 px-4 rounded-xl border border-[var(--accent)]/50 
                       bg-[var(--card-bg)]/20 backdrop-blur-sm
                       text-[var(--text-primary)] 
                       focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--card-bg)]/30
                       transition-all duration-300 cursor-pointer"
          >
            <option value="" disabled className="bg-[var(--card-bg)] text-[var(--text-primary)]">
              Select Social Media Platform
            </option>
            {socialMediaOptions.map((platform) => (
              <option key={platform} value={platform} className="bg-[var(--card-bg)] text-[var(--text-primary)]">
                {platform}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="id"
            value={formData.id}
            onChange={handleChange}
            placeholder="ID"
            className="w-full py-3 px-4 rounded-xl border border-[var(--accent)]/50 
                       bg-[var(--card-bg)]/20 backdrop-blur-sm
                       text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50
                       focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--card-bg)]/30
                       transition-all duration-300"
          />

          <textarea
            name="query"
            value={formData.query}
            onChange={handleChange}
            placeholder="Query"
            rows="3"
            className="w-full py-3 px-4 rounded-xl border border-[var(--accent)]/50 
                       bg-[var(--card-bg)]/20 backdrop-blur-sm
                       text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/50
                       focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--card-bg)]/30
                       transition-all duration-300 resize-none"
          ></textarea>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl border-2 border-[var(--text-primary)] 
                       hover:bg-[var(--accent)] hover:text-black hover:border-[var(--accent)]
                       font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "SUBMITTING..." : "SUBMIT"}
          </button>

          <p className="text-[10px] italic text-center opacity-60 leading-relaxed mt-2">
            *If you are not able to reach us through this form, you can contact us directly through our socials given in the Help Desk.
          </p>
        </form>
      </div>
    </div>
  );
}

export default ContactSupport;
